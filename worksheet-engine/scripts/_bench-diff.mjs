import sharp from 'sharp';
for (let i = 1; i <= 12; i++) {
  const n = String(i).padStart(2, '0');
  const a = `output/qa_L6/p${n}.png`;
  const b = `output/_bench_check/p-${n}.png`;
  const ia = sharp(a); const ib = sharp(b);
  const ma = await ia.metadata(); const mb = await ib.metadata();
  if (ma.width !== mb.width || ma.height !== mb.height) {
    console.log(`p${n}: size ${ma.width}x${ma.height} vs ${mb.width}x${mb.height} — resizing for compare`);
  }
  const w = Math.min(ma.width, mb.width), h = Math.min(ma.height, mb.height);
  const da = await ia.resize(w, h).greyscale().raw().toBuffer();
  const db = await ib.resize(w, h).greyscale().raw().toBuffer();
  let diff = 0;
  for (let j = 0; j < da.length; j++) if (Math.abs(da[j] - db[j]) > 32) diff++;
  console.log(`p${n}: ${diff} differing pixels of ${da.length} (${(100*diff/da.length).toFixed(3)}%)`);
}
