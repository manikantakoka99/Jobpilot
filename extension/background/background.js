// Minimal MV3 service worker. It holds no persistent state and does not
// listen for tab navigation, browsing history, or page content — all of
// that would require broader permissions than this extension requests.
// Its only job today is a friendly first-run log; all real work happens in
// the popup (user-initiated) and the on-demand injected content script.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[JobPilot] Extension installed. Open the popup to connect your account.");
  }
});
