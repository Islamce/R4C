#!/usr/bin/env python3
"""Read-only responsive and RTL audit for local synthetic quotation surfaces."""
from __future__ import annotations

import json
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

BASE = "http://127.0.0.1:3010"
OUT = Path("/home/ubuntu/R4C/artifacts/quotation-qa/responsive-audit.json")
VIEWPORTS = [(1440, 1100), (1024, 1000), (768, 1024), (430, 932), (360, 800)]
SURFACES = {
    "staff": "/design-preview?surface=quotations",
    "buyer": "/buyer/quotation/synthetic-buyer-token-preview?preview=1",
}
COPY = {
    "en": {"staff": "Buyer sales quotations", "buyer": "Your buyer quotation"},
    "ar": {"staff": "عروض مبيعات المشترين", "buyer": "عرض المشتري الخاص بك"},
}


def set_locale(page, locale: str) -> None:
    page.context.clear_cookies()
    page.context.add_cookies([{"name": "r4c_locale", "value": locale, "url": BASE}])


results: list[dict[str, object]] = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium")
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    for locale in ("en", "ar"):
        for surface, path in SURFACES.items():
            for width, height in VIEWPORTS:
                page.set_viewport_size({"width": width, "height": height})
                set_locale(page, locale)
                page.goto(f"{BASE}{path}", wait_until="networkidle")
                expect(page.get_by_role("heading", name=COPY[locale][surface]).first).to_be_visible()
                metrics = page.evaluate("""() => ({
                    viewportWidth: window.innerWidth,
                    documentWidth: document.documentElement.scrollWidth,
                    mainDirection: document.querySelector('main')?.getAttribute('dir') ?? null,
                    visibleFocusTarget: Boolean(document.querySelector('button, input, select, textarea, a[href]')),
                })""")
                expected_direction = "rtl" if locale == "ar" else "ltr"
                if metrics["mainDirection"] != expected_direction:
                    raise AssertionError(f"{surface} {locale} {width}px direction: {metrics}")
                if metrics["documentWidth"] > metrics["viewportWidth"] + 1:
                    raise AssertionError(f"{surface} {locale} {width}px horizontal overflow: {metrics}")
                if not metrics["visibleFocusTarget"]:
                    raise AssertionError(f"{surface} {locale} {width}px has no interactive control")
                results.append({
                    "surface": surface,
                    "locale": locale,
                    "viewport": f"{width}x{height}",
                    "direction": metrics["mainDirection"],
                    "documentWidth": metrics["documentWidth"],
                    "viewportWidth": metrics["viewportWidth"],
                    "result": "passed",
                })
    browser.close()

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"base": BASE, "checks": results}, indent=2) + "\n", encoding="utf-8")
print(OUT)
