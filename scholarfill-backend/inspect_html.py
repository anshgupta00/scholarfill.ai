import json, re

with open('debug_page.html', encoding='utf-8') as f:
    html = f.read()

# Extract entry IDs
raw = re.findall(r'entry\.(\d{7,12})', html)
seen = set()
unique = [x for x in raw if not (x in seen or seen.add(x))]
print('Entry IDs found:', unique[:25])

# Extract question titles from JSON blobs in the source
# Google Forms embeds question data as nested JS arrays
titles = re.findall(r'"([^"]{3,80})"\s*,\s*\[\[', html)
print('\nQuestion title candidates:')
for t in titles[:30]:
    print(' -', t)
