// popup.js - scholarfill.ai Helper Control Logic

const BACKEND_URL = "http://localhost:8000";
const FRONTEND_URL = "http://localhost:5173";

// DOM Elements
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const errorBanner = document.getElementById("errorBanner");
const successBanner = document.getElementById("successBanner");

const formCard = document.getElementById("formCard");
const noFormDetected = document.getElementById("noFormDetected");
const formDetected = document.getElementById("formDetected");
const formTitle = document.getElementById("formTitle");
const formUrl = document.getElementById("formUrl");

const btnScrape = document.getElementById("btnScrape");
const scrapeSpinner = document.getElementById("scrapeSpinner");
const scrapeBtnText = document.getElementById("scrapeBtnText");

const btnFill = document.getElementById("btnFill");
const fillSpinner = document.getElementById("fillSpinner");
const fillBtnText = document.getElementById("fillBtnText");

const linkDashboard = document.getElementById("linkDashboard");

// Popup State
let sfToken = null;
let currentTab = null;
let activeApplication = null;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  if (currentTab && (currentTab.url.startsWith("http://") || currentTab.url.startsWith("https://"))) {
    // Show tab details
    noFormDetected.style.display = "none";
    formDetected.style.display = "block";
    formTitle.textContent = currentTab.title || "Untitled Page";
    formUrl.textContent = currentTab.url;

    // Check if it is a Google Form
    const isGoogleForm = currentTab.url.includes("docs.google.com/forms");
    if (isGoogleForm) {
      formTitle.textContent = currentTab.title.replace(" - Google Forms", "").replace(" | Google Forms", "") || "Google Form";
    }
  } else {
    // Unsupported tab (e.g. chrome:// tabs)
    noFormDetected.textContent = "Navigate to a web form or Google Form to begin.";
    btnScrape.disabled = true;
    btnFill.disabled = true;
  }

  // 2. Load and verify token from storage
  chrome.storage.local.get(["sf_token"], async (result) => {
    sfToken = result.sf_token;
    if (sfToken) {
      await verifyAuth(sfToken);
    } else {
      updateAuthStatus(false, "Not Logged In");
    }
  });

  // 3. Set up event listeners
  btnScrape.addEventListener("click", handleScrape);
  btnFill.addEventListener("click", handleFill);
  linkDashboard.addEventListener("click", () => {
    chrome.tabs.create({ url: FRONTEND_URL });
  });
});

// Verify token with backend
async function verifyAuth(token) {
  statusText.textContent = "Connecting...";
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const user = await res.json();
      updateAuthStatus(true, user.name);
    } else {
      // Invalid/Expired token
      chrome.storage.local.remove("sf_token");
      updateAuthStatus(false, "Session Expired");
    }
  } catch (error) {
    console.error("Auth verification failed:", error);
    updateAuthStatus(false, "Offline / Server Error");
  }
}

// Update authentication UI elements
function updateAuthStatus(isConnected, label) {
  if (isConnected) {
    statusDot.className = "status-dot connected";
    statusText.textContent = label;
    statusText.style.color = "var(--text-success)";
    
    // Enable scrape button if we are on a valid page
    if (currentTab && (currentTab.url.startsWith("http://") || currentTab.url.startsWith("https://"))) {
      btnScrape.disabled = false;
      btnFill.disabled = false; // Enable fill button so they can attempt to pull previous profiles
    }
  } else {
    statusDot.className = "status-dot disconnected";
    statusText.textContent = label;
    statusText.style.color = "var(--text-error)";
    btnScrape.disabled = true;
    btnFill.disabled = true;
    showError(`Please log in to scholarfill.ai at <a href="${FRONTEND_URL}" target="_blank" style="color: #818cf8; text-decoration: underline;">localhost:5173</a> first to synchronize credentials.`);
  }
}

// Scrape form HTML and map fields via AI backend
async function handleScrape() {
  hideMessages();
  setLoading(btnScrape, scrapeSpinner, scrapeBtnText, "Scraping & Mapping...", true);

  try {
    // 1. Request DOM HTML from content script
    const pageData = await getPageDomFromTab(currentTab.id);
    if (!pageData || !pageData.html) {
      throw new Error("Could not extract page contents. Make sure the page is fully loaded.");
    }

    // 2. Submit to scholarfill.ai backend for scraping and AI mapping
    const res = await fetch(`${BACKEND_URL}/api/forms/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sfToken}`
      },
      body: JSON.stringify({
        url: pageData.url,
        html: pageData.html
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to scrape and map form.");
    }

    activeApplication = data;
    showSuccess("Scraped & mapped successfully! Click 'Auto-Fill' to inject structured profile data.");
    btnFill.disabled = false;
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(btnScrape, scrapeSpinner, scrapeBtnText, "Scrape Page & Map AI", false);
  }
}

// Retrieve mapping data and fill the current tab inputs
async function handleFill() {
  hideMessages();
  setLoading(btnFill, fillSpinner, fillBtnText, "Filling Fields...", true);

  try {
    let application = activeApplication;

    // If we haven't scraped during this popup session, check if there's an existing application for this URL
    if (!application) {
      const res = await fetch(`${BACKEND_URL}/api/applications`, {
        headers: {
          "Authorization": `Bearer ${sfToken}`
        }
      });

      if (!res.ok) {
        throw new Error("Could not fetch application list from backend.");
      }

      const applications = await res.json();
      // Find latest application matching current tab URL (strip query params for loose comparison)
      const cleanTabUrl = currentTab.url.split('?')[0];
      application = applications.find(app => app.form_url.split('?')[0] === cleanTabUrl);

      if (!application) {
        throw new Error("No previous profile mapping found for this form URL. Please click 'Scrape Page & Map AI' first.");
      }
    }

    // Send fill message to content script
    const isGoogleForm = currentTab.url.includes("docs.google.com/forms");
    
    chrome.tabs.sendMessage(currentTab.id, {
      action: "FILL_FORM",
      fields: application.form_fields,
      data: application.filled_data,
      isGoogleForm: isGoogleForm
    }, (response) => {
      // Chrome Extension runtime error handler
      if (chrome.runtime.lastError) {
        showError("Communication error: Refresh the tab and try again.");
        setLoading(btnFill, fillSpinner, fillBtnText, "Auto-Fill Tab Fields", false);
        return;
      }

      if (response && response.success) {
        showSuccess("Form fields auto-filled successfully! Please review and submit the form.");
      } else {
        showError(response ? response.error : "Failed to fill form fields.");
      }
      setLoading(btnFill, fillSpinner, fillBtnText, "Auto-Fill Tab Fields", false);
    });

  } catch (error) {
    showError(error.message);
    setLoading(btnFill, fillSpinner, fillBtnText, "Auto-Fill Tab Fields", false);
  }
}

// Request page content from content script
function getPageDomFromTab(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { action: "GET_PAGE_DATA" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("chrome.runtime.lastError", chrome.runtime.lastError);
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

// UI Utility Functions
function setLoading(buttonEl, spinnerEl, textEl, textValue, isLoading) {
  buttonEl.disabled = isLoading;
  spinnerEl.style.display = isLoading ? "inline-block" : "none";
  textEl.textContent = textValue;
}

function showError(msg) {
  errorBanner.innerHTML = msg;
  errorBanner.style.display = "block";
  successBanner.style.display = "none";
}

function showSuccess(msg) {
  successBanner.textContent = msg;
  successBanner.style.display = "block";
  errorBanner.style.display = "none";
}

function hideMessages() {
  errorBanner.style.display = "none";
  successBanner.style.display = "none";
}
