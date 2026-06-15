const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
p.author = "Lynden Cooke";
p.title = "MyPhonicsBooks Booklet Plan L1-L8";

const HEAD = "Trebuchet MS";
const BODY = "Calibri";
const INK = "1E1B4B";
const INK2 = "2E2A66";
const PAPER = "F7F7FB";
const MUTE = "6B7280";
const CARD = "FFFFFF";
const LINE = "E5E7EB";

const LEVELS = [
  { n:1, name:"Ditties",          c:"E84B8A", phase:"Phase 2 (sets 1-2)",  age:"Reception 4-5", sheets:"10 sounds", pages:21,
    gpc:"s a t p i n m d g o", gram:"Oral sentence, finger spaces" },
  { n:2, name:"First Sounds",     c:"F97066", phase:"Phase 2 (sets 3-5)",  age:"Reception 4-5", sheets:"19 sounds", pages:31,
    gpc:"c k ck e u r h b f ff l ll ss j v w x y z", gram:"Capitals, full stops, capital I" },
  { n:3, name:"Special Friends",  c:"F59E0B", phase:"Phase 3 digraphs",    age:"Reception late 4-5", sheets:"7 sounds", pages:20,
    gpc:"sh nk ch th ng qu zz", gram:"Question marks, proper nouns" },
  { n:4, name:"Longer Sounds",    c:"22C55E", phase:"RWI Set 2 vowels",    age:"Reception-Y1 4-6", sheets:"11 sounds", pages:24,
    gpc:"ay ee igh ow oo ar or air ir ou oy", gram:"Join with 'and', end marks, plurals" },
  { n:5, name:"New Spellings",    c:"3B82F6", phase:"Phase 5 split digraphs", age:"Year 1 5-6", sheets:"10 sounds", pages:25,
    gpc:"a-e i-e o-e u-e ea ie oi aw ai oa", gram:"Suffixes, prefix un-, commas, sequencing" },
  { n:6, name:"Building Fluency", c:"6366F1", phase:"Phase 5 alternatives", age:"Y1-Y2 5-7", sheets:"14 sounds", pages:29,
    gpc:"ur er are ow ew ue + wr kn ge dge mb gn ph wh", gram:"Sentence types, noun phrases, conjunctions" },
  { n:7, name:"Reading Together", c:"8B5CF6", phase:"Phase 5 trigraphs",   age:"Year 2 6-7", sheets:"6 sounds", pages:20,
    gpc:"ire ore ear oor ure tion", gram:"Apostrophes, homophones, recount" },
  { n:8, name:"Reading Champion", c:"14B8A6", phase:"Phase 6 morphology",  age:"Y2-Y3 6-8", sheets:"5 suffix", pages:19,
    gpc:"-ous -cious -tious -able -ible", gram:"Fronted adverbials, speech marks, editing" },
];

const W = 13.33, H = 7.5;
function bg(s, col){ s.background = { color: col }; }
function chipRow(s, x, y, size, gap){
  LEVELS.forEach((l,i)=>{
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x:x+i*(size+gap), y, w:size, h:size, fill:{color:l.c}, line:{type:"none"}, rectRadius:0.05 });
    s.addText(String(l.n), { x:x+i*(size+gap), y, w:size, h:size, align:"center", valign:"middle", fontFace:HEAD, bold:true, color:"FFFFFF", fontSize:13, margin:0 });
  });
}
function footer(s, label){
  s.addText([
    {text:"MyPhonicsBooks", options:{bold:true, color:"8B5CF6"}},
    {text:"   ·   decodable phonics worksheet system   ·   plan for review", options:{color:MUTE}},
  ], { x:0.5, y:H-0.45, w:9, h:0.3, fontFace:BODY, fontSize:9, margin:0, align:"left" });
  s.addText(label, { x:W-3.0, y:H-0.45, w:2.5, h:0.3, fontFace:BODY, fontSize:9, color:MUTE, align:"right", margin:0 });
}

// Slide 1: Title
let s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.RECTANGLE, { x:0, y:0, w:0.28, h:H, fill:{color:"8B5CF6"} });
s.addText("Printable Worksheet Booklet System", { x:0.9, y:1.5, w:11.5, h:0.5, fontFace:BODY, fontSize:16, color:"C9B6FB", charSpacing:2, margin:0 });
s.addText("One pack per level, L1 to L8", { x:0.85, y:2.0, w:11.6, h:1.4, fontFace:HEAD, bold:true, fontSize:46, color:"FFFFFF", margin:0 });
s.addText("A page-by-page plan across four strands: phonics, handwriting, grammar and science. Built on the locked Single-Sound master and the 8-level Curriculum Ledger.",
  { x:0.9, y:3.5, w:9.6, h:1.0, fontFace:BODY, fontSize:15, color:"D8D5F0", margin:0 });
chipRow(s, 0.9, 4.9, 0.62, 0.18);
s.addText("8 levels  ·  189 pages planned  ·  77 sound sheets  ·  1 template built, ~30 to build",
  { x:0.9, y:5.75, w:11.5, h:0.4, fontFace:BODY, fontSize:13, italic:true, color:"9D99C9", margin:0 });
s.addText("Prepared for Lynden Cooke  ·  7 June 2026", { x:0.9, y:6.5, w:8, h:0.3, fontFace:BODY, fontSize:11, color:"7C78A8", margin:0 });

// Slide 2: Decisions
s = p.addSlide(); bg(s, PAPER);
s.addText("Three decisions before any build", { x:0.6, y:0.45, w:12, h:0.7, fontFace:HEAD, bold:true, fontSize:32, color:INK, margin:0 });
s.addText("Surfaced from the sources, not guessed. The ledger is the single source of truth.", { x:0.62, y:1.15, w:12, h:0.4, fontFace:BODY, fontSize:14, color:MUTE, margin:0 });
const dec = [
  ["1","8 levels, not 6","The Drive PDF is the old v1.0 (6 levels). The repo ledger is v2.1 (8 levels) and matches levelThemes.ts and the migration prompt. Planned to 8. The Drive PDF needs re-exporting.","F59E0B"],
  ["2","“Science” has no source","Science appears nowhere as a strand. The only hit is the example word for grapheme 'sc' at L6. Not invented. Default: out of v1, optional “Word and World” page from existing cultural briefs.","E84B8A"],
  ["3","Data files are stale","graphemes_by_level.json and the book art folders are still 6-level. Page content is correct (from the ledger) but the data must be remapped before a template reads it live.","3B82F6"],
];
let dy = 1.75, dh = 1.6, dgap = 0.18;
dec.forEach((d,i)=>{
  const y = dy + i*(dh+dgap);
  s.addShape(p.shapes.RECTANGLE, { x:0.6, y, w:12.1, h:dh, fill:{color:CARD}, line:{color:LINE,width:1} });
  s.addShape(p.shapes.RECTANGLE, { x:0.6, y, w:0.12, h:dh, fill:{color:d[3]} });
  s.addShape(p.shapes.OVAL, { x:0.95, y:y+dh/2-0.42, w:0.84, h:0.84, fill:{color:d[3]} });
  s.addText(d[0], { x:0.95, y:y+dh/2-0.42, w:0.84, h:0.84, align:"center", valign:"middle", fontFace:HEAD, bold:true, fontSize:30, color:"FFFFFF", margin:0 });
  s.addText(d[1], { x:2.1, y:y+0.2, w:10.3, h:0.5, fontFace:HEAD, bold:true, fontSize:20, color:INK, margin:0 });
  s.addText(d[2], { x:2.1, y:y+0.72, w:10.3, h:0.8, fontFace:BODY, fontSize:13.5, color:"374151", margin:0 });
});
footer(s, "Decisions");

// Slide 3: 8-level system
s = p.addSlide(); bg(s, PAPER);
s.addText("The 8-level system", { x:0.6, y:0.45, w:9, h:0.7, fontFace:HEAD, bold:true, fontSize:32, color:INK, margin:0 });
s.addText("Aligned to RWI Speed Sound Sets and the KS1 National Curriculum. Each level has its own colour, read from getLevelTheme() and never hard-coded.", { x:0.62, y:1.15, w:12.1, h:0.5, fontFace:BODY, fontSize:14, color:MUTE, margin:0 });
const cols = 4, cw = 2.95, ch = 2.35, gx = 0.18, gy = 0.2, ox = 0.6, oy = 1.85;
LEVELS.forEach((l,i)=>{
  const r = Math.floor(i/cols), c = i%cols;
  const x = ox + c*(cw+gx), y = oy + r*(ch+gy);
  s.addShape(p.shapes.RECTANGLE, { x, y, w:cw, h:ch, fill:{color:CARD}, line:{color:LINE,width:1} });
  s.addShape(p.shapes.RECTANGLE, { x, y, w:cw, h:0.62, fill:{color:l.c} });
  s.addText("L"+l.n, { x:x+0.12, y:y+0.06, w:1.2, h:0.5, fontFace:HEAD, bold:true, fontSize:22, color:"FFFFFF", margin:0, valign:"middle" });
  s.addText(l.name, { x:x+1.0, y:y+0.06, w:cw-1.1, h:0.5, fontFace:HEAD, bold:true, fontSize:14, color:"FFFFFF", margin:0, valign:"middle", align:"right" });
  s.addText(l.phase, { x:x+0.14, y:y+0.72, w:cw-0.28, h:0.3, fontFace:BODY, bold:true, fontSize:11.5, color:l.c, margin:0 });
  s.addText(l.age, { x:x+0.14, y:y+1.0, w:cw-0.28, h:0.3, fontFace:BODY, fontSize:10.5, color:MUTE, margin:0 });
  s.addText([
    {text: l.sheets, options:{bold:true, color:INK}},
    {text:"   ·   "+l.pages+" pages", options:{color:"374151"}},
  ], { x:x+0.14, y:y+1.34, w:cw-0.28, h:0.3, fontFace:BODY, fontSize:11.5, margin:0 });
  s.addText(l.gpc, { x:x+0.14, y:y+1.66, w:cw-0.28, h:0.62, fontFace:BODY, fontSize:9.5, italic:true, color:"4B5563", margin:0 });
});
footer(s, "Level system");

// Slide 4: anatomy
s = p.addSlide(); bg(s, INK);
s.addText("What one level pack contains", { x:0.6, y:0.5, w:12, h:0.7, fontFace:HEAD, bold:true, fontSize:30, color:"FFFFFF", margin:0 });
s.addText("The same spine every level, so children, parents and teachers know what to expect. The content scales with the phonics level.", { x:0.62, y:1.2, w:12, h:0.4, fontFace:BODY, fontSize:14, color:"C9B6FB", margin:0 });
const flow = [
  ["Front matter","Cover in the level colour with the book mascot, contents index, parent how-to","9D99C9"],
  ["Phonics","One Single-Sound sheet per new grapheme, plus a sound mat, spelling sort and tricky words","E84B8A"],
  ["Handwriting","Formation to joining to fluency. Every guideline drawn by TraceLine, never by hand","22C55E"],
  ["Grammar","One mini-skill per book focus, plus the 'Say it, write it, check it' sentence page","3B82F6"],
  ["Back matter","A mixed review or challenge page, then a level certificate","14B8A6"],
];
let fy = 1.9, fh = 0.84, fgap = 0.12;
flow.forEach((f,i)=>{
  const y = fy + i*(fh+fgap);
  s.addShape(p.shapes.RECTANGLE, { x:0.6, y, w:12.1, h:fh, fill:{color:INK2}, line:{type:"none"} });
  s.addShape(p.shapes.RECTANGLE, { x:0.6, y, w:2.7, h:fh, fill:{color:f[2]} });
  s.addText(f[0], { x:0.7, y, w:2.5, h:fh, fontFace:HEAD, bold:true, fontSize:16, color:"FFFFFF", valign:"middle", margin:0 });
  s.addText(f[1], { x:3.55, y, w:8.95, h:fh, fontFace:BODY, fontSize:13, color:"E5E2F5", valign:"middle", margin:0 });
});
s.addText("Science sits outside this spine for v1, pending a scope decision.", { x:0.62, y:6.85, w:12, h:0.3, fontFace:BODY, fontSize:11, italic:true, color:"9D99C9", margin:0 });

// Slides 5-6: detail
function levelDetailSlide(group, label){
  const sl = p.addSlide(); bg(sl, PAPER);
  sl.addText("Levels at a glance: "+label, { x:0.6, y:0.4, w:12, h:0.6, fontFace:HEAD, bold:true, fontSize:26, color:INK, margin:0 });
  const cw=6.05, ch=2.55, gx=0.2, gy=0.22, ox=0.6, oy=1.2;
  group.forEach((l,i)=>{
    const r=Math.floor(i/2), c=i%2;
    const x=ox+c*(cw+gx), y=oy+r*(ch+gy);
    sl.addShape(p.shapes.RECTANGLE, { x, y, w:cw, h:ch, fill:{color:CARD}, line:{color:LINE,width:1} });
    sl.addShape(p.shapes.RECTANGLE, { x, y, w:cw, h:0.7, fill:{color:l.c} });
    sl.addText("L"+l.n+"  "+l.name, { x:x+0.18, y:y+0.05, w:cw-1.8, h:0.6, fontFace:HEAD, bold:true, fontSize:19, color:"FFFFFF", valign:"middle", margin:0 });
    sl.addText(l.pages+" pp", { x:x+cw-1.6, y:y+0.05, w:1.45, h:0.6, fontFace:HEAD, bold:true, fontSize:18, color:"FFFFFF", align:"right", valign:"middle", margin:0 });
    sl.addText([
      {text:"Phonics  ", options:{bold:true, color:l.c}},
      {text:l.sheets+"   ", options:{color:"374151"}},
      {text:"·  "+l.phase, options:{color:MUTE}},
    ], { x:x+0.18, y:y+0.82, w:cw-0.36, h:0.32, fontFace:BODY, fontSize:11.5, margin:0 });
    sl.addText([
      {text:"New code:  ", options:{bold:true, color:INK}},
      {text:l.gpc, options:{italic:true, color:"4B5563"}},
    ], { x:x+0.18, y:y+1.2, w:cw-0.36, h:0.6, fontFace:BODY, fontSize:10.5, margin:0, valign:"top" });
    sl.addText([
      {text:"Grammar:  ", options:{bold:true, color:INK}},
      {text:l.gram, options:{color:"4B5563"}},
    ], { x:x+0.18, y:y+1.95, w:cw-0.36, h:0.5, fontFace:BODY, fontSize:10.5, margin:0, valign:"top" });
  });
  footer(sl, label);
}
levelDetailSlide(LEVELS.slice(0,4), "L1 to L4");
levelDetailSlide(LEVELS.slice(4,8), "L5 to L8");

// Slide 7: backlog
s = p.addSlide(); bg(s, PAPER);
s.addText("Template backlog", { x:0.6, y:0.45, w:9, h:0.7, fontFace:HEAD, bold:true, fontSize:32, color:INK, margin:0 });
s.addText("Every template obeys the locked spec: A4 in mm, ~96% height fill, inline headers, boxless trace, Andika via TraceLine, level colour from getLevelTheme().", { x:0.62, y:1.15, w:12.1, h:0.5, fontFace:BODY, fontSize:13.5, color:MUTE, margin:0 });
const stats = [["1","template built","22C55E","SingleSound, the locked master"],["~30","to build","8B5CF6","cover, handwriting, grammar, spelling, sentence"],["9","drafts to reconcile","F59E0B","existing templates to QA against the spec"]];
stats.forEach((st,i)=>{
  const x=0.6+i*4.1;
  s.addShape(p.shapes.RECTANGLE, { x, y:1.85, w:3.85, h:1.5, fill:{color:CARD}, line:{color:LINE,width:1} });
  s.addShape(p.shapes.RECTANGLE, { x, y:1.85, w:3.85, h:0.1, fill:{color:st[2]} });
  s.addText(st[0], { x:x+0.1, y:2.0, w:3.65, h:0.8, fontFace:HEAD, bold:true, fontSize:40, color:st[2], margin:0 });
  s.addText(st[1], { x:x+0.12, y:2.8, w:3.6, h:0.3, fontFace:HEAD, bold:true, fontSize:14, color:INK, margin:0 });
  s.addText(st[3], { x:x+0.12, y:3.08, w:3.6, h:0.3, fontFace:BODY, fontSize:10.5, color:MUTE, margin:0 });
});
s.addText("Priority 0 templates, the four that unlock most pages", { x:0.6, y:3.7, w:12, h:0.4, fontFace:HEAD, bold:true, fontSize:16, color:INK, margin:0 });
const p0 = [
  ["BookletCover + ContentsPage","cover in level colour with mascot, numbered index"],
  ["HandwritingCopy","TraceLine rows, x-height shrinks by level, formation to joins"],
  ["TrickyWords","trace, read and look-cover-write-check per level"],
  ["Sentence-writing family","Hold a Sentence, picture prompt, genre frame recount"],
];
p0.forEach((q,i)=>{
  const r=Math.floor(i/2), c=i%2;
  const x=0.6+c*6.15, y=4.2+r*1.0;
  s.addShape(p.shapes.RECTANGLE, { x, y, w:5.95, h:0.85, fill:{color:"EEF0FB"}, line:{color:"C9B6FB",width:1} });
  s.addText(q[0], { x:x+0.15, y:y+0.08, w:5.7, h:0.35, fontFace:HEAD, bold:true, fontSize:13.5, color:"4338CA", margin:0 });
  s.addText(q[1], { x:x+0.15, y:y+0.43, w:5.7, h:0.35, fontFace:BODY, fontSize:11, color:"374151", margin:0 });
});
footer(s, "Backlog");

// Slide 8: clipart
s = p.addSlide(); bg(s, PAPER);
s.addText("Assets and clipart", { x:0.6, y:0.45, w:9, h:0.7, fontFace:HEAD, bold:true, fontSize:32, color:INK, margin:0 });
s.addText("Flat single-object clipart, pure-white background, trimmed tight. One shared namespace, a reused word is generated once.", { x:0.62, y:1.15, w:12.1, h:0.45, fontFace:BODY, fontSize:13.5, color:MUTE, margin:0 });
const cstats = [["13","assets exist","22C55E"],["~125","new objects","8B5CF6"],["8","cover mascots","E84B8A"],["~6","comprehension scenes","3B82F6"]];
cstats.forEach((st,i)=>{
  const x=0.6+i*3.05;
  s.addShape(p.shapes.RECTANGLE, { x, y:1.8, w:2.85, h:1.4, fill:{color:CARD}, line:{color:LINE,width:1} });
  s.addText(st[0], { x:x+0.1, y:1.95, w:2.65, h:0.7, fontFace:HEAD, bold:true, fontSize:38, color:st[2], margin:0 });
  s.addText(st[1], { x:x+0.12, y:2.7, w:2.6, h:0.35, fontFace:HEAD, bold:true, fontSize:13, color:INK, margin:0, valign:"top" });
});
s.addShape(p.shapes.RECTANGLE, { x:0.6, y:3.55, w:12.1, h:2.45, fill:{color:"FDEAF2"}, line:{color:"F6B8D2",width:1.5} });
s.addText("The locked eye rule for every creature", { x:0.85, y:3.75, w:11.6, h:0.4, fontFace:HEAD, bold:true, fontSize:18, color:"C2185B", margin:0 });
s.addText([
  {text:"Cat, ant, rat, fox, owl and every other creature use small solid pure-black round dot eyes.", options:{breakLine:true, bold:true}},
  {text:"Never large or wide eyes. No white shines. No coloured irises. This matches the storybook characters and is a non-negotiable.", options:{}},
], { x:0.85, y:4.25, w:11.6, h:1.0, fontFace:BODY, fontSize:14, color:"7A1238", margin:0 });
s.addText("Generate clipart with generate-clipart.mjs, mascots with generate-mascot.mjs, trim with trim-clipart.mjs.", { x:0.85, y:5.45, w:11.6, h:0.4, fontFace:BODY, fontSize:11.5, italic:true, color:"9B5A74", margin:0 });
footer(s, "Assets");

// Slide 9: build order
s = p.addSlide(); bg(s, PAPER);
s.addText("Recommended build order", { x:0.6, y:0.45, w:12, h:0.7, fontFace:HEAD, bold:true, fontSize:32, color:INK, margin:0 });
const steps = [
  ["Unblock the data","Remap to 8 levels, confirm the Science decision and the Drive PDF re-export"],
  ["Build P0 shell templates","Cover, contents, handwriting, tricky words, sentence writing"],
  ["Pilot L1 end to end","Cover to 10 sound sheets to certificate, render PDF, pass visual QA"],
  ["Generate L1 to L3 clipart","Heaviest creature load, verify the dot-eye rule on every one"],
  ["Build grammar and spelling templates","Use the ready L3 and L4 design docs, author the missing ones"],
  ["Roll out L2 to L8 packs","Mostly new data, few new templates, then cross-level audit"],
];
steps.forEach((st,i)=>{
  const r=Math.floor(i/2), c=i%2;
  const x=0.6+c*6.15, y=1.55+r*1.55;
  const col = LEVELS[i].c;
  s.addShape(p.shapes.RECTANGLE, { x, y, w:5.95, h:1.35, fill:{color:CARD}, line:{color:LINE,width:1} });
  s.addShape(p.shapes.OVAL, { x:x+0.2, y:y+0.28, w:0.78, h:0.78, fill:{color:col} });
  s.addText(String(i+1), { x:x+0.2, y:y+0.28, w:0.78, h:0.78, align:"center", valign:"middle", fontFace:HEAD, bold:true, fontSize:26, color:"FFFFFF", margin:0 });
  s.addText(st[0], { x:x+1.15, y:y+0.18, w:4.7, h:0.5, fontFace:HEAD, bold:true, fontSize:15, color:INK, margin:0 });
  s.addText(st[1], { x:x+1.15, y:y+0.66, w:4.7, h:0.6, fontFace:BODY, fontSize:11.5, color:"374151", margin:0 });
});
footer(s, "Build order");

// Slide 10: next
s = p.addSlide(); bg(s, INK);
s.addShape(p.shapes.RECTANGLE, { x:0, y:0, w:0.28, h:H, fill:{color:"8B5CF6"} });
s.addText("Over to you", { x:0.9, y:1.4, w:11, h:0.9, fontFace:HEAD, bold:true, fontSize:40, color:"FFFFFF", margin:0 });
s.addText("The full page-by-page plan lives in worksheet-engine/docs/booklet_plan.md. No templates built yet, as asked.", { x:0.92, y:2.5, w:10.5, h:0.6, fontFace:BODY, fontSize:15, color:"D8D5F0", margin:0 });
const asks = [
  ["Settle Science","Out of v1, or an optional 'Word and World' page from the cultural briefs?"],
  ["Confirm the data remap","Run the 8-level migration so templates read correct content"],
  ["Start the P0 templates","Handwriting, tricky words, sentence family, cover and contents complete a full L1 pack"],
];
asks.forEach((a,i)=>{
  const y=3.35+i*1.05;
  s.addShape(p.shapes.OVAL, { x:0.95, y:y+0.05, w:0.5, h:0.5, fill:{color:LEVELS[i+4].c} });
  s.addText(String(i+1), { x:0.95, y:y+0.05, w:0.5, h:0.5, align:"center", valign:"middle", fontFace:HEAD, bold:true, fontSize:18, color:"FFFFFF", margin:0 });
  s.addText([
    {text:a[0]+"   ", options:{bold:true, color:"FFFFFF"}},
    {text:a[1], options:{color:"B9B5DE"}},
  ], { x:1.7, y:y, w:10.8, h:0.6, fontFace:BODY, fontSize:14.5, valign:"middle", margin:0 });
});
chipRow(s, 0.95, 6.65, 0.42, 0.14);

p.writeFile({ fileName: "/sessions/bold-sharp-mccarthy/mnt/myphonicsbooks/worksheet-engine/docs/booklet_plan_slides.pptx" }).then(()=>console.log("written"));
