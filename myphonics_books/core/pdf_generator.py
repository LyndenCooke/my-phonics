"""
PDF Generator abstraction layer for MyPhonicsBooks.

Supports multiple backends:
- Playwright (default): Local Chromium-based PDF generation
- DocRaptor: Cloud-based Prince XML rendering (higher consistency)

Set PDF_BACKEND environment variable to switch backends.
"""

import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional


class PDFGenerator(ABC):
    """Abstract interface for PDF generation."""

    @abstractmethod
    async def generate(
        self,
        html_content: str,
        output_path: Path,
        width_mm: float = 148,
        height_mm: float = 210,
    ) -> Path:
        """Generate PDF from HTML content.

        Args:
            html_content: The HTML string to render
            output_path: Where to save the PDF
            width_mm: Page width in millimetres (default A5)
            height_mm: Page height in millimetres (default A5)

        Returns:
            Path to the generated PDF
        """
        pass


class PlaywrightPDFGenerator(PDFGenerator):
    """Playwright/Chromium-based PDF generation.

    Uses explicit font loading detection for consistency.
    Chromium version is pinned via requirements.txt.
    """

    async def generate(
        self,
        html_content: str,
        output_path: Path,
        width_mm: float = 148,
        height_mm: float = 210,
    ) -> Path:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            # Load HTML content (longer timeout for large images)
            await page.set_content(html_content, wait_until="networkidle", timeout=300000)

            # Explicit font loading wait (more reliable than timeout)
            await page.evaluate("""
                () => document.fonts.ready.then(() => {
                    const fonts = [...document.fonts].map(f => `${f.family} ${f.weight}`);
                    console.log('Fonts loaded:', fonts.join(', '));
                })
            """)

            # Small buffer for rendering stabilization
            await page.wait_for_timeout(200)

            # Generate PDF
            await page.pdf(
                path=str(output_path),
                width=f"{width_mm}mm",
                height=f"{height_mm}mm",
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
                print_background=True,
                prefer_css_page_size=True,
            )

            await browser.close()

        return output_path


class DocRaptorPDFGenerator(PDFGenerator):
    """DocRaptor API-based PDF generation using Prince XML.

    Provides highest consistency guarantee for print-quality PDFs.
    Requires DOCRAPTOR_API_KEY environment variable.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("DOCRAPTOR_API_KEY")
        if not self.api_key:
            raise ValueError(
                "DocRaptor API key required. Set DOCRAPTOR_API_KEY environment variable."
            )

    async def generate(
        self,
        html_content: str,
        output_path: Path,
        width_mm: float = 148,
        height_mm: float = 210,
    ) -> Path:
        import httpx

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://docraptor.com/docs",
                auth=(self.api_key, ""),
                json={
                    "test": os.environ.get("DOCRAPTOR_TEST", "false").lower() == "true",
                    "document_content": html_content,
                    "type": "pdf",
                    "prince_options": {
                        "media": "print",
                        "page_size": f"{width_mm}mm {height_mm}mm",
                    },
                },
            )
            response.raise_for_status()
            output_path.write_bytes(response.content)

        return output_path


def get_pdf_generator() -> PDFGenerator:
    """Factory function to get configured PDF generator.

    Reads PDF_BACKEND environment variable:
    - 'playwright' (default): Use local Chromium
    - 'docraptor': Use DocRaptor cloud service

    Returns:
        Configured PDFGenerator instance
    """
    backend = os.environ.get("PDF_BACKEND", "playwright").lower()

    if backend == "docraptor":
        return DocRaptorPDFGenerator()
    elif backend == "pdfmonkey":
        raise NotImplementedError(
            "PDFMonkey integration not yet implemented. Use 'playwright' or 'docraptor'."
        )
    else:
        return PlaywrightPDFGenerator()
