/**
 * Workflow Orchestrator for MyPhonics Book Builder
 *
 * Manages the multi-step pipeline for building phonics books as PDFs:
 *   1. Validate  — check content file exists and has valid structure
 *   2. Prepare   — load and transform book data for rendering
 *   3. Generate  — render book content to PDF via pdfkit
 *   4. Verify    — confirm output file exists and has non-zero size
 *
 * Usage:
 *   node scripts/workflow-orchestrator.js --book 6.1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

class WorkflowOrchestrator {
  constructor(bookId) {
    this.bookId = bookId;
    this.contentPath = path.join(ROOT, 'content', `book-${bookId}.json`);
    this.outputDir = path.join(ROOT, 'output');
    this.outputPath = path.join(this.outputDir, `book-${bookId}.pdf`);
    this.bookData = null;
    this.steps = [];
    this.startTime = Date.now();
  }

  log(step, message, status = 'info') {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const icons = { info: '  ', ok: ' ✓', fail: ' ✗', run: ' ▸' };
    const icon = icons[status] || '  ';
    console.log(`[${elapsed}s]${icon} [${step}] ${message}`);
  }

  async run() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║        MyPhonics Book Builder — Orchestrator     ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`  Book: ${this.bookId}`);
    console.log(`  Content: ${this.contentPath}`);
    console.log(`  Output:  ${this.outputPath}`);
    console.log('');

    const pipeline = [
      { name: 'validate', fn: () => this.validate() },
      { name: 'prepare', fn: () => this.prepare() },
      { name: 'generate', fn: () => this.generate() },
      { name: 'verify', fn: () => this.verify() },
    ];

    for (const step of pipeline) {
      this.log(step.name, 'Starting…', 'run');
      try {
        await step.fn();
        this.steps.push({ name: step.name, status: 'ok' });
        this.log(step.name, 'Done', 'ok');
      } catch (err) {
        this.steps.push({ name: step.name, status: 'fail', error: err.message });
        this.log(step.name, err.message, 'fail');
        this.printSummary(false);
        process.exit(1);
      }
    }

    this.printSummary(true);
  }

  // ---- Pipeline steps -----------------------------------------------------

  validate() {
    if (!fs.existsSync(this.contentPath)) {
      throw new Error(`Content file not found: ${this.contentPath}`);
    }

    const raw = fs.readFileSync(this.contentPath, 'utf-8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('Content file is not valid JSON');
    }

    const required = ['id', 'title', 'level', 'book', 'pages'];
    for (const field of required) {
      if (!(field in data)) {
        throw new Error(`Missing required field: "${field}"`);
      }
    }

    if (!Array.isArray(data.pages) || data.pages.length === 0) {
      throw new Error('Book must contain at least one page');
    }

    this.log('validate', `Found ${data.pages.length} pages in "${data.title}"`);
  }

  prepare() {
    const raw = fs.readFileSync(this.contentPath, 'utf-8');
    this.bookData = JSON.parse(raw);

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    this.log('prepare', `Loaded book: "${this.bookData.title}" (Level ${this.bookData.level}, Book ${this.bookData.book})`);
  }

  async generate() {
    const { generateBookPDF } = await import('./pdf-generator.js');
    await generateBookPDF(this.bookData, this.outputPath, (msg) => this.log('generate', msg));
  }

  verify() {
    if (!fs.existsSync(this.outputPath)) {
      throw new Error('PDF file was not created');
    }

    const stats = fs.statSync(this.outputPath);
    if (stats.size === 0) {
      throw new Error('PDF file is empty');
    }

    const sizeKB = (stats.size / 1024).toFixed(1);
    this.log('verify', `PDF size: ${sizeKB} KB`);
  }

  // ---- Reporting ----------------------------------------------------------

  printSummary(success) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log('');
    console.log('─────────────────────────────────────────────────');
    console.log('  Pipeline Summary');
    console.log('─────────────────────────────────────────────────');
    for (const s of this.steps) {
      const icon = s.status === 'ok' ? '✓' : '✗';
      const extra = s.error ? ` — ${s.error}` : '';
      console.log(`  ${icon}  ${s.name}${extra}`);
    }
    console.log('─────────────────────────────────────────────────');
    if (success) {
      console.log(`  Result: SUCCESS (${elapsed}s)`);
      console.log(`  Output: ${this.outputPath}`);
    } else {
      console.log(`  Result: FAILED (${elapsed}s)`);
    }
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let bookId = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      bookId = args[i + 1];
      i++;
    }
  }

  if (!bookId) {
    console.error('Usage: node scripts/workflow-orchestrator.js --book <id>');
    console.error('Example: node scripts/workflow-orchestrator.js --book 6.1');
    process.exit(1);
  }

  return bookId;
}

const bookId = parseArgs();
const orchestrator = new WorkflowOrchestrator(bookId);
orchestrator.run();
