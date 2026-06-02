"""Render PDF pages to PNG images for review.

Usage:
    python _render_pdf.py <pdf_path> <out_dir> [--scale 1.5] [--pages 1-8]
"""
import argparse, os, sys
import pypdfium2 as pdfium


def parse_pages(spec, total):
    if not spec:
        return list(range(total))
    out = []
    for part in spec.split(','):
        if '-' in part:
            a, b = part.split('-', 1)
            a = int(a); b = int(b)
            out.extend(range(a - 1, b))
        else:
            out.append(int(part) - 1)
    return [p for p in out if 0 <= p < total]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf')
    ap.add_argument('outdir')
    ap.add_argument('--scale', type=float, default=1.5)
    ap.add_argument('--pages', default='')
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    pdf = pdfium.PdfDocument(args.pdf)
    total = len(pdf)
    pages = parse_pages(args.pages, total)

    base = os.path.splitext(os.path.basename(args.pdf))[0]
    for i in pages:
        page = pdf[i]
        bitmap = page.render(scale=args.scale)
        pil = bitmap.to_pil()
        # Reduce file size: convert to RGB and save as JPEG-ish quality PNG
        out = os.path.join(args.outdir, f"{base}_p{i+1:02d}.png")
        pil.save(out, 'PNG', optimize=True)
        page.close()
        print(out)
    pdf.close()


if __name__ == '__main__':
    main()
