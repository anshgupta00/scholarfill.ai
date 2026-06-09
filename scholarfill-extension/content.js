// content.js - scholarfill.ai Helper

// 1. JWT TOKEN SYNCHRONIZATION
if (window.location.host === "localhost:5173") {
  // Sync token from localStorage to chrome.storage
  const syncToken = () => {
    const token = localStorage.getItem('sf_token');
    chrome.storage.local.get(['sf_token'], (res) => {
      if (token !== res.sf_token) {
        if (token) {
          chrome.storage.local.set({ sf_token: token }, () => {
            console.log("[scholarfill.ai Extension] Token synced successfully.");
          });
        } else {
          chrome.storage.local.remove('sf_token', () => {
            console.log("[scholarfill.ai Extension] Token cleared.");
          });
        }
      }
    });
  };

  // Sync immediately and set up polling interval to catch changes
  syncToken();
  setInterval(syncToken, 1000);
}

// 2. FORM ACTION HANDLERS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_PAGE_DATA") {
    // Send the current page HTML and URL to the popup
    sendResponse({
      html: document.documentElement.outerHTML,
      url: window.location.href,
      title: document.title
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === "FILL_FORM") {
    const { fields, data, isGoogleForm } = request;
    try {
      if (isGoogleForm) {
        fillGoogleForm(fields, data);
      } else {
        fillStandardForm(fields, data);
      }
      sendResponse({ success: true });
    } catch (error) {
      console.error("[scholarfill.ai Extension] Autofill error:", error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});

// Helper to trigger events to make sure Google Form script detects the input
function triggerInputEvents(element, value) {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

// 3. GOOGLE FORM CLIENT-SIDE AUTOFILL
function fillGoogleForm(fields, data) {
  console.log("[scholarfill.ai Extension] Starting Google Form autofill...", { fields, data });

  // Google Forms groups questions inside div elements with role="listitem" or data-params
  const containers = document.querySelectorAll('div[role="listitem"], div[data-params]');

  containers.forEach(container => {
    // Try to find the question label
    const titleEl = container.querySelector('div[class*="Title"], div[class*="questionTitle"], span[class*="title"], [role="heading"]');
    if (!titleEl) return;

    const labelText = titleEl.innerText.trim().toLowerCase();

    // Match label with fields
    const matchedField = fields.find(f => {
      const fieldLabel = f.label.trim().toLowerCase();
      return labelText.includes(fieldLabel) || fieldLabel.includes(labelText);
    });

    if (!matchedField) return;

    const value = data[matchedField.name];
    if (value === undefined || value === null || value === '') return;

    const valStr = String(value).trim();
    const type = matchedField.type;

    console.log(`[scholarfill.ai Extension] Filling field "${matchedField.label}" with value:`, valStr);

    if (type === 'text' || type === 'email' || type === 'tel' || type === 'url') {
      const input = container.querySelector('input[type="text"], input[type="email"], input:not([type])');
      if (input) {
        triggerInputEvents(input, valStr);
      }
    } else if (type === 'textarea') {
      const textarea = container.querySelector('textarea');
      if (textarea) {
        triggerInputEvents(textarea, valStr);
      }
    } else if (type === 'radio') {
      const radioButtons = container.querySelectorAll('div[role="radio"]');
      radioButtons.forEach(radio => {
        const optText = radio.innerText.trim().toLowerCase();
        if (optText === valStr.toLowerCase() || optText.includes(valStr.toLowerCase()) || valStr.toLowerCase().includes(optText)) {
          radio.click();
        }
      });
    } else if (type === 'checkbox') {
      // For checkbox, value might be a comma-separated list
      const targetValues = valStr.split(',').map(v => v.trim().toLowerCase());
      const checkboxes = container.querySelectorAll('div[role="checkbox"]');
      checkboxes.forEach(chk => {
        const optText = chk.innerText.trim().toLowerCase();
        const shouldBeChecked = targetValues.some(t => optText === t || optText.includes(t) || t.includes(optText));
        const isChecked = chk.getAttribute('aria-checked') === 'true';

        if (shouldBeChecked !== isChecked) {
          chk.click();
        }
      });
    } else if (type === 'select') {
      // Google Forms dropdown is a custom listbox
      const listbox = container.querySelector('div[role="listbox"]');
      if (listbox) {
        listbox.click(); // Click to open dropdown

        // Listbox options are rendered globally in a popup. We wait a split second.
        setTimeout(() => {
          const options = document.querySelectorAll('div[role="option"], li[role="option"]');
          for (const opt of options) {
            const optText = opt.innerText.trim().toLowerCase();
            if (optText === valStr.toLowerCase() || optText.includes(valStr.toLowerCase())) {
              opt.click();
              break;
            }
          }
        }, 150);
      }
    } else if (type === 'date') {
      const dateInput = container.querySelector('input[type="date"]');
      if (dateInput) {
        triggerInputEvents(dateInput, valStr);
      } else {
        // Fallback: MM/DD/YYYY inputs inside Google forms date question
        const dateInputs = container.querySelectorAll('input[type="number"], input[aria-label]');
        const dateParts = valStr.split('-'); // YYYY-MM-DD
        if (dateParts.length === 3 && dateInputs.length >= 3) {
          triggerInputEvents(dateInputs[0], dateParts[1]); // Month
          triggerInputEvents(dateInputs[1], dateParts[2]); // Day
          triggerInputEvents(dateInputs[2], dateParts[0]); // Year
        }
      }
    }
  });
}

// 4. STANDARD HTML FORM AUTOFILL
function fillStandardForm(fields, data) {
  console.log("[scholarfill.ai Extension] Starting standard HTML Form autofill...", { fields, data });

  fields.forEach(field => {
    const value = data[field.name];
    if (value === undefined || value === null || value === '') return;

    const valStr = String(value).trim();
    const selectors = [
      `[name="${field.name}"]`,
      `[id="${field.name}"]`,
      `[placeholder="${field.placeholder}"]`
    ].filter(s => s && s !== '[placeholder=""]');

    let element = null;
    for (const selector of selectors) {
      element = document.querySelector(selector);
      if (element) break;
    }

    if (!element) return;

    const type = field.type;

    if (type === 'text' || type === 'email' || type === 'tel' || type === 'url' || type === 'number') {
      triggerInputEvents(element, valStr);
    } else if (type === 'textarea') {
      triggerInputEvents(element, valStr);
    } else if (type === 'select') {
      element.value = valStr;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (type === 'radio') {
      const radio = document.querySelector(`input[type="radio"][name="${field.name}"][value="${valStr}"]`) ||
                    document.querySelector(`input[type="radio"][value="${valStr}"]`);
      if (radio) radio.click();
    } else if (type === 'checkbox') {
      const shouldCheck = valStr.toLowerCase() === 'true' || valStr === '1' || valStr.toLowerCase() === 'yes';
      if (element.checked !== shouldCheck) {
        element.click();
      }
    } else if (type === 'date') {
      triggerInputEvents(element, valStr.substring(0, 10));
    }
  });
}
