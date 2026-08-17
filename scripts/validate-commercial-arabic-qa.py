"""Read-only Playwright regression for the Arabic commercial design preview.

Run with a stable target, for example:
  R4C_QA_BASE=https://<authorized-host>/design-preview \
    python3 scripts/validate-commercial-arabic-qa.py

The script never invokes create, hold, reservation, transfer, or status-changing actions.
"""

import os
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("R4C_QA_BASE", "http://127.0.0.1:3000/design-preview")
parsed_base = urlsplit(BASE)
COOKIE_ORIGIN = f"{parsed_base.scheme}://{parsed_base.netloc}"

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium",
        args=["--no-sandbox", "--enable-webgl", "--ignore-gpu-blocklist", "--use-gl=swiftshader"],
    )
    context = browser.new_context(viewport={"width": 1440, "height": 1200})
    # The connected browser has already verified the user-facing locale toggle. For
    # deterministic headless coverage, seed the same official locale cookie before
    # navigation rather than racing the client-side reload.
    context.add_cookies([{"name": "r4c_locale", "value": "ar", "url": COOKIE_ORIGIN}])
    page = context.new_page()
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(1200)
    expect(page.get_by_text("الذكاء التجاري")).to_be_visible()
    assert page.locator("html").get_attribute("dir") == "rtl"

    # Executive live-state / exception surfaces.
    expect(page.get_by_text("سياق العمل")).to_be_visible()
    expect(page.get_by_text("حداثة البيانات")).to_be_visible()
    expect(page.get_by_text("أفضل إجراء تالٍ")).to_be_visible()
    expect(page.get_by_text("الاستثناءات الحية")).to_be_visible()
    expect(page.get_by_text("لا توجد استثناءات محكومة نشطة")).to_be_visible()
    expect(page.get_by_text("لا توجد قاعدة حتمية تتطلب إجراءً حالياً")).to_be_visible()

    # Inventory and selected-unit workspace.
    page.locator("#commercial-tab-units").click()
    expect(page.locator("#commercial-panel-units")).to_be_visible()
    expect(page.locator("#commercial-tab-units")).to_have_attribute("aria-selected", "true")
    expect(page.get_by_text("مستعرض المباني")).to_be_visible()
    expect(page.get_by_text("المتاح").first).to_be_visible()
    expect(page.get_by_text("تسجيل اهتمام").first).to_be_visible()
    first_row = page.locator(".unit-row:not(.unit-head)").first
    first_row.click()
    expect(page.locator(".unit-drawer")).to_be_visible()
    assert page.locator(".unit-drawer h2").inner_text().startswith("A-")

    # Title-transfer presentation surface retains controlled government wording in Arabic.
    page.locator("#commercial-tab-transfer").click()
    expect(page.locator("#commercial-panel-transfer")).to_be_visible()
    expect(page.locator("#commercial-tab-transfer")).to_have_attribute("aria-selected", "true")
    expect(page.get_by_text("قائمة جاهزية الإفراغ العقاري")).to_be_visible()
    expect(page.get_by_text("لا يصدر صكوك الملكية")).to_be_visible()

    # Sales operations preview remains localized; no create, hold, reservation, or status action is invoked.
    page.locator("#commercial-tab-operations").click()
    expect(page.locator("#commercial-panel-operations")).to_be_visible()
    expect(page.locator("#commercial-tab-operations")).to_have_attribute("aria-selected", "true")
    expect(page.get_by_text("تسجيل بيانات وأدلة المشتري")).to_be_visible()
    expect(page.get_by_text("المخزون المحدد")).to_be_visible()
    expect(page.get_by_text("فتح الوحدة المرتبطة")).to_be_visible()
    expect(page.get_by_text("الوحدة المفضلة")).to_be_visible()
    expect(page.get_by_text("الدليل")).to_be_visible()

    browser.close()
    print(f"commercial Arabic browser QA passed against {BASE}")
