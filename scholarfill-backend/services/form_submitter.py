"""
Opens the form URL in Playwright, fills all fields with provided data,
takes before+after screenshots, and optionally submits the form.

For Google Forms with entry_id populated on each field, this module first
attempts the pre-fill URL approach (more reliable, no DOM interaction needed).
It falls back to label-based DOM filling when entry IDs are absent.
"""
import base64
from urllib.parse import quote
from playwright.async_api import async_playwright, Page


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def _build_google_prefill_url(url: str, filled_data: dict, form_fields: list) -> str:
    """
    Build a Google Forms pre-fill URL using entry.XXXXXXX IDs stored on each field.

    Returns the pre-fill URL string, or an empty string if no entry_ids exist.

    Example result:
      https://docs.google.com/forms/d/.../viewform?entry.123456=John&entry.789012=Smith
    """
    params: list = []
    for field in form_fields:
        entry_id = field.get("entry_id")
        if not entry_id:
            continue
        value = filled_data.get(field.get("name", ""))
        if not value:
            continue
        params.append(f"entry.{entry_id}={quote(str(value), safe='')}")

    if not params:
        return ""

    # Strip any existing query string from the base URL before appending params
    base_url = url.split("?")[0]
    return f"{base_url}?{'&'.join(params)}"


async def fill_and_submit(
    url: str,
    filled_data: dict,
    form_fields: list,
    submit: bool = False,
    is_google_form: bool = False,
) -> dict:
    """
    Fill a form using Playwright and optionally submit it.
    Runs under WindowsProactorEventLoop if on Windows and SelectorEventLoop is active.
    """
    import sys
    import asyncio

    current_loop = asyncio.get_running_loop()
    loop_type_name = type(current_loop).__name__

    if sys.platform == "win32" and "Proactor" not in loop_type_name:
        def run_sync():
            loop = asyncio.WindowsProactorEventLoopPolicy().new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(
                    _fill_and_submit_impl(url, filled_data, form_fields, submit, is_google_form)
                )
            finally:
                loop.close()
        return await asyncio.to_thread(run_sync)
    else:
        return await _fill_and_submit_impl(url, filled_data, form_fields, submit, is_google_form)


async def _fill_and_submit_impl(
    url: str,
    filled_data: dict,
    form_fields: list,
    submit: bool = False,
    is_google_form: bool = False,
) -> dict:
    """
    Actual implementation of fill_and_submit.
    """
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

        await page.wait_for_timeout(2000)

        # ── BEFORE screenshot — blank, unfilled form ───────────────────────────
        before_bytes = await page.screenshot(full_page=False, type="png")
        screenshot_before_b64 = base64.b64encode(before_bytes).decode("utf-8")
        # Initialise after-screenshot to the same frame in case of early failure
        screenshot_after_b64 = screenshot_before_b64

        errors: list = []
        used_prefill = False

        # ── Google Forms: pre-fill URL approach (preferred) ────────────────────
        if is_google_form:
            prefill_url = _build_google_prefill_url(url, filled_data, form_fields)
            if prefill_url:
                try:
                    await page.goto(prefill_url, wait_until="networkidle", timeout=30000)
                    await page.wait_for_timeout(2000)
                    used_prefill = True
                except Exception as exc:
                    # Pre-fill URL failed — will fall through to DOM-based filling
                    errors.append(f"prefill_url_failed: {exc}")

        # ── DOM-based filling (HTML forms + Google Forms without entry IDs) ─────
        if not used_prefill:
            for field in form_fields:
                field_name = field.get("name", "")
                value = filled_data.get(field_name)
                if not value:
                    continue
                try:
                    if is_google_form:
                        await _fill_google_field(page, field, str(value))
                    else:
                        await _fill_html_field(page, field, str(value))
                except Exception as exc:
                    errors.append(f"{field_name}: {exc}")
                    continue
                await page.wait_for_timeout(200)

        # ── AFTER screenshot — filled form ─────────────────────────────────────
        after_bytes = await page.screenshot(full_page=False, type="png")
        screenshot_after_b64 = base64.b64encode(after_bytes).decode("utf-8")

        # ── Submit if requested ────────────────────────────────────────────────
        if submit:
            try:
                submit_selectors = [
                    "input[type='submit']",
                    "button[type='submit']",
                    "div[role='button'][jsname='M2UYVd']",  # Google Forms submit btn
                    "span:has-text('Submit')",
                    "button:has-text('Submit')",
                    "button:has-text('Send')",
                ]
                submitted = False
                for selector in submit_selectors:
                    try:
                        el = await page.query_selector(selector)
                        if el:
                            await el.click()
                            await page.wait_for_timeout(3000)
                            submitted = True
                            break
                    except Exception:
                        continue

                if not submitted:
                    # Last resort — press Enter on the active element
                    await page.keyboard.press("Enter")
                    await page.wait_for_timeout(2000)

                # Capture the post-submit confirmation screen
                after_bytes = await page.screenshot(full_page=False, type="png")
                screenshot_after_b64 = base64.b64encode(after_bytes).decode("utf-8")

            except Exception as exc:
                await browser.close()
                return {
                    "success": False,
                    "screenshot_before": screenshot_before_b64,
                    "screenshot_after": screenshot_after_b64,
                    "screenshot": screenshot_after_b64,
                    "error": str(exc),
                }

        await browser.close()

        return {
            "success": True,
            "screenshot_before": screenshot_before_b64,
            "screenshot_after": screenshot_after_b64,
            "screenshot": screenshot_after_b64,  # backward-compat alias
            "error": "; ".join(errors) if errors else None,
        }


# ──────────────────────────────────────────────────────────────────────────────
# Field-filling helpers
# ──────────────────────────────────────────────────────────────────────────────

async def _fill_html_field(page: Page, field: dict, value: str) -> None:
    """Fill a standard HTML form field."""
    field_name = field.get("name", "")
    field_type = field.get("type", "text")

    selectors = [
        f"[name='{field_name}']",
        f"[id='{field_name}']",
        f"[placeholder='{field.get('placeholder', '')}']" if field.get("placeholder") else None,
    ]
    selectors = [s for s in selectors if s]

    el = None
    for selector in selectors:
        el = await page.query_selector(selector)
        if el:
            break

    if not el:
        return

    if field_type in ("text", "email", "tel", "url", "number", "password"):
        await el.fill(value)

    elif field_type == "textarea":
        await el.fill(value)

    elif field_type == "select":
        try:
            await el.select_option(label=value)
        except Exception:
            try:
                await el.select_option(value=value)
            except Exception:
                pass

    elif field_type == "radio":
        for sel in (
            f"input[type='radio'][value='{value}']",
            f"input[type='radio'][name='{field_name}'][value='{value}']",
        ):
            try:
                radio = await page.query_selector(sel)
                if radio:
                    await radio.click()
                    break
            except Exception:
                continue

    elif field_type == "checkbox":
        if value.lower() in ("true", "yes", "1", "on"):
            if not await el.is_checked():
                await el.click()

    elif field_type == "date":
        try:
            await el.fill(value[:10])
        except Exception:
            await el.type(value[:10])


async def _fill_google_field(page: Page, field: dict, value: str) -> None:
    """
    Fill a Google Forms field by locating its container via label text.

    Handles: text, textarea, radio, checkbox, select/dropdown, date.
    """
    label = field.get("label", "")
    field_type = field.get("type", "text")

    if not label:
        return

    containers = await page.query_selector_all(
        "div[role='listitem'], div.freebirdFormviewerComponentsQuestionBaseRoot"
    )

    for container in containers:
        try:
            label_el = await container.query_selector(
                "div.freebirdFormviewerComponentsQuestionBaseTitle, "
                "div[class*='questionTitle']"
            )
            if not label_el:
                continue
            if label.lower() not in (await label_el.inner_text()).strip().lower():
                continue

            # ── Fill by type ───────────────────────────────────────────────────
            if field_type in ("text", "email", "tel", "number"):
                input_el = await container.query_selector(
                    "input[type='text'], input[type='email'], input"
                )
                if input_el:
                    await input_el.fill(value)

            elif field_type == "textarea":
                ta = await container.query_selector("textarea")
                if ta:
                    await ta.fill(value)

            elif field_type == "radio":
                for opt_el in await container.query_selector_all("div[role='radio'], label"):
                    if value.lower() in (await opt_el.inner_text()).strip().lower():
                        await opt_el.click()
                        break

            elif field_type == "checkbox":
                # value may be a comma-separated list, e.g. "Option A, Option C"
                targets = [v.strip().lower() for v in value.split(",")]
                for opt_el in await container.query_selector_all(
                    "div[role='checkbox'], label"
                ):
                    opt_text = (await opt_el.inner_text()).strip().lower()
                    if any(t in opt_text for t in targets):
                        aria = await opt_el.get_attribute("aria-checked")
                        if aria != "true":
                            await opt_el.click()

            elif field_type == "select":
                dropdown = await container.query_selector("div[role='listbox'], select")
                if dropdown:
                    await dropdown.click()
                    await page.wait_for_timeout(500)
                    for opt_el in await page.query_selector_all(
                        "div[role='option'], li[role='option']"
                    ):
                        if value.lower() in (await opt_el.inner_text()).strip().lower():
                            await opt_el.click()
                            break

            elif field_type == "date":
                # Try a native date input first
                date_input = await container.query_selector("input[type='date']")
                if date_input:
                    await date_input.fill(value[:10])
                else:
                    # Google Forms renders separate Month / Day / Year number inputs
                    inputs = await container.query_selector_all(
                        "input[type='number'], input[aria-label]"
                    )
                    parts = value[:10].split("-")  # expects YYYY-MM-DD
                    if len(parts) == 3 and len(inputs) >= 3:
                        await inputs[0].fill(parts[1])  # Month
                        await inputs[1].fill(parts[2])  # Day
                        await inputs[2].fill(parts[0])  # Year

            break  # matched container — move to next field
        except Exception:
            continue
