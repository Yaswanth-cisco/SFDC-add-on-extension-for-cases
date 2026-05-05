(() => {
  console.log("✅ SFDC Case Scraper – advanced extraction loaded");

  let latestCaseData = {};

  /* ---------------- Page Ready ---------------- */

  function waitForPageReady(timeout = 15000) {
    return new Promise(resolve => {
      const start = Date.now();
      (function check() {
        const spinner =
          document.querySelector("lightning-spinner, .slds-spinner");
        const content =
          document.querySelector(
            "records-record-layout, lightning-output-field, .slds-form-element"
          );

        if (!spinner && content) return resolve(true);
        if (Date.now() - start > timeout) return resolve(false);
        requestAnimationFrame(check);
      })();
    });
  }

  /* ---------------- Helpers ---------------- */

  function text(el) {
    return el?.innerText?.trim() || "";
  }

  function norm(t) {
    return (t || "").replace(/\s+/g, " ").trim();
  }

  /* ---------------- Strategy 1: lightning-output-field ---------------- */

  function extractFromLightningOutput() {
    const result = {};

    document.querySelectorAll("lightning-output-field").forEach(f => {
      const label =
        f.querySelector(".slds-form-element__label") ||
        f.querySelector(".test-id__field-label");

      const value =
        f.querySelector("lightning-formatted-text") ||
        f.querySelector(".slds-form-element__static");

      if (label && value) {
        result[norm(text(label))] = norm(text(value));
      }

      const api =
        f.getAttribute("field-name") ||
        f.getAttribute("data-field-api-name");

      if (api && value && !result[api]) {
        result[api] = norm(text(value));
      }
    });

    return result;
  }

  /* ---------------- Strategy 2: generic form elements ---------------- */

  function extractFromFormElements() {
    const result = {};

    document.querySelectorAll(".slds-form-element").forEach(el => {
      const label =
        el.querySelector(".slds-form-element__label") ||
        el.querySelector("label");

      const value =
        el.querySelector(
          ".slds-form-element__static," +
          "lightning-formatted-text," +
          "span"
        );

      if (label && value) {
        result[norm(text(label))] = norm(text(value));
      }
    });

    return result;
  }

  /* ---------------- Strategy 3: data-field-api-name ---------------- */

  function extractFromDataAttributes() {
    const result = {};

    document
      .querySelectorAll("[data-field-api-name]")
      .forEach(el => {
        const api = el.getAttribute("data-field-api-name");
        const value =
          el.querySelector("lightning-formatted-text") || el;

        if (api && value) {
          result[norm(api)] = norm(text(value));
        }
      });

    return result;
  }

  /* ---------------- Merge & Normalize ---------------- */

  function merge(...objs) {
    return objs.reduce((a, b) => Object.assign(a, b), {});
  }

  function buildCaseObject(fields) {
    return {
      caseNumber:
        fields["Case Number"] ||
        fields["CaseNumber"] ||
        null,
      subject: fields["Subject"] || null,
      status: fields["Status"] || null,
      priority: fields["Priority"] || null,
      origin: fields["Case Origin"] || null,
      owner:
        fields["Case Owner"] ||
        fields["Owner"] ||
        null,
      createdDate:
        fields["Created Date"] ||
        fields["Date/Time Opened"] ||
        null,
      lastModified:
        fields["Last Modified Date"] || null,
      url: window.location.href,
      platform: "Salesforce Lightning",
      rawFields: fields
    };
  }

  /* ---------------- Main scrape ---------------- */

  function scrapeCase() {
    const data = merge(
      extractFromLightningOutput(),
      extractFromFormElements(),
      extractFromDataAttributes()
    );

    latestCaseData = buildCaseObject(data);

    console.log("📘 SFDC Case extracted:", latestCaseData);
  }

  /* ---------------- Observe Lightning rerenders ---------------- */

  const observer = new MutationObserver(scrapeCase);

  (async () => {
    await waitForPageReady();
    observer.observe(document.body, {
      subtree: true,
      childList: true
    });
    scrapeCase();
  })();

  /* ---------------- Messaging ---------------- */

  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.action === "SCRAPE_CASE") {
      sendResponse(latestCaseData);
    }
  });
})();
