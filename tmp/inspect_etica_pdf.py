from pypdf import PdfReader
from pathlib import Path
pdf = Path(r"C:\Users\Patricio\Documents\Biblioteca\Libros\Readlist\Ética\Aristóteles. Ética.pdf")
reader = PdfReader(str(pdf))
print('pages', len(reader.pages))

try:
    outlines = reader.outline
except Exception:
    outlines = []

flat=[]

def walk(items):
    for it in items:
        if isinstance(it, list):
            walk(it)
        else:
            try:
                title = getattr(it, 'title', None) or str(it.get('/Title'))
            except Exception:
                title = str(it)
            try:
                p = reader.get_destination_page_number(it)+1
            except Exception:
                p = None
            flat.append((title,p))

walk(outlines if isinstance(outlines,list) else [outlines])
print('outline_count', len(flat))
for t,p in flat[:200]:
    print(f"{p}\t{t}")

for i in range(0,60):
    txt = reader.pages[i].extract_text() or ''
    txt = ' '.join(txt.split())
    if txt:
        print(f"PAGE {i+1}: {txt[:180]}")
