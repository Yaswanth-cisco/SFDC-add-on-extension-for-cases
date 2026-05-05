document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("extract");
  const out = document.getElementById("output");

  btn.addEventListener("click", async () => {
    out.textContent = "Checking Salesforce page…";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.id || !tab.url?.includes("force.com")) {
      out.textContent = "Open a Salesforce Case page first.";
      return;
    }

    function send() {
      chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_CASE" }, res => {
        if (chrome.runtime.lastError) {
          out.textContent = "Injecting content script…";
          inject();
          return;
        }
        out.textContent = JSON.stringify(res, null, 2);
      });
    }

    function inject() {
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ["content.js"] },
        () => setTimeout(send, 500)
      );
    }

    send();
  });
});
