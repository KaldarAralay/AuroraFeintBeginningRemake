#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const sourceDir = path.join(
  __dirname,
  "..",
  "Aurora_Feint_The_Beginning_1.0.0.1_ios_0.0",
  "Payload",
  "iMmo.app"
);
const outputDir = path.join(__dirname, "..", "web", "assets", "audio");

const stepTable = [
  7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73,
  80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494,
  544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749,
  3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635,
  13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767,
];
const indexTable = [-1, -1, -1, -1, 2, 4, 6, 8];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readCaf(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString("ascii", 0, 4) !== "caff") throw new Error(`${file}: not a CAF file`);

  const chunks = {};
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    offset += 4;
    const size = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
    chunks[type] = { offset, size };
    offset += size;
  }

  const desc = chunks.desc;
  const data = chunks.data;
  if (!desc || !data) throw new Error(`${file}: missing desc/data chunks`);

  return {
    sampleRate: buffer.readDoubleBE(desc.offset),
    format: buffer.toString("ascii", desc.offset + 8, desc.offset + 12),
    bytesPerPacket: buffer.readUInt32BE(desc.offset + 16),
    framesPerPacket: buffer.readUInt32BE(desc.offset + 20),
    channels: buffer.readUInt32BE(desc.offset + 24),
    audio: buffer.subarray(data.offset + 4, data.offset + data.size),
  };
}

function decodeIma4Block(block) {
  const header = block.readUInt16BE(0);
  let predictor = header & 0xff80;
  if (predictor & 0x8000) predictor -= 0x10000;
  let stepIndex = clamp(header & 0x7f, 0, 88);
  const samples = new Int16Array(64);
  let out = 0;

  for (let i = 2; i < 34; i += 1) {
    const byte = block[i];
    for (const nibble of [byte & 0x0f, byte >> 4]) {
      const step = stepTable[stepIndex];
      let diff = step >> 3;
      if (nibble & 1) diff += step >> 2;
      if (nibble & 2) diff += step >> 1;
      if (nibble & 4) diff += step;
      predictor += nibble & 8 ? -diff : diff;
      predictor = clamp(predictor, -32768, 32767);
      stepIndex = clamp(stepIndex + indexTable[nibble & 7], 0, 88);
      samples[out++] = predictor;
    }
  }

  return samples;
}

function wavBuffer(samples, sampleRate, channels) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i += 1) buffer.writeInt16LE(samples[i], 44 + i * 2);
  return buffer;
}

function convert(file) {
  const caf = readCaf(file);
  if (caf.format !== "ima4") return null;
  if (caf.bytesPerPacket !== 34 * caf.channels || caf.framesPerPacket !== 64) {
    throw new Error(`${file}: unexpected ima4 packet layout`);
  }

  const packets = Math.floor(caf.audio.length / caf.bytesPerPacket);
  const output = new Int16Array(packets * caf.framesPerPacket * caf.channels);
  let write = 0;

  for (let packet = 0; packet < packets; packet += 1) {
    const packetOffset = packet * caf.bytesPerPacket;
    const channelSamples = [];
    for (let channel = 0; channel < caf.channels; channel += 1) {
      const blockOffset = packetOffset + channel * 34;
      channelSamples.push(decodeIma4Block(caf.audio.subarray(blockOffset, blockOffset + 34)));
    }
    for (let frame = 0; frame < caf.framesPerPacket; frame += 1) {
      for (let channel = 0; channel < caf.channels; channel += 1) {
        output[write++] = channelSamples[channel][frame];
      }
    }
  }

  return wavBuffer(output, caf.sampleRate, caf.channels);
}

fs.mkdirSync(outputDir, { recursive: true });

let converted = 0;
for (const name of fs.readdirSync(sourceDir).filter((entry) => entry.endsWith(".caf")).sort()) {
  const wav = convert(path.join(sourceDir, name));
  if (!wav) continue;
  const safeName = name
    .replace(/\.caf$/i, ".wav")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");
  fs.writeFileSync(path.join(outputDir, safeName), wav);
  converted += 1;
}

console.log(`Converted ${converted} ima4 CAF files to ${path.relative(process.cwd(), outputDir)}.`);
