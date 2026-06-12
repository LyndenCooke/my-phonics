const fs=require("fs"); const path=require("path");
const stories=JSON.parse(fs.readFileSync("C:/Users/ASUS/myphonicsbooks/worksheet-engine/output/_research/stories_all.json","utf8"));
const dataDir="C:/Users/ASUS/myphonicsbooks/worksheet-engine/src/data/workbook2";
const pubDir="C:/Users/ASUS/myphonicsbooks/worksheet-engine/public/storyart";
const imgBase="C:/Users/ASUS/myphonicsbooks/myphonics_books/output/images";
let copied=0, missing=[];
for (const f of fs.readdirSync(dataDir)) {
  if (!/^l\d\.ts$/.test(f)) continue;
  const t=fs.readFileSync(path.join(dataDir,f),"utf8");
  for (const m of t.matchAll(/\/storyart\/l(\d)_(\d)\/page(\d+)\.png/g)) {
    const [_, lvl, book, pg]=m;
    const newId=`${lvl}.${book}`;
    const old=(stories[newId]||{}).old_id;
    if (!old) { missing.push(`${newId} (no story)`); continue; }
    const src=path.join(imgBase, `L${old.replace(".","_")}_B1`, `page${pg}.png`);
    const dstDir=path.join(pubDir, `l${lvl}_${book}`);
    const dst=path.join(dstDir, `page${pg}.png`);
    if (!fs.existsSync(src)) { missing.push(src); continue; }
    fs.mkdirSync(dstDir,{recursive:true});
    if (!fs.existsSync(dst)) { fs.copyFileSync(src,dst); copied++; }
  }
}
console.log(`copied ${copied}; missing: ${missing.length}`); missing.forEach(m=>console.log("  MISSING "+m));
