/**
 * PDF Generator for MyPhonics Books
 *
 * Renders structured book JSON into a styled, child-friendly PDF using pdfkit.
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Colour palette (matches the app's Tailwind theme)
// ---------------------------------------------------------------------------
const COLORS = {
  primary: '#1E40AF',    // deep blue
  accent: '#06B6D4',     // cyan
  dark: '#1E293B',       // slate-800
  muted: '#64748B',      // slate-500
  light: '#F0F9FF',      // sky-50
  white: '#FFFFFF',
  highlight: '#FEF3C7',  // amber-100
  success: '#16A34A',    // green-600
  border: '#CBD5E1',     // slate-300
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function drawRoundedRect(doc, x, y, w, h, r) {
  doc.moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y);
}

function pageFooter(doc, bookData, pageNum) {
  const y = doc.page.height - 40;
  doc.fontSize(8).fillColor(COLORS.muted);
  doc.text(`MyPhonics · Level ${bookData.level} · ${bookData.title}`, 50, y, {
    width: doc.page.width - 150,
    align: 'left',
  });
  doc.text(`${pageNum}`, doc.page.width - 80, y, { width: 30, align: 'right' });
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

function renderTitlePage(doc, bookData) {
  // Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.primary);

  // Decorative circles
  doc.circle(80, 120, 60).fill('#2563EB');
  doc.circle(doc.page.width - 60, 200, 40).fill('#3B82F6');
  doc.circle(100, doc.page.height - 150, 50).fill('#2563EB');
  doc.circle(doc.page.width - 80, doc.page.height - 100, 30).fill('#3B82F6');

  // Level badge
  const badgeY = 180;
  doc.save();
  doc.roundedRect(doc.page.width / 2 - 80, badgeY, 160, 36, 18).fill(COLORS.accent);
  doc.fontSize(14).fillColor(COLORS.white);
  doc.text(`Level ${bookData.level} · Book ${bookData.book}`, 0, badgeY + 10, {
    width: doc.page.width,
    align: 'center',
  });
  doc.restore();

  // Title
  doc.fontSize(42).fillColor(COLORS.white);
  doc.text(bookData.title, 60, 260, {
    width: doc.page.width - 120,
    align: 'center',
  });

  // Subtitle
  doc.fontSize(16).fillColor('#93C5FD');
  doc.text(bookData.subtitle || '', 60, 330, {
    width: doc.page.width - 120,
    align: 'center',
  });

  // Description
  if (bookData.description) {
    doc.fontSize(12).fillColor('#BFDBFE');
    doc.text(bookData.description, 80, 400, {
      width: doc.page.width - 160,
      align: 'center',
      lineGap: 4,
    });
  }

  // Skills box
  if (bookData.skills && bookData.skills.length > 0) {
    const boxY = 490;
    doc.save();
    doc.roundedRect(80, boxY, doc.page.width - 160, 24 + bookData.skills.length * 22, 10)
      .fillOpacity(0.15).fill(COLORS.white);
    doc.fillOpacity(1);
    doc.fontSize(11).fillColor('#93C5FD');
    doc.text('Skills in this book:', 100, boxY + 8);
    bookData.skills.forEach((skill, i) => {
      doc.fontSize(11).fillColor(COLORS.white);
      doc.text(`•  ${skill}`, 110, boxY + 28 + i * 22);
    });
    doc.restore();
  }

  // Series label at bottom
  doc.fontSize(10).fillColor('#93C5FD');
  doc.text('MyPhonics Independence Series', 0, doc.page.height - 60, {
    width: doc.page.width,
    align: 'center',
  });
}

function renderStoryPage(doc, page, bookData, pageNum) {
  // Header bar
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.light);
  doc.rect(0, 80, doc.page.width, 3).fill(COLORS.accent);

  // Chapter heading
  doc.fontSize(22).fillColor(COLORS.primary);
  doc.text(page.heading, 50, 30, { width: doc.page.width - 100 });

  // Body text
  doc.fontSize(13).fillColor(COLORS.dark);
  const textTop = 110;
  doc.text(page.text, 50, textTop, {
    width: doc.page.width - 100,
    align: 'left',
    lineGap: 6,
    paragraphGap: 10,
  });

  // Highlight words box
  if (page.highlight_words && page.highlight_words.length > 0) {
    const wordsY = doc.y + 30;
    if (wordsY < doc.page.height - 120) {
      doc.save();
      const boxH = 50;
      drawRoundedRect(doc, 50, wordsY, doc.page.width - 100, boxH, 8);
      doc.fillOpacity(1).fill(COLORS.highlight);

      doc.fontSize(10).fillColor(COLORS.primary);
      doc.text('Key words:  ', 65, wordsY + 10, { continued: true });
      doc.fillColor(COLORS.dark);
      doc.text(page.highlight_words.join('  ·  '), { lineGap: 4 });
      doc.restore();
    }
  }

  pageFooter(doc, bookData, pageNum);
}

function renderActivityPage(doc, page, bookData, pageNum) {
  // Header
  doc.rect(0, 0, doc.page.width, 80).fill('#FEF3C7');
  doc.rect(0, 80, doc.page.width, 3).fill('#F59E0B');

  doc.fontSize(22).fillColor('#92400E');
  doc.text(page.heading, 50, 30, { width: doc.page.width - 100 });

  doc.fontSize(13).fillColor(COLORS.dark);
  doc.text(page.text, 50, 110, {
    width: doc.page.width - 100,
    lineGap: 6,
    paragraphGap: 10,
  });

  pageFooter(doc, bookData, pageNum);
}

function renderCertificatePage(doc, page, bookData) {
  // Ornamental border
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.white);
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
    .lineWidth(3).strokeColor(COLORS.primary).stroke();
  doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
    .lineWidth(1).strokeColor(COLORS.accent).stroke();

  // Star decoration
  const cx = doc.page.width / 2;
  doc.circle(cx, 130, 30).fill(COLORS.accent);
  doc.fontSize(28).fillColor(COLORS.white);
  doc.text('★', cx - 14, 114);

  // Certificate heading
  doc.fontSize(30).fillColor(COLORS.primary);
  doc.text('Reading Certificate', 0, 190, { width: doc.page.width, align: 'center' });

  doc.fontSize(14).fillColor(COLORS.muted);
  doc.text('This certifies that', 0, 250, { width: doc.page.width, align: 'center' });

  // Name line
  doc.moveTo(cx - 120, 300).lineTo(cx + 120, 300).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.fontSize(10).fillColor(COLORS.muted);
  doc.text('(write your name here)', 0, 308, { width: doc.page.width, align: 'center' });

  doc.fontSize(14).fillColor(COLORS.muted);
  doc.text('has successfully read', 0, 350, { width: doc.page.width, align: 'center' });

  doc.fontSize(24).fillColor(COLORS.primary);
  doc.text(bookData.title, 0, 385, { width: doc.page.width, align: 'center' });

  doc.fontSize(13).fillColor(COLORS.accent);
  doc.text(`Book ${bookData.level}.${bookData.book} — ${bookData.levelName} Level`, 0, 425, {
    width: doc.page.width,
    align: 'center',
  });

  doc.fontSize(12).fillColor(COLORS.muted);
  doc.text('MyPhonics Reading Programme', 0, 500, { width: doc.page.width, align: 'center' });

  // Date line
  doc.moveTo(cx - 80, 560).lineTo(cx + 80, 560).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.fontSize(10).fillColor(COLORS.muted);
  doc.text('Date', 0, 568, { width: doc.page.width, align: 'center' });
}

function renderVocabularyPage(doc, bookData, pageNum) {
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.light);
  doc.rect(0, 80, doc.page.width, 3).fill(COLORS.primary);

  doc.fontSize(22).fillColor(COLORS.primary);
  doc.text('Vocabulary List', 50, 30);

  if (bookData.vocabulary && bookData.vocabulary.length > 0) {
    const colWidth = (doc.page.width - 100) / 3;
    bookData.vocabulary.forEach((word, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 50 + col * colWidth;
      const y = 110 + row * 28;
      doc.fontSize(13).fillColor(COLORS.dark);
      doc.text(`•  ${word}`, x, y, { width: colWidth });
    });
  }

  pageFooter(doc, bookData, pageNum);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateBookPDF(bookData, outputPath, log = () => {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `${bookData.title} — MyPhonics Level ${bookData.level}`,
        Author: 'MyPhonics',
        Subject: `Phonics reading book for Level ${bookData.level}`,
      },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    let pdfPageNum = 0;

    // Title page
    log('Rendering title page');
    renderTitlePage(doc, bookData);
    pdfPageNum++;

    // Vocabulary page (after title)
    if (bookData.vocabulary && bookData.vocabulary.length > 0) {
      doc.addPage();
      pdfPageNum++;
      log('Rendering vocabulary page');
      renderVocabularyPage(doc, bookData, pdfPageNum);
    }

    // Content pages
    for (const page of bookData.pages) {
      if (page.type === 'title') continue; // already rendered

      doc.addPage();
      pdfPageNum++;

      if (page.type === 'story') {
        log(`Rendering story: ${page.heading}`);
        renderStoryPage(doc, page, bookData, pdfPageNum);
      } else if (page.type === 'activity') {
        log(`Rendering activity: ${page.heading}`);
        renderActivityPage(doc, page, bookData, pdfPageNum);
      } else if (page.type === 'certificate') {
        log('Rendering certificate');
        renderCertificatePage(doc, page, bookData);
      }
    }

    log(`Total pages: ${pdfPageNum}`);
    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}
