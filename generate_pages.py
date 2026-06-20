#!/usr/bin/env python3
"""
Programmatic SEO page generator for Nexus Web Tools.
Reads tool definitions from pages.json, renders HTML templates, and outputs
static pages into the site directory.

Each niche page includes:
  - Background information (niche-specific context)
  - How to Use guidance (step-by-step with the core tool)
  - Applications (real-world use cases)
  - FAQ section (with JSON-LD FAQPage schema)
  - Additional niche-specific content sections

Usage:
    python3 generate_pages.py                    # generate all pages
    python3 generate_pages.py --tool compound-interest  # one tool only
    python3 generate_pages.py --dry-run          # preview without writing
    python3 generate_pages.py --sitemap-only     # output sitemap entries
    python3 generate_pages.py --validate         # check pages.json schema
"""

import json
import os
import sys
import argparse
from pathlib import Path
from html import escape

# ── Configuration ──────────────────────────────────────────────────────

SITE_DIR = Path(__file__).parent  # run from repo root
PAGES_JSON = SITE_DIR / "pages.json"
SITE_URL = "https://nexuswebtools.com"

# Core tools (these pages already exist — we link TO them, never overwrite)
CORE_TOOLS = {
    "compound-interest": {"name": "Compound Interest Calculator", "path": "/compound-interest/"},
    "mortgage":          {"name": "Mortgage Calculator",          "path": "/mortgage/"},
    "unit-converter":    {"name": "Unit Converter",               "path": "/unit-converter/"},
    "s-curve":           {"name": "S-Curve Calculator",           "path": "/s-curve/"},
}

# ── HTML Helpers ───────────────────────────────────────────────────────

def esc(text: str) -> str:
    """Escape HTML entities."""
    return escape(str(text))


def render_list(items: list) -> str:
    """Render a list of strings as a <ul>."""
    if not items:
        return ""
    li = "\n".join(f"        <li>{esc(item)}</li>" for item in items)
    return f"      <ul>\n{li}\n      </ul>"


def render_steps(steps: list) -> str:
    """Render a list of step dicts as an <ol> with optional detail text."""
    if not steps:
        return ""
    items = []
    for step in steps:
        if isinstance(step, dict):
            detail = ""
            if step.get("detail"):
                detail = f"<p>{esc(step['detail'])}</p>"
            items.append(f'        <li><strong>{esc(step["title"])}</strong>{detail}</li>')
        else:
            items.append(f"        <li>{esc(step)}</li>")
    ol = "\n".join(items)
    return f'      <ol class="steps">\n{ol}\n      </ol>'


def render_paragraphs(text: str) -> str:
    """Render a text string as one or more <p> elements (split on double newline)."""
    if not text:
        return ""
    paragraphs = text.strip().split("\n\n")
    return "\n".join(f"      <p>{esc(p.strip())}</p>" for p in paragraphs if p.strip())


def render_content_block(block: dict) -> str:
    """Render a flexible content block (heading + text/list/subsections)."""
    heading = block.get("heading", "")
    html = ""
    if heading:
        html += f"    <h2>{esc(heading)}</h2>\n"

    # Plain text paragraphs
    if block.get("text"):
        html += render_paragraphs(block["text"]) + "\n"

    # Unordered list
    if block.get("list"):
        html += render_list(block["list"]) + "\n"

    # Numbered steps
    if block.get("steps"):
        html += render_steps(block["steps"]) + "\n"

    # Subsections (h3 level)
    for sub in block.get("subsections", []):
        sub_h = sub.get("heading", "")
        if sub_h:
            html += f"    <h3>{esc(sub_h)}</h3>\n"
        if sub.get("text"):
            html += render_paragraphs(sub["text"]) + "\n"
        if sub.get("list"):
            html += render_list(sub["list"]) + "\n"

    return html


# ── Template ───────────────────────────────────────────────────────────

def render_niche_page(tool_id: str, page: dict) -> str:
    """Render a single niche page from its data dict."""
    parent = CORE_TOOLS[tool_id]
    slug = page["slug"]
    title = page["title"]
    description = page.get("meta_description", page.get("intro", ""))
    page_url = f"{SITE_URL}/{tool_id}/{slug}/"

    # ── JSON-LD: Breadcrumb ──
    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"},
            {"@type": "ListItem", "position": 2, "name": parent["name"], "item": f"{SITE_URL}{parent['path']}"},
            {"@type": "ListItem", "position": 3, "name": title, "item": page_url},
        ]
    }

    # ── JSON-LD: WebApplication ──
    json_ld = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": title,
        "description": description,
        "url": page_url,
        "applicationCategory": page.get("category", "UtilityApplication"),
        "operatingSystem": "Any",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "isPartOf": {
            "@type": "WebApplication",
            "name": parent["name"],
            "url": f"{SITE_URL}{parent['path']}",
        }
    }

    # ── JSON-LD: FAQPage (for rich snippets) ──
    faqs = page.get("faqs", [])
    faq_jsonld = ""
    if faqs:
        faq_jsonld = json.dumps({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": faq["q"],
                    "acceptedAnswer": {"@type": "Answer", "text": faq["a"]}
                }
                for faq in faqs
            ]
        }, indent=2)

    # ── Build: Background section ──
    background_html = ""
    bg = page.get("background")
    if bg:
        background_html = '    <h2>Background</h2>\n'
        if isinstance(bg, list):
            for item in bg:
                if isinstance(item, dict):
                    background_html += render_content_block(item)
                else:
                    background_html += render_paragraphs(str(item))
        elif isinstance(bg, dict):
            background_html += render_content_block(bg)
        else:
            background_html += render_paragraphs(str(bg))

    # ── Build: How to Use section ──
    how_to_html = ""
    how = page.get("how_to_use")
    if how:
        how_to_html = '    <h2>How to Use This Calculator</h2>\n'
        if isinstance(how, list):
            for item in how:
                if isinstance(item, dict):
                    how_to_html += render_content_block(item)
                else:
                    how_to_html += render_paragraphs(str(item))
        elif isinstance(how, dict):
            how_to_html += render_content_block(how)
        else:
            how_to_html += render_paragraphs(str(how))

    # ── Build: Applications section ──
    apps_html = ""
    apps = page.get("applications")
    if apps:
        apps_html = '    <h2>Applications</h2>\n'
        if isinstance(apps, list):
            for app in apps:
                if isinstance(app, dict):
                    apps_html += render_content_block(app)
                else:
                    apps_html += render_paragraphs(str(app))
        elif isinstance(apps, dict):
            apps_html += render_content_block(apps)
        else:
            apps_html += render_paragraphs(str(apps))

    # ── Build: Additional content sections ──
    sections_html = ""
    for section in page.get("sections", []):
        sections_html += render_content_block(section)

    # ── Build: FAQ HTML ──
    faq_html = ""
    for faq in faqs:
        faq_html += f"""    <details>
      <summary><strong>{esc(faq["q"])}</strong></summary>
      <p>{esc(faq["a"])}</p>
    </details>
"""

    # ── Build: Related tools links ──
    related_html = ""
    for rel in page.get("related", []):
        related_html += f'        <li><a href="/{tool_id}/{rel["slug"]}/">{esc(rel["name"])}</a></li>\n'
    for cid, cdata in CORE_TOOLS.items():
        if cid != tool_id:
            related_html += f'        <li><a href="{cdata["path"]}">{esc(cdata["name"])}</a></li>\n'

    # ── Build: Nav links ──
    nav_links = '        <a href="/">Home</a>\n        <a href="/#tools">Tools</a>\n'

    # ── Build: FAQ JSON-LD script tag ──
    faq_script = ""
    if faq_jsonld:
        faq_script = f'  <script type="application/ld+json">{faq_jsonld}</script>\n'

    # ── Assemble page ──
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)} | Nexus Web Tools</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{page_url}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{page_url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Nexus Web Tools">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <script type="application/ld+json">{json.dumps(json_ld, indent=2)}</script>
  <script type="application/ld+json">{json.dumps(breadcrumb, indent=2)}</script>
{faq_script}  <link rel="stylesheet" href="/style.css?v=1">
  <style>
    .niche-hero {{ background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%); padding: 2rem 1rem; text-align: center; border-radius: 8px; margin-bottom: 1.5rem; }}
    .niche-hero h1 {{ margin: 0 0 0.5rem; color: #1a1a2e; }}
    .niche-hero p {{ margin: 0 auto; color: #555; max-width: 600px; }}
    .cta-box {{ background: #fff; border: 2px solid #3b5bdb; border-radius: 8px; padding: 1.5rem; text-align: center; margin: 1.5rem 0; }}
    .cta-box a {{ display: inline-block; background: #3b5bdb; color: #fff; padding: 0.75rem 2rem; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 1.1rem; }}
    .cta-box a:hover {{ background: #2b4bc8; }}
    .niche-content h2 {{ color: #1a1a2e; margin-top: 2rem; border-bottom: 2px solid #e8f0fe; padding-bottom: 0.3rem; }}
    .niche-content h3 {{ color: #2d3748; margin-top: 1.5rem; }}
    .niche-content p, .niche-content li {{ line-height: 1.7; color: #333; }}
    .niche-content ul {{ padding-left: 1.5rem; }}
    .niche-content ol.steps {{ padding-left: 1.5rem; }}
    .niche-content ol.steps li {{ margin-bottom: 0.75rem; }}
    .niche-content ol.steps li p {{ margin: 0.25rem 0 0; color: #555; font-size: 0.95rem; }}
    .niche-content ul li {{ margin-bottom: 0.5rem; }}
    details {{ background: #f8f9fa; border-radius: 6px; margin-bottom: 0.5rem; padding: 0.75rem 1rem; }}
    details summary {{ cursor: pointer; color: #1a1a2e; font-size: 1rem; }}
    details summary:hover {{ color: #3b5bdb; }}
    details p {{ margin: 0.5rem 0 0; color: #444; line-height: 1.6; }}
    .related-tools {{ background: #f8f9fa; border-radius: 8px; padding: 1.5rem; margin-top: 2rem; }}
    .related-tools h3 {{ margin-top: 0; }}
    .related-tools ul {{ list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 0.75rem; }}
    .related-tools li a {{ display: inline-block; background: #fff; border: 1px solid #ddd; padding: 0.4rem 0.9rem; border-radius: 4px; text-decoration: none; color: #3b5bdb; font-size: 0.9rem; }}
    .related-tools li a:hover {{ border-color: #3b5bdb; background: #f0f4ff; }}
    .breadcrumb {{ font-size: 0.85rem; color: #666; margin-bottom: 1rem; }}
    .breadcrumb a {{ color: #3b5bdb; text-decoration: none; }}
    .breadcrumb a:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <header class="ribbon">
    <div class="container">
      <h1 class="site-title"><a href="/">Nexus Web Tools</a></h1>
      <nav class="nav-ribbon">
{nav_links}      </nav>
    </div>
    <div class="scroll-bar"><div class="scroll-bar-fill"></div></div>
  </header>

  <main class="container niche-content">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> &rsaquo;
      <a href="{parent['path']}">{esc(parent['name'])}</a> &rsaquo;
      <strong>{esc(title)}</strong>
    </nav>

    <section class="niche-hero">
      <h1>{esc(title)}</h1>
      <p>{esc(page.get('intro', ''))}</p>
    </section>

    <div class="cta-box">
      <p>Ready to calculate?</p>
      <a href="{parent['path']}">&rsaquo; Open the {esc(parent['name'])}</a>
    </div>

{background_html}
{how_to_html}
{apps_html}
{sections_html}

    <h2>Frequently Asked Questions</h2>
{faq_html}

    <div class="related-tools">
      <h3>Related Calculators</h3>
      <ul>
{related_html}      </ul>
    </div>

  </main>

  <footer>
    <div class="container">
      <p>&copy; 2025 Nexus Web Tools. <a href="/compound-interest/">Compound Interest Calculator</a> &middot; <a href="/unit-converter/">Unit Converter</a> &middot; <a href="/s-curve/">S-Curve Calculator</a></p>
    </div>
  </footer>
<script src="/scroll-bar.js" defer></script>
</body>
</html>
"""


# ── Validator ──────────────────────────────────────────────────────────

def validate_data(data: dict) -> list:
    """Validate pages.json structure. Returns list of errors."""
    errors = []
    for tool_id, pages in data.items():
        if tool_id not in CORE_TOOLS:
            errors.append(f"Unknown tool '{tool_id}' — must be one of: {list(CORE_TOOLS.keys())}")
            continue
        for i, page in enumerate(pages):
            slug = page.get("slug", "")
            if not slug:
                errors.append(f"{tool_id}[{i}]: missing 'slug'")
            title = page.get("title", "")
            if not title:
                errors.append(f"{tool_id}[{i}]: missing 'title'")
            if not page.get("intro"):
                errors.append(f"{tool_id}[{i}] ({slug}): missing 'intro'")
            if not page.get("meta_description"):
                errors.append(f"{tool_id}[{i}] ({slug}): missing 'meta_description'")
            if not page.get("background"):
                errors.append(f"{tool_id}[{i}] ({slug}): missing 'background' — adds SEO value")
            if not page.get("how_to_use"):
                errors.append(f"{tool_id}[{i}] ({slug}): missing 'how_to_use' — adds SEO value")
            if not page.get("applications"):
                errors.append(f"{tool_id}[{i}] ({slug}): missing 'applications' — adds SEO value")
            if not page.get("faqs"):
                errors.append(f"{tool_id}[{i}] ({slug}): missing 'faqs' — needed for FAQPage rich snippet")
            for j, faq in enumerate(page.get("faqs", [])):
                if not faq.get("q"):
                    errors.append(f"{tool_id}[{i}] ({slug}).faqs[{j}]: missing 'q'")
                if not faq.get("a"):
                    errors.append(f"{tool_id}[{i}] ({slug}).faqs[{j}]: missing 'a'")
    return errors


# ── Generator ──────────────────────────────────────────────────────────

def load_pages_data() -> dict:
    """Load page definitions from pages.json."""
    if not PAGES_JSON.exists():
        print(f"Error: {PAGES_JSON} not found. Create it first (see pages.example.json).")
        sys.exit(1)
    with open(PAGES_JSON) as f:
        return json.load(f)


def generate_all(data: dict, dry_run: bool = False, tool_filter: str = None):
    """Generate all niche pages from the data."""
    total = 0
    for tool_id, pages in data.items():
        if tool_filter and tool_id != tool_filter:
            continue
        if tool_id not in CORE_TOOLS:
            print(f"  Warning: unknown tool '{tool_id}', skipping")
            continue

        for page in pages:
            slug = page["slug"]
            out_dir = SITE_DIR / tool_id / slug
            out_file = out_dir / "index.html"

            if dry_run:
                print(f"  [DRY] {out_file}")
            else:
                out_dir.mkdir(parents=True, exist_ok=True)
                html = render_niche_page(tool_id, page)
                out_file.write_text(html, encoding="utf-8")
                print(f"  ✓ {out_file}")

            total += 1

    return total


def generate_sitemap(data: dict) -> str:
    """Generate sitemap.xml entries for all niche pages."""
    lines = []
    for tool_id, pages in data.items():
        if tool_id not in CORE_TOOLS:
            continue
        for page in pages:
            slug = page["slug"]
            url = f"{SITE_URL}/{tool_id}/{slug}/"
            priority = page.get("sitemap_priority", 0.6)  # Lower than core tools (0.8-1.0)
            lines.append(f"""  <url>
    <loc>{url}</loc>
    <changefreq>monthly</changefreq>
    <priority>{priority}</priority>
  </url>""")
    return "\n".join(lines)


# ── CLI ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate programmatic SEO pages for Nexus Web Tools")
    parser.add_argument("--tool", help="Only generate pages for this tool (e.g. compound-interest)")
    parser.add_argument("--dry-run", action="store_true", help="Preview files without writing")
    parser.add_argument("--sitemap-only", action="store_true", help="Only output sitemap entries")
    parser.add_argument("--validate", action="store_true", help="Check pages.json for missing fields")
    args = parser.parse_args()

    data = load_pages_data()

    if args.validate:
        errors = validate_data(data)
        if errors:
            print(f"Found {len(errors)} issues:")
            for e in errors:
                print(f"  ⚠ {e}")
        else:
            print("✓ All pages valid — background, how_to_use, applications, and faqs present.")
        return

    if args.sitemap_only:
        print(generate_sitemap(data))
        return

    print(f"Generating niche pages from {PAGES_JSON}...")
    total = generate_all(data, dry_run=args.dry_run, tool_filter=args.tool)
    print(f"\nDone: {total} pages {'would be ' if args.dry_run else ''}generated.")


if __name__ == "__main__":
    main()
