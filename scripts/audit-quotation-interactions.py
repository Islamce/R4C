#!/usr/bin/env python3
"""Read-only UX interaction audit for synthetic quotation design surfaces."""
from __future__ import annotations

import json
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

BASE = "http://127.0.0.1:3010"
OUT = Path("/home/ubuntu/r4c-quotation-qa/ux-interaction-audit.json")
results: dict[str, str] = {}


def set_locale(page, locale: str) -> None:
    page.context.clear_cookies()
    page.context.add_cookies([{"name": "r4c_locale", "value": locale, "url": BASE}])


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium")
    page = browser.new_page(viewport={"width": 1440, "height": 1000})

    set_locale(page, "en")
    page.goto(f"{BASE}/design-preview?surface=quotations", wait_until="networkidle")
    expect(page.get_by_role("heading", name="Buyer sales quotations")).to_be_visible()
    expect(page.get_by_text("DESIGN/UAT PREVIEW", exact=False).first).to_be_visible()
    lead_selector = page.get_by_label("Lead / customer context")
    expect(lead_selector).to_be_enabled()
    lead_selector.select_option("synthetic-lead-001")
    plan_selector = page.get_by_label("Eligible payment plan")
    expect(plan_selector).to_be_enabled()
    plan_selector.select_option("synthetic-payment-plan-001")
    expect(page.get_by_text("Authoritative lead context")).to_be_visible()
    expect(page.locator(".quotation-lead-context").get_by_text("Al Rawdah Residences / B2-804")).to_be_visible()
    results["staff_lead_context_and_payment_plan_selectors"] = "passed"
    page.get_by_role("button", name="Open PDF preview").click()
    expect(page.get_by_role("dialog", name="PDF preview")).to_be_visible()
    page.get_by_role("button", name="Close document preview").click()
    expect(page.get_by_role("dialog", name="PDF preview")).to_have_count(0)
    results["staff_workspace_and_pdf_preview"] = "passed"

    page.set_viewport_size({"width": 430, "height": 932})
    page.goto(f"{BASE}/buyer/quotation/synthetic-buyer-token-preview?preview=1", wait_until="networkidle")
    expect(page.locator("h1", has_text="Your buyer quotation")).to_be_visible()
    page.get_by_role("button", name="Preview controlled PDF").click()
    expect(page.get_by_role("dialog", name="Preview controlled PDF")).to_be_visible()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog", name="Preview controlled PDF")).to_have_count(0)
    page.get_by_role("button", name="Accept quotation").click()
    expect(page.get_by_text("You are recording acceptance", exact=False)).to_be_visible()
    expect(page.get_by_role("button", name="Record decision")).to_be_enabled()
    page.get_by_role("button", name="Record decision").click()
    expect(page.get_by_text("Decision recorded")).to_be_visible()
    expect(page.locator(".buyer-receipt").get_by_text("It does not create a unit hold", exact=False)).to_be_visible()
    results["buyer_acceptance_receipt"] = "passed"

    page.goto(f"{BASE}/buyer/quotation/synthetic-buyer-token-preview?preview=1", wait_until="networkidle")
    page.get_by_role("button", name="Request clarification").click()
    expect(page.get_by_text("A message is required.")).to_be_visible()
    expect(page.get_by_role("textbox").last).to_have_attribute("required", "")
    results["buyer_clarification_guidance"] = "passed"

    page.goto(f"{BASE}/buyer/quotation/synthetic-buyer-token-preview?preview=1&state=expired", wait_until="networkidle")
    expect(page.get_by_text("This quotation has expired.")).to_be_visible()
    expect(page.get_by_role("button", name="Record decision")).to_have_count(0)
    results["buyer_expiry_disables_decision"] = "passed"

    set_locale(page, "ar")
    page.goto(f"{BASE}/buyer/quotation/synthetic-buyer-token-preview?preview=1", wait_until="networkidle")
    expect(page.locator("main[dir='rtl']")).to_be_visible()
    expect(page.locator("h1", has_text="عرض المشتري الخاص بك")).to_be_visible()
    page.get_by_role("button", name="معاينة PDF محكومة").click()
    expect(page.get_by_role("dialog", name="معاينة PDF محكومة")).to_be_visible()
    page.get_by_role("button", name="إغلاق معاينة المستند").click()
    results["buyer_arabic_rtl_and_document"] = "passed"

    set_locale(page, "en")
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto(f"{BASE}/design-preview?surface=flutter", wait_until="networkidle")
    expect(page.get_by_role("heading", name="Flutter internal-sales companion")).to_be_visible()
    page.get_by_role("button", name="Offline queue").click()
    expect(page.get_by_text("No connection. Draft saved locally", exact=False)).to_be_visible()
    results["flutter_offline_state"] = "passed"

    browser.close()

OUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
print(OUT)
