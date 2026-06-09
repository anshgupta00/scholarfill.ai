"""
Opens a URL in a headless Playwright browser.
Detects all form fields and returns them as structured JSON.
Handles both standard HTML forms and Google Forms.

Google Forms fields include an `entry_id` (the numeric part of `entry.XXXXXXX`)
extracted from the page source, enabling the pre-fill URL approach in form_submitter.
"""
import re
import base64
import asyncio
from playwright.async_api import async_playwright, Page


async def scrape_form(url: str, google_access_token: str | None = None, html: str | None = None) -> dict:
    """
    Open the URL, scrape form fields, return structured result.
    Runs under WindowsProactorEventLoop if on Windows and SelectorEventLoop is active.
    """
    import sys
    import asyncio

    # Determine if we need to offload to a separate thread with ProactorEventLoop
    # to avoid NotImplementedError on Windows when using SelectorEventLoop
    current_loop = asyncio.get_running_loop()
    loop_type_name = type(current_loop).__name__

    if sys.platform == "win32" and "Proactor" not in loop_type_name:
        def run_sync():
            loop = asyncio.WindowsProactorEventLoopPolicy().new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(_scrape_form_impl(url, google_access_token, html))
            finally:
                loop.close()
        return await asyncio.to_thread(run_sync)
    else:
        return await _scrape_form_impl(url, google_access_token, html)


async def _scrape_form_impl(url: str, google_access_token: str | None = None, html: str | None = None) -> dict:
    """
    Actual implementation of scrape_form.
    """
    # Initial guess — may be wrong for short links like forms.gle (resolved after page load)
    is_google_form = "docs.google.com/forms" in url or "forms.gle" in url

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            context = await browser.new_context(
                viewport={"width": 1280, "height": 900},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 Chrome/120 Safari/537.36"
                ),
            )

            # If the user has connected their Google account, inject auth cookies
            # so Playwright can open sign-in-restricted forms on their behalf.
            if google_access_token:
                await context.add_cookies([
                    {
                        "name": "oauth_token",
                        "value": google_access_token,
                        "domain": ".google.com",
                        "path": "/",
                        "httpOnly": False,
                        "secure": True,
                    }
                ])
                # Set Authorization header for all requests to google.com
                await context.set_extra_http_headers({
                    "Authorization": f"Bearer {google_access_token}"
                })

            page = await context.new_page()

            if html:
                await page.set_content(html)
                current_url = url
            else:
                try:
                    await page.goto(url, wait_until="networkidle", timeout=30000)
                except Exception:
                    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)
                current_url = page.url

            # Re-evaluate is_google_form from the final (post-redirect) URL
            is_google_form = "docs.google.com/forms" in current_url

            # Editing link guard (catches /edit in final URL too)
            if is_google_form and "/edit" in current_url:
                raise ValueError(
                    "You pasted a Google Forms editing link. "
                    "scholarfill.ai requires the public form link. Please click 'Send' on your Google Form "
                    "and use the link ending in '/viewform' instead."
                )

            # Check redirect to Google Accounts or other login pages
            if "accounts.google.com" in current_url:
                raise ValueError(
                    "This Google Form requires you to sign in to Google. "
                    "Google restricts automated browsers from signing in. "
                    "Please save the form as an HTML file in your browser and upload it here instead."
                )

            if "login" in current_url.lower() or "signin" in current_url.lower():
                if "login" not in url.lower() and "signin" not in url.lower():
                    raise ValueError(
                        "The form redirected to a login page. "
                        "scholarfill.ai cannot scrape forms that require sign-in or authentication."
                    )

            # Page title
            title = await page.title()
            title = (
                title.replace(" - Google Forms", "")
                .replace(" | Google Forms", "")
                .strip()
            )
            title_lower = title.lower()

            # Screenshot of the loaded page
            screenshot_bytes = await page.screenshot(full_page=False, type="png")
            screenshot_b64 = base64.b64encode(screenshot_bytes).decode("utf-8")

            fields = []
            if is_google_form:
                fields = await _scrape_google_form(page)
            else:
                fields = await _scrape_html_form(page)

            if not fields:
                body_text = await page.inner_text("body")
                body_lower = body_text.lower()

                if (
                    "sign in" in body_lower or
                    "log in" in body_lower or
                    "google accounts" in body_lower or
                    "need permission" in body_lower or
                    "need permission" in title_lower or
                    "owner's organization" in body_lower or
                    "only be viewed by" in body_lower
                ):
                    raise ValueError(
                        "This form requires permissions or Google signing in (e.g. restricted to organization users). "
                        "scholarfill.ai cannot access restricted or private forms. Please make sure the form is shared publicly."
                    )

                if (
                    "no longer accepting responses" in body_lower or
                    "form closed" in body_lower or
                    "no longer accepting responses" in title_lower
                ):
                    raise ValueError(
                        "This form is closed and no longer accepting responses."
                    )

                raise ValueError(
                    "No form fields were detected on the page. "
                    "Please verify that the page contains an interactive form."
                )


            # Optional description / intro text
            description = ""
            try:
                desc_el = await page.query_selector(
                    "div.freebirdFormviewerViewHeaderDescription, "
                    ".form-description, p.description"
                )
                if desc_el:
                    description = (await desc_el.inner_text()).strip()
            except Exception:
                pass

            return {
                "title": title or "Untitled Form",
                "description": description,
                "fields": fields,
                "screenshot": screenshot_b64,
                "is_google_form": is_google_form,
                "final_url": current_url,  # the fully resolved URL after any redirects
            }
        finally:
            await browser.close()



# ──────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────────────────────

async def _scrape_google_form(page: Page) -> list:
    """
    Extract fields from Google Forms by parsing the FB_PUBLIC_LOAD_DATA_ JS variable
    that Google embeds in every form page.

    This is far more reliable than DOM scraping because:
    - It's unaffected by CSS class name changes / obfuscation
    - It gives us exact question text, entry IDs, types, and options directly
    - It works even when the form hasn't fully rendered visually

    Falls back to DOM-based extraction if the JS variable is not found.
    """
    import json as _json

    # ── Step 1: Extract FB_PUBLIC_LOAD_DATA_ from page source ─────────────────
    raw_data = None
    try:
        # Evaluate directly in the browser — most reliable
        raw_data = await page.evaluate("() => window.FB_PUBLIC_LOAD_DATA_")
    except Exception:
        pass

    if not raw_data:
        # Fallback: extract from raw HTML via regex
        try:
            html = await page.content()
            match = re.search(r"var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\]);\s*</script>", html, re.DOTALL)
            if match:
                raw_data = _json.loads(match.group(1))
        except Exception:
            pass

    if raw_data:
        return _parse_fb_public_load_data(raw_data)

    # ── Step 2: DOM fallback (older / edge-case forms) ─────────────────────────
    return await _scrape_google_form_dom(page)


def _parse_fb_public_load_data(data: list) -> list:
    """
    Parse the nested FB_PUBLIC_LOAD_DATA_ structure into a flat list of field dicts.

    Google Forms type codes:
      0 = short answer (text)
      1 = paragraph   (textarea)
      2 = multiple choice (radio)
      3 = dropdown    (select)
      4 = checkboxes  (checkbox)
      5 = linear scale
      7 = grid / multiple choice grid
      9 = date
      10 = time
    """
    TYPE_MAP = {
        0: "text",
        1: "textarea",
        2: "radio",
        3: "select",
        4: "checkbox",
        5: "text",    # linear scale — treat as text
        7: "text",    # grid — treat as text
        9: "date",
        10: "text",   # time
        13: "file",   # file upload
    }

    fields = []
    try:
        # Questions live at data[1][1] — a list of question groups
        question_groups = data[1][1]
    except (IndexError, TypeError):
        return fields

    for group in question_groups:
        try:
            label = str(group[1]).strip() if group[1] else ""
            type_code = int(group[3]) if group[3] is not None else 0
            field_type = TYPE_MAP.get(type_code, "text")

            # group[4] = list of input items (usually one per question, multiple for grid)
            items = group[4] if len(group) > 4 and isinstance(group[4], list) else []

            for item in items:
                try:
                    # Entry ID
                    entry_id = str(item[0]) if item and item[0] else None

                    # Options (for radio, select, checkbox)
                    options: list = []
                    if len(item) > 1 and isinstance(item[1], list):
                        for opt in item[1]:
                            try:
                                opt_text = str(opt[0]).strip()
                                if opt_text:
                                    options.append(opt_text)
                            except Exception:
                                continue

                    # Required flag sits at group[4][i][2] == 1
                    required = False
                    try:
                        required = bool(item[2]) if len(item) > 2 else False
                    except Exception:
                        pass

                    # Use item-level label if present (grids have per-row labels)
                    item_label = label
                    if len(item) > 3 and item[3]:
                        item_label = str(item[3]).strip() or label

                    # Sanitise into a safe field_name key
                    field_name = (
                        item_label.lower()
                        .replace(" ", "_")
                        .replace("/", "_")
                        .replace("?", "")
                        .replace("*", "")
                        .replace("(", "")
                        .replace(")", "")
                        .replace(",", "")[:50]
                    )
                    field_name = "".join(c for c in field_name if c.isalnum() or c == "_")
                    field_name = field_name.strip("_") or f"field_{len(fields)}"

                    # Deduplicate field names
                    base_name = field_name
                    suffix = 2
                    existing_names = {f["name"] for f in fields}
                    while field_name in existing_names:
                        field_name = f"{base_name}_{suffix}"
                        suffix += 1

                    fields.append({
                        "name": field_name,
                        "label": item_label,
                        "type": field_type,
                        "required": required,
                        "options": options,
                        "placeholder": "",
                        "entry_id": entry_id,
                    })
                except Exception:
                    continue
        except Exception:
            continue

    return fields


async def _scrape_google_form_dom(page: Page) -> list:
    """DOM-based fallback for Google Forms (used when FB_PUBLIC_LOAD_DATA_ is absent)."""
    fields = []

    field_containers = await page.query_selector_all(
        "div[data-params], div.freebirdFormviewerComponentsQuestionBaseRoot"
    )
    if not field_containers:
        field_containers = await page.query_selector_all("div[role='listitem']")

    for i, container in enumerate(field_containers):
        try:
            # Try multiple label selectors — Google rotates class names
            label = ""
            for sel in [
                "div.freebirdFormviewerComponentsQuestionBaseTitle",
                "div[class*='questionTitle']",
                "span[class*='title']",
                "[role='heading']",
            ]:
                try:
                    el = await container.query_selector(sel)
                    if el:
                        label = (await el.inner_text()).strip()
                        if label:
                            break
                except Exception:
                    continue

            if not label:
                label = f"Field {i + 1}"

            required = False
            try:
                req_el = await container.query_selector(
                    "span[aria-label='Required question'], "
                    "span.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk"
                )
                required = req_el is not None
            except Exception:
                pass

            field_type = "text"
            options: list = []

            if await container.query_selector("textarea"):
                field_type = "textarea"

            radio_group = await container.query_selector("div[role='radiogroup']")
            if radio_group:
                field_type = "radio"
                for opt_el in await radio_group.query_selector_all("div[role='radio'] span, label span"):
                    text = (await opt_el.inner_text()).strip()
                    if text and text not in options:
                        options.append(text)

            checkbox_group = await container.query_selector("div[role='group']")
            if checkbox_group and not radio_group:
                field_type = "checkbox"
                for opt_el in await checkbox_group.query_selector_all("div[role='checkbox'] span, label span"):
                    text = (await opt_el.inner_text()).strip()
                    if text and text not in options:
                        options.append(text)

            if await container.query_selector("select, div[role='listbox']"):
                field_type = "select"
                for opt_el in await container.query_selector_all("option, div[role='option']"):
                    text = (await opt_el.inner_text()).strip()
                    if text and text not in options:
                        options.append(text)

            if await container.query_selector("input[type='date'], div.freebirdFormviewerComponentsQuestionDateDateInputs"):
                field_type = "date"

            field_name = (
                label.lower().replace(" ", "_").replace("/", "_")
                .replace("?", "").replace("*", "")[:40]
            )
            field_name = "".join(c for c in field_name if c.isalnum() or c == "_")
            field_name = field_name or f"field_{i}"

            fields.append({
                "name": field_name,
                "label": label,
                "type": field_type,
                "required": required,
                "options": options,
                "placeholder": "",
                "entry_id": None,
            })
        except Exception:
            continue

    # Assign entry IDs by position from page source
    try:
        html = await page.content()
        raw = re.findall(r"entry\.(\d{7,12})", html)
        seen: set = set()
        entry_ids = [x for x in raw if not (x in seen or seen.add(x))]  # type: ignore[func-returns-value]
        for i, field in enumerate(fields):
            field["entry_id"] = entry_ids[i] if i < len(entry_ids) else None
    except Exception:
        pass

    return fields




async def _scrape_html_form(page: Page) -> list:
    """Extract fields from standard HTML forms."""
    fields: list = []
    seen_names: set = set()

    elements = await page.query_selector_all(
        "input:not([type='hidden']):not([type='submit'])"
        ":not([type='button']):not([type='reset']):not([type='image']), "
        "textarea, "
        "select"
    )

    for el in elements:
        try:
            tag = (await el.evaluate("el => el.tagName")).lower()
            el_type = (await el.get_attribute("type") or "text").lower()
            el_name = await el.get_attribute("name") or await el.get_attribute("id") or ""
            el_id = await el.get_attribute("id") or ""
            placeholder = await el.get_attribute("placeholder") or ""
            required = (await el.get_attribute("required")) is not None

            if not el_name or el_name in seen_names:
                continue
            seen_names.add(el_name)

            # Resolve label: explicit for= → aria-label → closest <label> → placeholder
            label = ""
            if el_id:
                lbl_el = await page.query_selector(f"label[for='{el_id}']")
                if lbl_el:
                    label = (await lbl_el.inner_text()).strip()
            if not label:
                label = await el.get_attribute("aria-label") or ""
            if not label:
                label = await el.evaluate(
                    "el => { const p = el.closest('label'); return p ? p.innerText.trim() : ''; }"
                )
            if not label:
                label = placeholder or el_name.replace("_", " ").replace("-", " ").title()

            # Field type
            if tag == "textarea":
                field_type = "textarea"
            elif tag == "select":
                field_type = "select"
            else:
                valid = {
                    "text", "email", "tel", "date", "number",
                    "password", "radio", "checkbox", "file", "url",
                }
                field_type = el_type if el_type in valid else "text"

            # Options for <select>
            options: list = []
            if field_type == "select":
                for opt in await el.query_selector_all("option"):
                    val = (await opt.inner_text()).strip()
                    if val and val not in {"--", "Select", "Choose", "---"}:
                        options.append(val)

            fields.append(
                {
                    "name": el_name,
                    "label": label,
                    "type": field_type,
                    "required": required,
                    "options": options,
                    "placeholder": placeholder,
                    "entry_id": None,  # not applicable for standard HTML forms
                }
            )
        except Exception:
            continue

    return fields
