from playwright.sync_api import sync_playwright, expect

BASE = "https://3000-im036ipo5s7thfzwr2g82-69e4e832.us4.manus.computer/design-preview"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1440, "height": 1200})
    page.goto(BASE, wait_until="networkidle")

    expect(page.get_by_text("Working context")).to_be_visible()
    expect(page.get_by_text("Decision queue")).to_be_visible()
    expect(page.get_by_text("Snapshot").first).to_be_visible()

    page.get_by_role("tab", name="Project & unit control").click()
    expect(page.get_by_role("tab", name="Project & unit control")).to_have_attribute("aria-selected", "true")
    first_row = page.locator(".unit-row:not(.unit-head)").first
    first_row.click()
    selected = page.locator(".unit-drawer h2").inner_text()
    assert selected.startswith("A-"), selected
    map_unit = page.locator(".map-unit").last
    map_unit.click()
    selected_after_map = page.locator(".unit-drawer h2").inner_text()
    assert selected_after_map != "", selected_after_map

    page.get_by_role("button", name="Record interest").first.click()
    dialog = page.get_by_role("dialog")
    expect(dialog).to_be_visible()
    expect(dialog.get_by_role("button", name="Close")).to_be_focused()
    page.keyboard.press("Escape")
    expect(dialog).not_to_be_visible()

    page.get_by_role("tab", name="Title transfer file").click()
    expect(page.get_by_text("does not issue title deeds")).to_be_visible()

    page.locator("button").filter(has_text="العربية").click()
    page.wait_for_function("document.documentElement.dir === 'rtl'", timeout=10000)
    assert page.locator("html").get_attribute("dir") == "rtl"
    expect(page.get_by_role("tab", name="ملف الإفراغ العقاري")).to_be_visible()

    browser.close()
    print("commercial browser QA passed")
