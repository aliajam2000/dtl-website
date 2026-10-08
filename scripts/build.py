"""Dependency-free static pages. Run from any directory; never reads secrets."""
from pathlib import Path
from html import escape
ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://aliajam2000.github.io/dtl-website/'
PAGES = [
 ('home', '', 'Understand Poverty. Build What Works.', 'An early-stage research and development initiative building reliable household knowledge, local partnerships, and evidence for better decisions.'),
 ('approach','approach/','Our Approach','Listen, measure, understand, test, evaluate, and improve. How DTL plans to turn local knowledge into responsible development research.'),
 ('observatory','observatory/','Poverty Observatory','Longitudinal household research infrastructure in development. Consent, restricted records, and careful measurement of change over time.'),
 ('partner','partner/','Partner With Us','Explore research collaboration with Development Technology Lab. For local organizations, researchers, and development practitioners.'),
 ('about','about/','About DTL','An early-stage, research-driven initiative with a long-term mission to help people sustainably escape severe poverty.'),
 ('privacy','privacy/','Privacy & Responsible Data','How DTL plans to handle partnership enquiries and participant information. Applications are not currently open.'),
 ('portal','portal/','Private Observatory Portal','The private Observatory portal is closed. No participant information is collected here.'),
]
NAV=[('home','Home',''),('approach','Our Approach','approach/'),('observatory','Poverty Observatory','observatory/'),('partner','Partner With Us','partner/'),('about','About','about/')]
for key, route, title, description in PAGES:
    prefix='../' if route else './'
    nav=''.join(f'<a href="{prefix}{path}"'+(' aria-current="page"' if k==key else '')+f'>{name}</a>' for k,name,path in NAV)
    content=(ROOT/'templates'/f'{key}.html').read_text().replace('{{root}}',prefix)
    form_scripts=f'<script src="{prefix}config.js" defer></script><script src="{prefix}application.js" defer></script>' if key=='partner' else ''
    page=f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#f7f7f2"><meta name="description" content="{escape(description,quote=True)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://fmlcpdlxbuhaymzvjxwu.supabase.co; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'none'">
<title>{escape(title)} — Development Technology Lab</title>
<link rel="canonical" href="{BASE}{route}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Development Technology Lab">
<meta property="og:title" content="{escape(title,quote=True)}"><meta property="og:description" content="{escape(description,quote=True)}"><meta property="og:url" content="{BASE}{route}">
<meta property="og:image" content="{BASE}assets/social.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
{'<meta name="robots" content="noindex,nofollow">' if key=='portal' else ''}
<link rel="icon" href="{prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{prefix}style.css"><script src="{prefix}script.js" defer></script>{form_scripts}
</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="header wrap"><a class="brand" href="{prefix}" aria-label="Development Technology Lab home"><span class="wordmark">DTL<span class="brand-dot">.</span></span><span class="brand-name">Development<br>Technology Lab</span></a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu <span aria-hidden="true">≡</span></button>
<nav id="site-nav" aria-label="Main navigation">{nav}</nav><a class="button small nav-cta" href="{prefix}partner/#application">Become a Partner <span aria-hidden="true">↗</span></a></header>
<main id="main" tabindex="-1">{content}</main>
<footer class="footer"><div class="wrap footer-main"><div><a class="brand" href="{prefix}"><span class="wordmark">DTL<span class="brand-dot">.</span></span><span class="brand-name">Development<br>Technology Lab</span></a><p>Understand Poverty.<br>Build What Works.</p></div><div><span class="eyebrow">Explore</span><a href="{prefix}approach/">Our Approach</a><a href="{prefix}observatory/">Poverty Observatory</a><a href="{prefix}about/">About DTL</a></div><div><span class="eyebrow">Connect</span><a href="{prefix}partner/">Partner With Us</a><a href="{prefix}privacy/">Privacy & Responsible Data</a><a href="{prefix}portal/">Private Portal <span class="muted">— not yet open</span></a></div></div><div class="wrap footer-bottom"><span>© 2026 Development Technology Lab</span><span>Early-stage initiative · Evidence before claims.</span></div></footer>
</body></html>'''
    out=ROOT/route/'index.html'; out.parent.mkdir(parents=True,exist_ok=True);out.write_text(page)
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{BASE}{r}</loc></url>' for k,r,*_ in PAGES if k!='portal')+'</urlset>\n')
print(f'Built {len(PAGES)} pages.')
