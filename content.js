(() => {
  console.log("✅ SFDC Case Scraper – deduplicated output");

  let latestData = {};

  /**
   * Clean Salesforce field values:
   * - Remove "Open … Preview"
   * - Remove duplicated text
   */
  function cleanValue(text) {
    if (!text) return null;

    let cleaned = text
      .replace(/\n+/g, " ")
      .replace(/Open\s+/gi, "")
      .replace(/\s+Preview/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Deduplicate repeated halves
    const parts = cleaned.split(" ");
    const mid = Math.floor(parts.length / 2);
    if (
      parts.slice(0, mid).join(" ") ===
      parts.slice(mid).join(" ")
    ) {
      cleaned = parts.slice(0, mid).join(" ");
    }

    return cleaned;
  }

  function extractSelectedFields() {
    const fields = {};

    document
      .querySelectorAll("records-record-layout-item, .slds-form-element")
      .forEach(el => {
        const label = el.querySelector(".slds-form-element__label");
        const value = el.querySelector(
          ".slds-form-element__static," +
          ".test-id__field-value lightning-formatted-text," +
          "lightning-formatted-text"
        );

        const l = label?.innerText?.trim();
        const v = cleanValue(value?.innerText);

        if (l && v) {
          fields[l] = v;
        }
      });

    // ✅ ONLY required fields, deduplicated
    latestData = {
      accountName: fields["Account Name"] || null,
      priority: fields["Priority"] || null,
      deploymentType: fields["Deployment Type"] || null,
      entitlementName: fields["Entitlement Name"] || null,
      entitlementProcess: fields["Entitlement Process"] || null
    };

    console.log("📘 Clean Extracted Data:", latestData);
  }

  const observer = new MutationObserver(extractSelectedFields);

  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    extractSelectedFields();
  }, 800);

  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.action === "SCRAPE_CASE") {
      sendResponse(latestData);
    }
  });
})();