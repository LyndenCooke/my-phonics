const fs=require("fs");
for (const n of [3,4,5,7,8]) {
  const ts=fs.readFileSync(`C:/Users/ASUS/myphonicsbooks/worksheet-engine/src/data/grammar/l${n}.ts`,"utf8");
  console.log(`\n##### l${n} #####`);
  // split per unit by "code"
  const units=ts.split(/"id":\s*"/).slice(1);
  for (const u of units) {
    const code=(u.match(/"code":\s*"([^"]+)"/)||[])[1];
    const fmt=(u.match(/"format":\s*"(\w+)"/)||[])[1];
    const name=(u.match(/"name":\s*"([^"]+)"/)||[])[1];
    console.log(`--- ${code} (${fmt}) ${name}`);
    if (fmt==="rewrite") {
      const rows=[...u.matchAll(/"text":\s*"([^"]*)",\s*\n\s*"answer":\s*"([^"]*)"/g)];
      rows.forEach((r,i)=>console.log(`  r${i}: ${r[1]} => ${r[2]}`));
    } else if (fmt==="tickgrid") {
      const cols=(u.match(/"columns":\s*\[([^\]]*)\]/)||[])[1];
      console.log(`  cols: ${cols ? cols.replace(/\s+/g," ") : "?"}`);
      const rows=[...u.matchAll(/\{\s*"text":\s*"([^"]*)",\s*\n?\s*"answer":\s*"([^"]*)"/g)];
      rows.forEach((r,i)=>console.log(`  r${i}: ${r[1]} => ${r[2]}`));
    } else if (fmt==="match") {
      const rows=[...u.matchAll(/"left":\s*"([^"]*)",\s*\n?\s*"right":\s*"([^"]*)"/g)];
      rows.forEach((r,i)=>console.log(`  r${i}: ${r[1]} => ${r[2]}`));
    } else if (fmt==="build") {
      const bank=(u.match(/"wordBank":\s*\[([^\]]*)\]/)||[])[1];
      console.log(`  bank: ${bank ? bank.replace(/\s+/g," ") : "?"}`);
      const rows=[...u.matchAll(/"base":\s*"([^"]*)",\s*\n?\s*"answer":\s*"([^"]*)"/g)];
      rows.forEach((r,i)=>console.log(`  r${i}: ${r[1]} => ${r[2]}`));
    } else if (fmt==="cloze") {
      const bank=(u.match(/"wordBank":\s*\[([^\]]*)\]/)||[])[1];
      console.log(`  bank: ${bank ? bank.replace(/\s+/g," ") : "?"}`);
      const rows=[...u.matchAll(/"before":\s*"([^"]*)",\s*\n?\s*"after":\s*"([^"]*)",\s*\n?\s*"answer":\s*"([^"]*)"/g)];
      rows.forEach((r,i)=>console.log(`  r${i}: ${r[1]} ___ ${r[2]} => ${r[3]}`));
    } else if (fmt==="circle") {
      const rows=[...u.matchAll(/\{\s*"text":\s*"([^"]*)"/g)];
      rows.forEach((r,i)=>console.log(`  r${i}: ${r[1]}`));
    }
  }
}
