#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(
  root,
  "Aurora_Feint_The_Beginning_1.0.0.1_ios_0.0",
  "Payload",
  "iMmo.app"
);
const outputDir = path.join(root, "web", "assets");

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function readChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Not a PNG file");
  }

  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return chunks;
}

function bytesPerPixel(colorType, bitDepth) {
  if (bitDepth !== 8) {
    throw new Error(`Unsupported PNG bit depth ${bitDepth}`);
  }

  if (colorType === 6) return 4;
  if (colorType === 2) return 3;
  if (colorType === 4) return 2;
  if (colorType === 0 || colorType === 3) return 1;
  throw new Error(`Unsupported PNG color type ${colorType}`);
}

function paeth(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
}

function unfilterScanlines(data, width, height, bpp) {
  const rowLength = width * bpp;
  const output = Buffer.alloc(rowLength * height);
  let offset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = data[offset];
    offset += 1;
    const rowStart = y * rowLength;
    const previousRowStart = rowStart - rowLength;

    for (let x = 0; x < rowLength; x += 1) {
      const raw = data[offset];
      offset += 1;
      const left = x >= bpp ? output[rowStart + x - bpp] : 0;
      const up = y > 0 ? output[previousRowStart + x] : 0;
      const upLeft = y > 0 && x >= bpp ? output[previousRowStart + x - bpp] : 0;

      let value = raw;
      if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) value = raw + paeth(left, up, upLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);

      output[rowStart + x] = value & 0xff;
    }
  }

  return output;
}

function addFilterZeroRows(rawPixels, rowLength, height) {
  const filtered = Buffer.alloc((rowLength + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const sourceStart = y * rowLength;
    const destStart = y * (rowLength + 1);
    filtered[destStart] = 0;
    rawPixels.copy(filtered, destStart + 1, sourceStart, sourceStart + rowLength);
  }
  return filtered;
}

function inflateIdat(idat) {
  try {
    return zlib.inflateRawSync(idat);
  } catch {
    return zlib.inflateSync(idat);
  }
}

function unpremultiply(value, alpha) {
  if (alpha === 0) return 0;
  return Math.max(0, Math.min(255, Math.round((value * 255) / alpha)));
}

function convertCgbiPng(buffer) {
  const chunks = readChunks(buffer);
  const hasCgbi = chunks.some((chunk) => chunk.type === "CgBI");
  if (!hasCgbi) return buffer;

  const ihdr = chunks.find((chunk) => chunk.type === "IHDR");
  if (!ihdr) throw new Error("Missing IHDR chunk");

  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];
  const compression = ihdr.data[10];
  const filter = ihdr.data[11];
  const interlace = ihdr.data[12];

  if (compression !== 0 || filter !== 0 || interlace !== 0) {
    throw new Error("Unsupported PNG compression/filter/interlace mode");
  }

  const bpp = bytesPerPixel(colorType, bitDepth);
  const idat = Buffer.concat(
    chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data)
  );
  const inflated = inflateIdat(idat);
  const pixels = unfilterScanlines(inflated, width, height, bpp);

  if (colorType === 6) {
    for (let i = 0; i < pixels.length; i += 4) {
      const storedBlue = pixels[i];
      const storedGreen = pixels[i + 1];
      const storedRed = pixels[i + 2];
      const alpha = pixels[i + 3];
      pixels[i] = unpremultiply(storedRed, alpha);
      pixels[i + 1] = unpremultiply(storedGreen, alpha);
      pixels[i + 2] = unpremultiply(storedBlue, alpha);
      pixels[i + 3] = alpha;
    }
  } else if (colorType === 2) {
    for (let i = 0; i < pixels.length; i += 3) {
      const storedBlue = pixels[i];
      pixels[i] = pixels[i + 2];
      pixels[i + 2] = storedBlue;
    }
  }

  const filtered = addFilterZeroRows(pixels, width * bpp, height);
  const standardIdat = zlib.deflateSync(filtered, { level: 9 });
  const outputChunks = [
    PNG_SIGNATURE,
    makeChunk("IHDR", Buffer.from(ihdr.data)),
    makeChunk("IDAT", standardIdat),
    makeChunk("IEND"),
  ];

  return Buffer.concat(outputChunks);
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".png"));
  let converted = 0;
  let copied = 0;

  for (const file of files) {
    const source = path.join(sourceDir, file);
    const output = path.join(outputDir, file);
    const inputBuffer = fs.readFileSync(source);
    const outputBuffer = convertCgbiPng(inputBuffer);
    fs.writeFileSync(output, outputBuffer);
    if (outputBuffer === inputBuffer) copied += 1;
    else converted += 1;
  }

  const trailerSource = path.join(sourceDir, "opening_trailer.m4v");
  if (fs.existsSync(trailerSource)) {
    fs.copyFileSync(trailerSource, path.join(outputDir, "opening_trailer.m4v"));
  }

  console.log(`PNG assets ready: ${converted} converted, ${copied} copied.`);
}

main();
