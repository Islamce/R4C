from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://3000-im036ipo5s7thfzwr2g82-69e4e832.us4.manus.computer/design-preview"
OUT = Path("docs/qa-screenshots")
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1440, "height": 1200}, device_scale_factor=1)
    page.goto(BASE, wait_until="networkidle")
    page.screenshot(path=str(OUT / "command-center-1440-full.png"), full_page=True)

    page.get_by_role("tab", name="Project & unit control").click()
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "inventory-1440-full.png"), full_page=True)
    unit_row = page.locator(".unit-row:not(.unit-head)").first
    if unit_row.count():
        unit_row.click()
    page.wait_for_timeout(150)
    page.screenshot(path=str(OUT / "selected-unit-1440-full.png"), full_page=True)

    page.get_by_role("tab", name="Sales operations").click()
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT / "sales-operations-1440-full.png"), full_page=True)

    page.get_by_role("tab", name="Title transfer file").click()
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "title-transfer-1440-full.png"), full_page=True)

    page.locator("button").filter(has_text="العربية").click()
    page.wait_for_function("document.documentElement.dir === 'rtl'", timeout=10000)
    page.wait_for_timeout(350)
    page.screenshot(path=str(OUT / "command-center-arabic-1440-full.png"), full_page=True)
    page.get_by_role("tab", name="ملف الإفراغ العقاري").click()
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "title-transfer-arabic-1440-full.png"), full_page=True)

    mobile = browser.new_page(viewport={"width": 430, "height": 1000}, device_scale_factor=1)
    mobile.goto(BASE, wait_until="networkidle")
    mobile.screenshot(path=str(OUT / "command-center-430-full.png"), full_page=True)
    mobile.get_by_role("tab", name="Project & unit control").click()
    mobile.wait_for_timeout(250)
    mobile_unit = mobile.locator(".unit-row:not(.unit-head)").first
    if mobile_unit.count():
        mobile_unit.click()
    mobile.screenshot(path=str(OUT / "selected-unit-430-full.png"), full_page=True)
    browser.close()
