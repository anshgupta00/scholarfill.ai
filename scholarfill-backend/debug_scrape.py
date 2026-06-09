"""
Debug script - runs the scraper and saves screenshot + HTML to disk.
Usage: python debug_scrape.py <form_url>
"""
import asyncio
import sys
import base64
from playwright.async_api import async_playwright


async def debug(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/120 Safari/537.36"
            ),
        )
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        await page.wait_for_timeout(3000)

        print(f"Final URL : {page.url}")
        print(f"Page title: {await page.title()}")

        # Save screenshot
        screenshot = await page.screenshot(full_page=True, type="png")
        with open("debug_screenshot.png", "wb") as f:
            f.write(screenshot)
        print("Screenshot saved -> debug_screenshot.png")

        # Save HTML
        html = await page.content()
        with open("debug_page.html", "w", encoding="utf-8") as f:
            f.write(html)
        print(f"HTML saved  -> debug_page.html  ({len(html):,} bytes)")

        # Count Google Forms question containers
        containers = await page.query_selector_all(
            "div[data-params], div.freebirdFormviewerComponentsQuestionBaseRoot, div[role='listitem']"
        )
        print(f"Question containers found: {len(containers)}")

        body_snippet = (await page.inner_text("body"))[:800]
        print(f"\n--- Body text (first 800 chars) ---\n{body_snippet}\n---")

        await browser.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_scrape.py <url>")
        sys.exit(1)
    asyncio.run(debug(sys.argv[1]))
