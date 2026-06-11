# Fonts — drop files here

The engine references three font files in this folder. They are **not committed**
(licensing). Drop them in before generating production PDFs.

| File | Font | Where to get it | Licence note |
|---|---|---|---|
| `trace.ttf` | **KG Primary Dots Lined** (production) | KG fonts foundry | Buy the **commercial** licence — these PDFs are sold. |
| `trace.ttf` | **Print Clearly Dashed** (free placeholder, use today) | Blue Vinyl Fonts | Fine to prototype with; replace for production. |
| `Andika-Regular.ttf` / `Andika-Bold.ttf` | Andika (body) | Already in `../../../myphonics_books/assets/fonts/` (SIL OFL) | Free, commercial OK. |

To use a font, name the file exactly as above. The dotted trace look is
controlled **entirely** by `trace.ttf` — swap that one file and every trace line
updates. Do **not** use Twinkl fonts: their licence forbids commercial /
embedded use.

Copy Andika across (PowerShell):

```powershell
Copy-Item ..\..\..\myphonics_books\assets\fonts\Andika-Regular.ttf .
Copy-Item ..\..\..\myphonics_books\assets\fonts\Andika-Bold.ttf .
```
