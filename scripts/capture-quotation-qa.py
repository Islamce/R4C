#!/usr/bin/env python3
"""Capture local synthetic quotation design previews; never calls production or submits a decision."""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3010"
OUT = Path("/home/ubuntu/r4c-quotation-qa")
OUT.mkdir(parents=True, exist_ok=True)


def shot(page, path: str, width: int, height: int, locale: str = "en"):
    page.set_viewport_size({"width": width, "height": height})
    page.context.clear_cookies()
    page.context.add_cookies([{"name": "r4c_locale", "value": locale, "url": BASE}])
    page.goto(f"{BASE}{path}", wait_until="networkidle")
    page.screenshot(path=str(OUT / f"{path.strip('/').replace('/', '-').replace('?', '-') or 'home'}-{locale}-{width}.png"), full_page=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium")
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    shot(page, "/design-preview?surface=quotations", 1440, 1100)
    # Open the snapshot-derived document preview before capturing it.
    page.get_by_role("button", name="Open controlled document preview (HTML)").click()
    page.screenshot(path=str(OUT / "quotation-html-document-preview-en-1440.png"), full_page=True)
    shot(page, "/buyer/quotation/synthetic-buyer-token-preview?preview=1", 1440, 1100)
    page.get_by_role("button", name="Preview controlled document (HTML)").click()
    page.screenshot(path=str(OUT / "buyer-html-document-preview-en-1440.png"), full_page=True)
    shot(page, "/buyer/quotation/synthetic-buyer-token-preview?preview=1", 430, 932)
    page.get_by_role("button", name="Accept quotation").click()
    page.get_by_role("button", name="Record decision").click()
    page.screenshot(path=str(OUT / "buyer-accepted-en-430.png"), full_page=True)
    shot(page, "/buyer/quotation/synthetic-buyer-token-preview?preview=1", 430, 932)
    page.get_by_role("button", name="Decline quotation").click()
    page.get_by_role("button", name="Record decision").click()
    page.screenshot(path=str(OUT / "buyer-declined-en-430.png"), full_page=True)
    shot(page, "/buyer/quotation/synthetic-buyer-token-preview?preview=1&state=expired", 430, 932)
    page.screenshot(path=str(OUT / "buyer-expired-en-430.png"), full_page=True)
    shot(page, "/design-preview?surface=flutter", 1440, 1100)
    shot(page, "/design-preview?surface=quotations", 1440, 1100, "ar")
    page.get_by_role("button", name="فتح معاينة المستند المحكومة (HTML)").click()
    page.screenshot(path=str(OUT / "quotation-html-document-preview-ar-1440.png"), full_page=True)
    shot(page, "/buyer/quotation/synthetic-buyer-token-preview?preview=1", 430, 932, "ar")
    shot(page, "/design-preview?surface=flutter", 430, 932, "ar")
    browser.close()

print(OUT)
