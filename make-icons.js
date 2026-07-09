// One-shot PNG icon generator (no dependencies) — renders the beamed-note mark
// from icon.svg at 512 and 180 px. Run: node make-icons.js
const zlib = require("zlib"), fs = require("fs");

function crc32(buf){
  let c, table = crc32.table || (crc32.table = Array.from({length:256}, (_, n) => {
    c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  }));
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(file, size, pixelFn){
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++){
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++){
      // 2x2 supersample for smooth edges
      let r = 0, g = 0, b = 0;
      for (const [dx, dy] of [[.25,.25],[.75,.25],[.25,.75],[.75,.75]]){
        const [pr, pg, pb] = pixelFn((x + dx) / size, (y + dy) / size);
        r += pr; g += pg; b += pb;
      }
      const o = row + 1 + x * 3;
      raw[o] = r / 4; raw[o+1] = g / 4; raw[o+2] = b / 4;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;   // 8-bit RGB
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]));
  console.log("wrote", file);
}

// geometry in 0..1 space, mirroring icon.svg (512 viewBox)
const S = v => v / 512;
const inRect = (x, y, rx, ry, rw, rh) => x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
function inEllipse(x, y, cx, cy, rx, ry, deg){
  const a = -deg * Math.PI / 180, dx = x - cx, dy = y - cy;
  const u = dx * Math.cos(a) - dy * Math.sin(a), v = dx * Math.sin(a) + dy * Math.cos(a);
  return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1;
}
function inBeam(x, y){ // polygon (198,150)-(316,116)-(316,152)-(198,186)
  if (x < S(198) || x > S(316)) return false;
  const t = (x - S(198)) / (S(316) - S(198));
  const top = S(150) + (S(116) - S(150)) * t;
  return y >= top && y <= top + S(36);
}
const BG = [11, 11, 13], ACCENT = [230, 69, 90];
function pixel(x, y){
  const ring = Math.hypot(x - .5, y - .5);
  const mark =
    inRect(x, y, S(198), S(150), S(16), S(182)) ||
    inRect(x, y, S(300), S(128), S(16), S(182)) ||
    inBeam(x, y) ||
    inEllipse(x, y, S(176), S(338), S(42), S(31), -20) ||
    inEllipse(x, y, S(278), S(316), S(42), S(31), -20);
  if (mark) return ACCENT;
  if (Math.abs(ring - S(168)) < S(7))   // faint ring, 28% accent
    return BG.map((c, i) => c + (ACCENT[i] - c) * .28);
  return BG;
}

writePng("icon-512.png", 512, pixel);
writePng("icon-180.png", 180, pixel);
