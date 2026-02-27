"""
PDF Assembly for MyPhonicsBooks.

Uses ReportLab to generate print-ready PDF books.
Format: A5 pages (A4 landscape folded in half for home printing).
"""

import os
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass

from reportlab.lib.pagesizes import A5, landscape
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, Frame, PageTemplate, BaseDocTemplate, KeepTogether
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from .book_structure import (
    BookStructure, BookPage, PageType, LEVEL_COLOURS,
    ParentGuidance, PhonicsChart, PredictionPrompt
)


# Page dimensions (A5 portrait)
PAGE_WIDTH, PAGE_HEIGHT = A5  # 148mm x 210mm
MARGIN = 12 * mm


@dataclass
class PDFConfig:
    """Configuration for PDF generation."""
    output_dir: Path = Path("output/books")
    temp_dir: Path = Path("output/temp")
    fonts_dir: Path = Path("assets/fonts")

    # Typography
    title_font: str = "Helvetica-Bold"
    body_font: str = "Helvetica"
    story_font_size: int = 18  # Large for early readers
    title_font_size: int = 24
    guidance_font_size: int = 10

    # Layout
    story_text_top_margin: float = 0.35  # Story text starts 35% down page
    illustration_height_ratio: float = 0.55  # Illustration takes 55% of page


class BookPDFGenerator:
    """Generates PDF from BookStructure."""

    def __init__(self, config: Optional[PDFConfig] = None):
        self.config = config or PDFConfig()
        self.config.output_dir.mkdir(parents=True, exist_ok=True)
        self.config.temp_dir.mkdir(parents=True, exist_ok=True)

        # Set up styles
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Create custom paragraph styles for the book."""

        # Story text - large, clear, easy to read
        self.styles.add(ParagraphStyle(
            name='StoryText',
            fontName=self.config.body_font,
            fontSize=self.config.story_font_size,
            leading=self.config.story_font_size * 1.4,
            alignment=TA_LEFT,
            spaceAfter=6 * mm
        ))

        # Book title
        self.styles.add(ParagraphStyle(
            name='BookTitle',
            fontName=self.config.title_font,
            fontSize=self.config.title_font_size,
            leading=self.config.title_font_size * 1.2,
            alignment=TA_CENTER,
            spaceAfter=4 * mm
        ))

        # Level indicator
        self.styles.add(ParagraphStyle(
            name='LevelIndicator',
            fontName=self.config.title_font,
            fontSize=12,
            alignment=TA_CENTER,
            textColor=white
        ))

        # Parent guidance
        self.styles.add(ParagraphStyle(
            name='GuidanceTitle',
            fontName=self.config.title_font,
            fontSize=12,
            alignment=TA_LEFT,
            spaceAfter=2 * mm,
            spaceBefore=3 * mm
        ))

        self.styles.add(ParagraphStyle(
            name='GuidanceText',
            fontName=self.config.body_font,
            fontSize=self.config.guidance_font_size,
            leading=self.config.guidance_font_size * 1.3,
            alignment=TA_LEFT,
            leftIndent=3 * mm,
            spaceAfter=1 * mm
        ))

        # Questions
        self.styles.add(ParagraphStyle(
            name='QuestionText',
            fontName=self.config.body_font,
            fontSize=12,
            leading=16,
            alignment=TA_LEFT,
            spaceAfter=4 * mm,
            leftIndent=5 * mm
        ))

        # Phonics chart
        self.styles.add(ParagraphStyle(
            name='ChartInstruction',
            fontName=self.config.body_font,
            fontSize=9,
            alignment=TA_LEFT,
            textColor=HexColor('#666666')
        ))

    def generate(self, book: BookStructure, illustrations: Dict[int, Path] = None) -> Path:
        """
        Generate PDF for a book.

        Args:
            book: BookStructure containing all content
            illustrations: Dict mapping page numbers to illustration image paths

        Returns:
            Path to generated PDF
        """
        illustrations = illustrations or {}

        # Create filename
        safe_title = "".join(c for c in book.title if c.isalnum() or c in " -_").strip()
        safe_title = safe_title.replace(" ", "_")
        output_path = self.config.output_dir / f"{safe_title}_Level{book.level}.pdf"

        # Create document
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A5,
            leftMargin=MARGIN,
            rightMargin=MARGIN,
            topMargin=MARGIN,
            bottomMargin=MARGIN
        )

        # Build story
        story = []
        pages = book.get_all_pages()

        for page in pages:
            page_content = self._render_page(page, book, illustrations.get(page.page_number))
            story.extend(page_content)
            story.append(PageBreak())

        # Remove last page break
        if story and isinstance(story[-1], PageBreak):
            story.pop()

        def draw_background(canvas, doc):
            canvas.saveState()
            # Creamy paper background color #faf7f2
            canvas.setFillColorRGB(250/255, 247/255, 242/255)
            canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=True, stroke=False)
            canvas.restoreState()

        # Build PDF
        doc.build(story, onFirstPage=draw_background, onLaterPages=draw_background)

        return output_path

    def _render_page(self, page: BookPage, book: BookStructure, illustration_path: Optional[Path]) -> List:
        """Render a single page to ReportLab flowables."""

        if page.page_type == PageType.COVER:
            return self._render_cover(page, book, illustration_path)
        elif page.page_type == PageType.INSIDE_FRONT:
            return self._render_parent_guidance(page, book)
        elif page.page_type == PageType.PHONICS_CHART:
            return self._render_phonics_chart(page, book)
        elif page.page_type == PageType.STORY:
            return self._render_story_page(page, book, illustration_path)
        elif page.page_type == PageType.PREDICTION:
            return self._render_prediction(page, book)
        elif page.page_type == PageType.QUESTIONS:
            return self._render_questions(page, book)
        elif page.page_type == PageType.WORKSHEET:
            return self._render_worksheet(page, book)
        elif page.page_type == PageType.INSIDE_BACK:
            return self._render_extension(page, book)
        elif page.page_type == PageType.BACK_COVER:
            return self._render_back_cover(page, book)
        else:
            return [Paragraph(f"Page {page.page_number}", self.styles['Normal'])]

    def _render_cover(self, page: BookPage, book: BookStructure, illustration_path: Optional[Path]) -> List:
        """Render the front cover."""
        elements = []
        colours = LEVEL_COLOURS[book.level]

        # Level banner at top
        level_text = f"Level {book.level} • {colours['name']}"
        elements.append(Paragraph(
            f'<font color="{colours["primary"]}">{level_text}</font>',
            self.styles['LevelIndicator']
        ))
        elements.append(Spacer(1, 5 * mm))

        # Focus graphemes
        graphemes_text = "  ".join(page.content.get("focus_graphemes", []))
        elements.append(Paragraph(
            f'<font size="14" color="{colours["primary"]}">{graphemes_text}</font>',
            ParagraphStyle('Graphemes', alignment=TA_CENTER)
        ))
        elements.append(Spacer(1, 8 * mm))

        # Cover illustration
        if illustration_path and illustration_path.exists():
            # Apply mask to make white background transparent
            img = Image(str(illustration_path), mask=[245, 255, 245, 255, 245, 255])
            img.drawHeight = PAGE_HEIGHT * 0.45
            img.drawWidth = PAGE_WIDTH - 2 * MARGIN
            elements.append(img)
        else:
            # Placeholder
            elements.append(Spacer(1, PAGE_HEIGHT * 0.35))

        elements.append(Spacer(1, 8 * mm))

        # Title
        elements.append(Paragraph(book.title, self.styles['BookTitle']))

        # Child's name
        elements.append(Paragraph(
            f'<font size="14">A story for <b>{book.child_name}</b></font>',
            ParagraphStyle('ChildName', alignment=TA_CENTER)
        ))

        return elements

    def _render_parent_guidance(self, page: BookPage, book: BookStructure) -> List:
        """Render parent guidance page."""
        elements = []
        guidance = book.parent_guidance

        # Title
        elements.append(Paragraph(
            "Guide for Grown-Ups",
            self.styles['BookTitle']
        ))
        elements.append(Spacer(1, 3 * mm))

        # Before reading
        elements.append(Paragraph("Before Reading:", self.styles['GuidanceTitle']))
        for item in guidance.before_reading:
            elements.append(Paragraph(f"• {item}", self.styles['GuidanceText']))

        # During reading
        elements.append(Paragraph("During Reading:", self.styles['GuidanceTitle']))
        for item in guidance.during_reading:
            elements.append(Paragraph(f"• {item}", self.styles['GuidanceText']))

        # If stuck
        elements.append(Paragraph("If Your Child Gets Stuck:", self.styles['GuidanceTitle']))
        for item in guidance.error_correction:
            elements.append(Paragraph(f"• {item}", self.styles['GuidanceText']))

        # After reading
        elements.append(Paragraph("After Reading:", self.styles['GuidanceTitle']))
        for item in guidance.after_reading:
            elements.append(Paragraph(f"• {item}", self.styles['GuidanceText']))

        return elements

    def _render_phonics_chart(self, page: BookPage, book: BookStructure) -> List:
        """Render phonics chart page."""
        elements = []
        chart = book.phonics_chart

        # Title
        elements.append(Paragraph(
            "Phonics Chart",
            self.styles['BookTitle']
        ))

        # Instruction
        elements.append(Paragraph(
            page.content.get("instruction", "Practise saying the sounds."),
            self.styles['ChartInstruction']
        ))
        elements.append(Spacer(1, 4 * mm))

        # Build grid table
        table_data = []
        for row in chart.consonants:
            table_row = []
            for sound in row:
                if sound in chart.focus_graphemes:
                    # Circled/highlighted focus sound
                    table_row.append(f"({sound})")
                else:
                    table_row.append(sound)
            table_data.append(table_row)

        if table_data:
            # Calculate column width based on number of columns
            num_cols = max(len(row) for row in table_data) if table_data else 4
            col_width = (PAGE_WIDTH - 2 * MARGIN) / num_cols

            table = Table(table_data, colWidths=[col_width] * num_cols)
            table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 14),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(table)

        return elements

    def _render_story_page(self, page: BookPage, book: BookStructure, illustration_path: Optional[Path]) -> List:
        """Render a story page with illustration and text."""
        elements = []
        content = page.content

        # Illustration at top (55% of page)
        if illustration_path and illustration_path.exists():
            # Apply mask to make white background transparent
            img = Image(str(illustration_path), mask=[245, 255, 245, 255, 245, 255])
            img.drawHeight = PAGE_HEIGHT * self.config.illustration_height_ratio
            img.drawWidth = PAGE_WIDTH - 2 * MARGIN
            elements.append(img)
        else:
            # Placeholder for illustration
            elements.append(Spacer(1, PAGE_HEIGHT * 0.4))

        elements.append(Spacer(1, 5 * mm))

        # Story text
        story_text = content.get("text", "")
        elements.append(Paragraph(story_text, self.styles['StoryText']))

        # Page number at bottom
        elements.append(Spacer(1, 3 * mm))
        elements.append(Paragraph(
            f'<font size="10" color="#999999">{page.page_number}</font>',
            ParagraphStyle('PageNum', alignment=TA_CENTER)
        ))

        return elements

    def _render_prediction(self, page: BookPage, book: BookStructure) -> List:
        """Render prediction prompt page."""
        elements = []
        colours = LEVEL_COLOURS[book.level]

        elements.append(Spacer(1, PAGE_HEIGHT * 0.2))

        # Stop sign / prompt box
        elements.append(Paragraph(
            '<font size="16" color="#E91E63"><b>Stop and Think!</b></font>',
            ParagraphStyle('StopSign', alignment=TA_CENTER)
        ))
        elements.append(Spacer(1, 10 * mm))

        # Question
        prompt = page.content.get("prompt", book.prediction_prompt.prompt_text)
        elements.append(Paragraph(
            f'<font size="16">{prompt}</font>',
            ParagraphStyle('PredictionQ', alignment=TA_CENTER)
        ))
        elements.append(Spacer(1, 8 * mm))

        # Hint
        hint = page.content.get("hint", book.prediction_prompt.hint_text)
        elements.append(Paragraph(
            f'<font size="12" color="#666666"><i>{hint}</i></font>',
            ParagraphStyle('Hint', alignment=TA_CENTER)
        ))

        elements.append(Spacer(1, 10 * mm))

        # Instruction
        instruction = page.content.get("instruction", "Talk about your ideas before turning the page.")
        elements.append(Paragraph(
            f'<font size="10">{instruction}</font>',
            ParagraphStyle('Instruction', alignment=TA_CENTER)
        ))

        return elements

    def _render_questions(self, page: BookPage, book: BookStructure) -> List:
        """Render comprehension questions page."""
        elements = []

        elements.append(Paragraph(
            "Questions to Talk About",
            self.styles['BookTitle']
        ))
        elements.append(Spacer(1, 5 * mm))

        questions = page.content.get("questions", book.questions)

        # Question type labels
        q_labels = {
            "retrieval": "Finding information:",
            "inference": "Thinking deeper:",
            "vocabulary": "Word meaning:",
            "prediction": "What might happen:"
        }

        for q in questions:
            q_type = q.get("type", "retrieval")
            label = q_labels.get(q_type, "Question:")
            text = q.get("question", "")

            elements.append(Paragraph(
                f'<font size="10" color="#666666">{label}</font>',
                self.styles['GuidanceText']
            ))
            elements.append(Paragraph(
                f'<b>{text}</b>',
                self.styles['QuestionText']
            ))

        return elements

    def _render_worksheet(self, page: BookPage, book: BookStructure) -> List:
        """Render worksheet page."""
        elements = []
        content = page.content

        elements.append(Paragraph(
            "Writing Practice",
            self.styles['BookTitle']
        ))
        elements.append(Spacer(1, 5 * mm))

        ws_type = content.get("type", "word_writing")

        if ws_type == "letter_formation":
            # Letter tracing for Level 1-2
            elements.append(Paragraph(
                "Trace the sounds, then write them yourself:",
                self.styles['GuidanceText']
            ))
            elements.append(Spacer(1, 8 * mm))

            # Drawing lines for practice
            graphemes = content.get("graphemes", book.focus_graphemes[:4])
            for g in graphemes:
                elements.append(Paragraph(
                    f'<font size="24">{g}</font>  _ _ _ _ _',
                    ParagraphStyle('Tracing', fontSize=20, spaceAfter=8*mm)
                ))

        elif ws_type == "word_writing":
            # Word writing for Level 3-4
            elements.append(Paragraph(
                "Write these words from the story:",
                self.styles['GuidanceText']
            ))
            elements.append(Spacer(1, 5 * mm))

            words = content.get("words", [])
            for word in words[:6]:
                elements.append(Paragraph(
                    f'{word}:  _________________',
                    ParagraphStyle('WordLine', fontSize=14, spaceAfter=6*mm)
                ))

        else:
            # Sentence writing for Level 5-6
            elements.append(Paragraph(
                "Write a sentence about the story:",
                self.styles['GuidanceText']
            ))
            elements.append(Spacer(1, 5 * mm))

            for _ in range(3):
                elements.append(Paragraph(
                    '_' * 40,
                    ParagraphStyle('SentenceLine', fontSize=14, spaceAfter=8*mm)
                ))

        return elements

    def _render_extension(self, page: BookPage, book: BookStructure) -> List:
        """Render extension/morphology page."""
        elements = []

        elements.append(Paragraph(
            "Word Building",
            self.styles['BookTitle']
        ))
        elements.append(Spacer(1, 5 * mm))

        morphology = book.morphology_activity

        if morphology and book.level >= 3:
            # Suffix activity
            elements.append(Paragraph(
                "Add endings to make new words:",
                self.styles['GuidanceTitle']
            ))

            for root in morphology.root_words[:4]:
                suffixes = "  ".join(morphology.suffixes)
                elements.append(Paragraph(
                    f'<b>{root}</b>  +  {suffixes}  =  ___________',
                    ParagraphStyle('MorphLine', fontSize=12, spaceAfter=5*mm, leftIndent=5*mm)
                ))

            # Prefix activity for Level 5-6
            if book.level >= 5 and morphology.prefix_words:
                elements.append(Spacer(1, 5 * mm))
                elements.append(Paragraph(
                    "Prefix challenge:",
                    self.styles['GuidanceTitle']
                ))
                for pw in morphology.prefix_words:
                    elements.append(Paragraph(
                        f'{pw["prefix"]} + {pw["word"]} = ___________ (means: {pw["meaning"]})',
                        ParagraphStyle('PrefixLine', fontSize=11, spaceAfter=4*mm, leftIndent=5*mm)
                    ))
        else:
            # Simple extension for Level 1-2
            elements.append(Paragraph(
                "Can you find these sounds in other books?",
                self.styles['GuidanceText']
            ))
            elements.append(Spacer(1, 5 * mm))

            for g in book.focus_graphemes[:4]:
                elements.append(Paragraph(
                    f'<font size="18">{g}</font>  •  I found it in: _______________',
                    ParagraphStyle('SoundHunt', fontSize=12, spaceAfter=6*mm)
                ))

        return elements

    def _render_back_cover(self, page: BookPage, book: BookStructure) -> List:
        """Render back cover."""
        elements = []
        colours = LEVEL_COLOURS[book.level]
        content = page.content

        elements.append(Spacer(1, PAGE_HEIGHT * 0.15))

        # Tricky words used
        tricky = content.get("tricky_words", book.tricky_words_used)
        if tricky:
            elements.append(Paragraph(
                content.get("tricky_words_label", "Tricky words in this story:"),
                self.styles['GuidanceTitle']
            ))
            tricky_text = "  •  ".join(tricky)
            elements.append(Paragraph(
                f'<font size="12">{tricky_text}</font>',
                ParagraphStyle('TrickyWords', alignment=TA_CENTER, spaceAfter=10*mm)
            ))

        elements.append(Spacer(1, PAGE_HEIGHT * 0.2))

        # Branding
        elements.append(Paragraph(
            f'<font size="16" color="{colours["primary"]}"><b>MyPhonicsBooks</b></font>',
            ParagraphStyle('Brand', alignment=TA_CENTER)
        ))
        elements.append(Paragraph(
            content.get("tagline", "Personalised phonics books for your child"),
            ParagraphStyle('Tagline', alignment=TA_CENTER, fontSize=10, textColor=HexColor('#666666'))
        ))

        return elements


def generate_book_pdf(book: BookStructure, illustrations: Dict[int, Path] = None) -> Path:
    """
    Convenience function to generate PDF for a book.

    Args:
        book: BookStructure containing all content
        illustrations: Dict mapping page numbers to illustration image paths

    Returns:
        Path to generated PDF
    """
    generator = BookPDFGenerator()
    return generator.generate(book, illustrations)


if __name__ == "__main__":
    print("PDF assembly module loaded.")
    print("Use generate_book_pdf(book_structure) to generate a PDF.")
