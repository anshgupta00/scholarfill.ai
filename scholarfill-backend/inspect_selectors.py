"""
Pure-stdlib inspector — no BeautifulSoup needed.
Finds the real CSS class names Google Forms uses for question titles,
by looking at elements surrounding the known question text.
"""
import re

with open("debug_page.html", encoding="utf-8") as f:
    html = f.read()

# 1) Find all unique class strings on div/span tags
all_classes = re.findall(r'<(?:div|span)[^>]*class="([^"]*)"', html)
class_set = set()
for cls_str in all_classes:
    for c in cls_str.split():
        class_set.add(c)

title_related = sorted(c for c in class_set if "title" in c.lower() or "question" in c.lower() or "label" in c.lower())
print("Classes containing 'title'/'question'/'label':")
for c in title_related:
    print(" ", c)

# 2) Find divs that contain the word "Grade" or "Name" or "Project" (real questions)
print("\n--- Divs/spans containing question-like text ---")
# Find short text nodes in divs that look like questions
pattern = re.compile(r'<div[^>]*class="([^"]*)"[^>]*>([^<]{5,120})</div>', re.IGNORECASE)
seen_texts = set()
for m in pattern.finditer(html):
    cls, text = m.group(1).strip(), m.group(2).strip()
    if text in seen_texts:
        continue
    # Looks like a question if it's capitalised and under 120 chars
    if text and text[0].isupper() and len(text) < 120 and "\n" not in text:
        seen_texts.add(text)
        cls_short = cls[:60]
        print(f"  cls={cls_short!r}  text={text!r}")
    if len(seen_texts) >= 30:
        break

# 3) Show what's inside role='listitem' containers
print("\n--- First 3 role=listitem containers (truncated) ---")
listitems = re.findall(r'<div[^>]*role="listitem"[^>]*>(.*?)</div>\s*</div>\s*</div>', html, re.DOTALL)
for item in listitems[:3]:
    # Extract all text content
    text = re.sub(r'<[^>]+>', ' ', item)
    text = re.sub(r'\s+', ' ', text).strip()[:200]
    print(f"  {text!r}\n")
