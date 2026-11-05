import zlib from 'node:zlib';

/** Converts a WOFF 1.0 font to TTF/OTF, so the SVG renderer (resvg) can shape Arabic text with it. */
export const woffToSfnt = (woff: Buffer): Buffer => {
  if (woff.toString('ascii', 0, 4) !== 'wOFF') throw new Error('Not a WOFF 1.0 file');
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const tables = Array.from({ length: numTables }, (_, i) => {
    const o = 44 + i * 20;
    const tag = woff.readUInt32BE(o), offset = woff.readUInt32BE(o + 4), compLength = woff.readUInt32BE(o + 8);
    const origLength = woff.readUInt32BE(o + 12), checksum = woff.readUInt32BE(o + 16);
    const raw = woff.subarray(offset, offset + compLength);
    return { tag, checksum, data: compLength < origLength ? zlib.inflateSync(raw) : Buffer.from(raw) };
  });
  const pow2 = 2 ** Math.floor(Math.log2(numTables));
  let offset = 12 + numTables * 16;
  const header = Buffer.alloc(offset);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(pow2 * 16, 6);
  header.writeUInt16BE(Math.log2(pow2), 8);
  header.writeUInt16BE(numTables * 16 - pow2 * 16, 10);
  const parts: Buffer[] = [header];
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    header.writeUInt32BE(t.tag, r); header.writeUInt32BE(t.checksum, r + 4);
    header.writeUInt32BE(offset, r + 8); header.writeUInt32BE(t.data.length, r + 12);
    const padded = Buffer.alloc(Math.ceil(t.data.length / 4) * 4);
    t.data.copy(padded);
    parts.push(padded);
    offset += padded.length;
  });
  return Buffer.concat(parts);
};
