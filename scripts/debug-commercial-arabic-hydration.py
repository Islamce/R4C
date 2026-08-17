"""Diagnostic-only helper for Arabic preview hydration failures.

This script is intentionally read-only. It records whether the Arabic tab button hydrates
and can activate the inventory panel on the target supplied by R4C_QA_BASE.
"""

import os
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

BASE = os.environ.get("R4C_QA_BASE", "http://127.0.0.1:3000/design-preview")
parsed_base = urlsplit(BASE)
COOKIE_ORIGIN = f"{parsed_base.scheme}://{parsed_base.netloc}"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    context = browser.new_context(viewport={"width": 1440, "height": 1200})
    context.add_cookies([{"name": "r4c_locale", "value": "ar", "url": COOKIE_ORIGIN}])
    page = context.new_page()
    page.on("console", lambda msg: print(f"console:{msg.type}:{msg.text}"))
    page.on("pageerror", lambda error: print(f"pageerror:{error}"))
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(1500)
    print("target", BASE)
    print("dir", page.locator("html").get_attribute("dir"))
    print("before", page.locator("#commercial-tab-units").get_attribute("aria-selected"))
    page.locator("#commercial-tab-units").click(force=True)
    page.wait_for_timeout(500)
    print("after", page.locator("#commercial-tab-units").get_attribute("aria-selected"))
    print("units-panel-count", page.locator("#commercial-panel-units").count())
    browser.close()
