// Demo: the "write about the picture" remake with OUR OWN artwork in the slots.
// Generates four house-style scenes via Vertex (cached in artcache/), then
// renders the same layout the vision pass read off the uploaded sheet.
//   node demo-scenes.mjs
import path from 'node:path';
import { ensureScenes } from './content/artgen.mjs';
import { renderFitted, closeBrowser } from './render.mjs';
import { FORGE_ROOT } from './design/tokens.mjs';

// Our own character and our own situations — the layout is the borrowed idea,
// the content is ours.
const SCENES = [
  { key: 'scene-bo-1', description: 'a happy young boy sitting on the grass holding out a ball, his brown dog sitting opposite him wagging its tail, one large EMPTY thought bubble above the dog' },
  { key: 'scene-bo-2', description: 'a young boy in a coat holding a lead, his brown dog straining forward towards a park gate, one large EMPTY thought bubble above the dog' },
  { key: 'scene-bo-3', description: 'a young boy tipping food into a bowl, his brown dog watching the bowl closely, one large EMPTY thought bubble above the dog' },
  { key: 'scene-bo-4', description: 'a muddy brown dog standing in a puddle shaking water off, a young boy beside it laughing, one large EMPTY thought bubble above the dog' },
];

const ok = await ensureScenes(SCENES, { log: (m) => console.log(`  ${m}`) });
console.log(`  scenes ready: ${ok.length}/${SCENES.length}`);

const spec = {
  subject: 'literacy',
  title: 'Write about what Bo is thinking',
  topic: 'Writing about pictures',
  stage: 'Year 2',
  strand: 'Writing',
  seed: 3,
  slug: 'demo-write-about-bo',
  blocks: [
    {
      type: 'illustrated_write',
      title: '',
      instr: 'Look at each picture. What is Bo thinking? Write it in sentences.',
      linesPerItem: 3,
      artWidthMm: 56,
      items: SCENES.map((s) => (ok.includes(s.key) ? { picture: s.key } : {})),
    },
    { type: 'check_strip', items: ['capital letters', 'gaps', 'full stops'] },
  ],
};

const { pdf, png, overflow } = await renderFitted(spec, path.join(FORGE_ROOT, 'output'));
console.log(`✓ ${pdf}${overflow > 0.5 ? `  OVERFLOW ${overflow}mm` : ''}`);
console.log(`  preview: ${png}`);
await closeBrowser();
