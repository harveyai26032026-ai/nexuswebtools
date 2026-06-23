#!/usr/bin/env python3
"""
Enrich niche SEO pages with additional FAQ and context using a local Ollama model.
Zero token cost — runs entirely on local hardware.

Usage:
  python3 enrich_pages.py [--model MODEL] [--batch N] [--dry-run]

Defaults: model=llama2:7b, batch=5 (process 5 pages per run)
"""
import json, subprocess, sys, re, time, os
from pathlib import Path

PAGES_JSON = Path(__file__).parent / "pages.json"
MODEL = "llama2:7b"
BATCH = 5

def run_ollama(prompt: str, model: str = MODEL, timeout: int = 180) -> str:
    """Run a prompt through Ollama HTTP API and return the response text."""
    import urllib.request, urllib.error
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": 4096, "temperature": 0.3}
    }).encode()
    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        result = json.loads(resp.read().decode())
    text = result.get("response", "").strip()
    # Strip ``` blocks (some models emit them)
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL).strip()
    # Strip "Thinking...\n...\n...done thinking." blocks
    text = re.sub(r'Thinking\.\.\..*?done thinking\.', '', text, flags=re.DOTALL).strip()
    # Strip leading conversational text ("Here is the..." etc.) by truncating
    # everything before the first '{' if present.
    json_start = text.find('{')
    if json_start > 0:
        text = text[json_start:]
    return text

def build_prompt(page: dict, tool_type: str) -> str:
    """Build a prompt that asks the model to generate extra FAQs and context."""
    title = page.get('title', '')
    intro = page.get('intro', '')
    existing_faqs = page.get('faq', [])
    existing_q = [f['q'] for f in existing_faqs] if existing_faqs else []

    prompt = f"""You are an SEO content writer. For the page "{title}" ({tool_type} tool), generate:
1. Two additional FAQ questions and answers (under 60 words each) that are NOT already covered by these existing questions: {json.dumps(existing_q)}
2. One additional "Applications" subsection (heading + 2-3 sentences with specific numbers/examples)

Output ONLY raw JSON, no markdown, no explanation, no preamble. Start with {{ and end with }}.
Format: {{"extra_faq": [{{"q": "...", "a": "..."}}, {{"q": "...", "a": "..."}}], "extra_application": {{"heading": "...", "text": "..."}}}}
"""
    return prompt

def parse_response(text: str) -> dict | None:
    """Extract JSON from the model response."""
    # Try to find JSON object in the response
    match = re.search(r'\{[\s\S]*\}', text)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None

def enrich_page(page: dict, tool_type: str, model: str, dry_run: bool) -> bool:
    """Enrich a single page with additional content. Returns True if updated."""
    prompt = build_prompt(page, tool_type)

    if dry_run:
        print(f"  [DRY-RUN] Would prompt for: {page['slug']}")
        print(f"  Prompt preview: {prompt[:120]}...")
        return False

    try:
        response = run_ollama(prompt, model)
    except subprocess.TimeoutExpired:
        print(f"  ⏱️ Timeout for {page['slug']}")
        return False
    except Exception as e:
        print(f"  ❌ Error for {page['slug']}: {e}")
        return False

    parsed = parse_response(response)
    if not parsed:
        print(f"  ⚠️ Could not parse response for {page['slug']}")
        print(f"  Raw: {response[:200]}")
        return False

    updated = False

    # Add extra FAQs
    extra_faq = parsed.get('extra_faq', [])
    if extra_faq and isinstance(extra_faq, list):
        if 'faq' not in page or not isinstance(page.get('faq'), list):
            page['faq'] = []
        for fq in extra_faq:
            if isinstance(fq, dict) and 'q' in fq and 'a' in fq:
                # Don't add duplicate questions
                existing_q = [f['q'].lower().strip() for f in page['faq']]
                if fq['q'].lower().strip() not in existing_q:
                    page['faq'].append(fq)
                    updated = True

    # Add extra application
    extra_app = parsed.get('extra_application')
    if extra_app and isinstance(extra_app, dict) and 'heading' in extra_app and 'text' in extra_app:
        if 'applications' not in page or not isinstance(page.get('applications'), list):
            page['applications'] = []
        existing_headings = [a.get('heading', '').lower().strip() for a in page['applications'] if isinstance(a, dict)]
        if extra_app['heading'].lower().strip() not in existing_headings:
            page['applications'].append(extra_app)
            updated = True

    if updated:
        print(f"  ✅ Enriched: {page['slug']} (+{len(extra_faq)} FAQ, +1 app)")
    else:
        print(f"  ⏭️ No new content for: {page['slug']}")

    return updated

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Enrich niche pages with local AI")
    parser.add_argument("--model", default=MODEL, help=f"Ollama model (default: {MODEL})")
    parser.add_argument("--batch", type=int, default=BATCH, help=f"Pages per run (default: {BATCH})")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    parser.add_argument("--tool", choices=["compound-interest", "unit-converter", "s-curve"], help="Only process one tool type")
    args = parser.parse_args()

    if not PAGES_JSON.exists():
        print(f"❌ {PAGES_JSON} not found")
        sys.exit(1)

    data = json.load(open(PAGES_JSON))

    # Build work queue: (tool_id, page_index, page)
    queue = []
    for tool_id, pages in data.items():
        if args.tool and tool_id != args.tool:
            continue
        for i, page in enumerate(pages):
            # Skip pages that already have 5+ FAQs and 4+ applications
            n_faq = len(page.get('faq', []))
            n_app = len(page.get('applications', []))
            if n_faq >= 5 and n_app >= 4:
                continue
            queue.append((tool_id, i, page))

    if not queue:
        print("All pages already enriched! Nothing to do.")
        return

    # Process up to batch size
    to_process = queue[:args.batch]
    print(f"📋 Processing {len(to_process)} of {len(queue)} remaining pages (model={args.model})")

    updated_count = 0
    for tool_id, idx, page in to_process:
        print(f"\n🔍 [{tool_id}] {page['slug']}")
        if enrich_page(page, tool_id, args.model, args.dry_run):
            updated_count += 1
        time.sleep(1)  # Gentle pacing

    # Save updated pages.json
    if updated_count > 0 and not args.dry_run:
        json.dump(data, open(PAGES_JSON, 'w'), indent=2, ensure_ascii=False)
        print(f"\n💾 Saved {updated_count} updates to pages.json")

        # Regenerate HTML
        gen_script = Path(__file__).parent / "generate_pages.py"
        if gen_script.exists():
            print("🔄 Regenerating HTML pages...")
            subprocess.run([sys.executable, str(gen_script)], check=True)
            print("✅ HTML regenerated")
    else:
        print(f"\n{'No updates (dry run)' if args.dry_run else 'No new content generated'}")

if __name__ == "__main__":
    main()
