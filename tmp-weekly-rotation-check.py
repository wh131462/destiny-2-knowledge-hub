import json
from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent
fixture_path = Path("/tmp/weekly-rotation-browser.json")
if not fixture_path.exists():
    raise SystemExit("missing /tmp/weekly-rotation-browser.json; run rotation:sync:fixture first")
fixture = json.loads(fixture_path.read_text())


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        desktop = browser.new_page(viewport={"width": 1440, "height": 1000})
        desktop.on("console", lambda message: print("console:", message.type, message.text))
        desktop.on("pageerror", lambda error: print("pageerror:", error))
        desktop.route("**/data/weekly-rotation.json", lambda route: route.fulfill(status=200, content_type="application/json", body=json.dumps(fixture)))
        response = desktop.goto("http://127.0.0.1:9999/#/weekly-rotation")
        desktop.wait_for_load_state("networkidle")
        print("response:", response.status if response else None, "url:", desktop.url, "title:", desktop.title())
        print("body:", desktop.locator("body").inner_text(timeout=5000)[:500])
        desktop.screenshot(path="/tmp/weekly-rotation-desktop.png", full_page=True)
        print("desktop title:", desktop.locator("h1").inner_text())
        print("desktop cards:", desktop.locator(".rotation-card").count())
        print("desktop selects:", desktop.locator(".ant-select").count())
        print("desktop overflow:", desktop.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"))
        print("desktop query:", desktop.url)

        desktop.locator(".rotation-filters .ant-select").first.click()
        desktop.get_by_text("PvP / 熔炉", exact=True).click()
        desktop.wait_for_timeout(200)
        print("pvp cards:", desktop.locator(".rotation-card").count())
        print("filtered query:", desktop.url)
        desktop.locator(".filter-reset").click()
        desktop.wait_for_timeout(200)
        desktop.locator(".rotation-card-toggle").first.click()
        print("expanded:", desktop.locator(".rotation-card.expanded").count())
        print("manifest links:", desktop.locator("a[href*='/manifest']").count())
        desktop.context.grant_permissions(["clipboard-read", "clipboard-write"], origin="http://127.0.0.1:9999")
        desktop.get_by_role("button", name="复制摘要").click()
        print("copy feedback:", desktop.get_by_role("button", name="已复制").count())
        desktop.keyboard.press("Tab")
        print("active tag:", desktop.evaluate("document.activeElement.tagName"))

        mobile = browser.new_page(viewport={"width": 375, "height": 900})
        mobile.route("**/data/weekly-rotation.json", lambda route: route.fulfill(status=200, content_type="application/json", body=json.dumps(fixture)))
        mobile.goto("http://127.0.0.1:9999/#/weekly-rotation?category=pve")
        mobile.wait_for_load_state("networkidle")
        mobile.screenshot(path="/tmp/weekly-rotation-mobile.png", full_page=True)
        print("mobile cards:", mobile.locator(".rotation-card").count())
        print("mobile overflow:", mobile.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"))
        print("mobile query:", mobile.url)
        desktop.close()
        mobile.close()
        browser.close()


if __name__ == "__main__":
    main()
