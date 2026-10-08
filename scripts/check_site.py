"""Check deployed files and navigation without a server or third-party packages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re
ROOT=Path(__file__).resolve().parents[1]
pages=[ROOT/'index.html']+[ROOT/p/'index.html' for p in ['about','approach','observatory','partner','privacy','portal']]
class Page(HTMLParser):
 def __init__(self): super().__init__(); self.ids=set(); self.refs=[]; self.h1=0; self.main=0; self.lang=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html': self.lang=a.get('lang')
  if tag=='h1': self.h1+=1
  if tag=='main': self.main+=1
  if 'id' in a:
   assert a['id'] not in self.ids, f'duplicate id {a["id"]}'
   self.ids.add(a['id'])
  for attr in ['href','src']:
   if attr in a: self.refs.append(a[attr])
parsed={}
for f in pages:
 p=Page();p.feed(f.read_text());parsed[f]=p
 assert p.h1==1 and p.main==1 and p.lang=='en',f'landmarks/language: {f}'
 assert 'og:image' in f.read_text() and 'rel="canonical"' in f.read_text()
for f,p in parsed.items():
 for ref in p.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc: continue
  target=(f.parent/unquote(u.path)).resolve() if u.path else f
  if target.is_dir(): target=target/'index.html'
  assert target.exists(),f'broken link {f}: {ref}'
  if u.fragment and target in parsed: assert u.fragment in parsed[target].ids,f'missing anchor {ref}'
assert 'applicationsEnabled: false' in (ROOT/'config.js').read_text(),'Live form must stay closed pending live tests'
assert 'fieldset id="application-fields" disabled' in (ROOT/'partner/index.html').read_text()
assert '<input' not in (ROOT/'portal/index.html').read_text(), 'Portal must collect nothing'
for f in pages+[ROOT/'script.js',ROOT/'application.js',ROOT/'config.js']:
 s=f.read_text()
 assert not re.search(r'sb_secret_[A-Za-z0-9]+|postgres(?:ql)?://[^\s]+:[^\s]+@|eyJ[A-Za-z0-9_-]{25,}\.',s),f'possible credential in {f}'
print(f'PASS: {len(pages)} pages; local links, anchors, landmarks, metadata, closed intake/portal and credential patterns.')
