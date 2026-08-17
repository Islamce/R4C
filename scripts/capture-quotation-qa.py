#!/usr/bin/env python3
"""Capture local synthetic quotation evidence; never calls production or submits a decision."""
from __future__ import annotations

from pathlib import Path
from playwright.sync_api import expect, sync_playwright

BASE = "http://127.0.0.1:3010"
OUT = Path("/home/ubuntu/R4C/artifacts/quotation-qa")
VIEWPORTS = [(1440, 1100), (1024, 1000), (768, 1024), (430, 932), (360, 800)]


def set_locale(page, locale: str) -> None:
    page.context.clear_cookies()
    page.context.add_cookies([{"name": "r4c_locale", "value": locale, "url": BASE}])


def open_surface(page, path: str, width: int, height: int, locale: str) -> None:
    page.set_viewport_size({"width": width, "height": height})
    set_locale(page, locale)
    page.goto(f"{BASE}{path}", wait_until="networkidle")


def capture(page, name: str) -> None:
    page.screenshot(path=str(OUT / name), full_page=True)


OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium")
    page = browser.new_page(viewport={"width": 1440, "height": 1100})

    for locale in ("en", "ar"):
        for width, height in VIEWPORTS:
            open_surface(page, "/design-preview?surface=quotations", width, height, locale)
            staff_title = "Buyer sales quotations" if locale == "en" else "عروض مبيعات المشترين"
            expect(page.get_by_role("heading", name=staff_title)).to_be_visible()
            capture(page, f"staff-quotation-{locale}-{width}.png")

            open_surface(page, "/buyer/quotation/synthetic-buyer-token-preview?preview=1", width, height, locale)
            buyer_title = "Your buyer quotation" if locale == "en" else "عرض المشتري الخاص بك"
            expect(page.get_by_role("heading", name=buyer_title).first).to_be_visible()
            capture(page, f"buyer-quotation-{locale}-{width}.png")

        open_surface(page, "/design-preview?surface=quotations", 1440, 1100, locale)
        if locale == "en":
            page.get_by_label("Lead / customer context").select_option("synthetic-lead-001")
            page.get_by_label("Eligible payment plan").select_option("synthetic-payment-plan-001")
            page.get_by_role("button", name="Open controlled document preview (HTML)").click()
        else:
            page.get_by_label("سياق العميل المحتمل / المشتري").select_option("synthetic-lead-001")
            page.get_by_label("خطة الدفع المؤهلة").select_option("synthetic-payment-plan-001")
            page.get_by_role("button", name="فتح معاينة المستند المحكومة (HTML)").click()
        capture(page, f"staff-html-document-preview-{locale}-1440.png")

        open_surface(page, "/buyer/quotation/synthetic-buyer-token-preview?preview=1", 1440, 1100, locale)
        document_button = "Preview controlled document (HTML)" if locale == "en" else "معاينة المستند المحكومة (HTML)"
        page.get_by_role("button", name=document_button).click()
        capture(page, f"buyer-html-document-preview-{locale}-1440.png")

    browser.close()

print(OUT)
