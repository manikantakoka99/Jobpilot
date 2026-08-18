// Injected on demand into the active tab only (chrome.scripting.executeScript
// with `files: ["content/field-detector.js"]`), never declared as a static
// content_scripts entry in manifest.json — this file never runs unless the
// user opens the popup and clicks "Detect fields on this page" for the tab
// they're currently looking at. It never reads page content beyond form
// fields and nearby label text, never reports back anywhere except the
// popup that injected it, and never inserts a value or submits anything on
// its own — every write here is a direct result of the user picking a
// suggestion and clicking "Insert" in the popup.
(function () {
  if (window.__jobpilotFieldDetectorInstalled) return;
  window.__jobpilotFieldDetectorInstalled = true;

  const FIELD_PATTERNS = [
    { type: "email", keywords: ["email", "e-mail"] },
    { type: "phone", keywords: ["phone", "mobile", "telephone", "cell"] },
    { type: "firstName", keywords: ["first name", "firstname", "given name", "fname"] },
    { type: "lastName", keywords: ["last name", "lastname", "surname", "family name", "lname"] },
    { type: "linkedin", keywords: ["linkedin"] },
    { type: "github", keywords: ["github"] },
    { type: "portfolio", keywords: ["portfolio", "personal site", "personal website", "website"] },
    { type: "location", keywords: ["location", "city", "current location", "address"] },
    { type: "education", keywords: ["education", "university", "school name", "degree"] },
    { type: "fullName", keywords: ["full name", "your name"] },
  ];

  const FILE_PATTERNS = [
    { type: "resume", keywords: ["resume", "résumé", "cv"] },
    { type: "coverLetter", keywords: ["cover letter", "coverletter"] },
  ];

  function isVisible(el) {
    if (!el.isConnected) return false;
    const rects = el.getClientRects();
    if (rects.length === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  }

  function labelForElement(el) {
    const parts = [];
    if (el.labels && el.labels.length > 0) {
      el.labels.forEach((label) => parts.push(label.textContent || ""));
    }
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) parts.push(ariaLabel);
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      labelledBy.split(/\s+/).forEach((id) => {
        const node = document.getElementById(id);
        if (node) parts.push(node.textContent || "");
      });
    }
    if (el.placeholder) parts.push(el.placeholder);
    if (el.name) parts.push(el.name);
    if (el.id) parts.push(el.id);
    // Best-effort: a <label>/<span> immediately preceding the field in the DOM,
    // common in form builders that don't use `for`/`id` pairing.
    const prev = el.previousElementSibling;
    if (prev && /^(label|span|div|p)$/i.test(prev.tagName) && parts.length === 0) {
      parts.push(prev.textContent || "");
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  function matchesKeyword(signal, keyword) {
    return signal.includes(keyword);
  }

  function classify(el, signal) {
    if (el.tagName === "INPUT" && el.type === "file") {
      for (const pattern of FILE_PATTERNS) {
        if (pattern.keywords.some((kw) => matchesKeyword(signal, kw))) return pattern.type;
      }
      return null;
    }
    for (const pattern of FIELD_PATTERNS) {
      if (pattern.keywords.some((kw) => matchesKeyword(signal, kw))) return pattern.type;
    }
    return null;
  }

  const SKIP_INPUT_TYPES = new Set(["hidden", "submit", "button", "image", "reset", "checkbox", "radio"]);

  /** Returns detected fillable fields on the current page. Read-only. */
  function detectFields() {
    const candidates = Array.from(document.querySelectorAll("input, textarea, select")).filter((el) => {
      if (el instanceof HTMLInputElement && SKIP_INPUT_TYPES.has(el.type)) return false;
      return isVisible(el);
    });

    const results = [];
    candidates.forEach((el, idx) => {
      el.setAttribute("data-jobpilot-index", String(idx));
      const signal = labelForElement(el).toLowerCase();
      const type = classify(el, signal);
      if (!type) return;
      results.push({
        index: idx,
        type,
        label: labelForElement(el).slice(0, 120) || `${el.tagName.toLowerCase()}[${idx}]`,
        tag: el.tagName.toLowerCase(),
        inputType: el instanceof HTMLInputElement ? el.type : null,
      });
    });
    return results;
  }

  /** Inserts a single value into a field found by detectFields(), after the user reviewed/edited it. */
  function insertValue(index, value) {
    const el = document.querySelector(`[data-jobpilot-index="${index}"]`);
    if (!el) return false;

    if (el.tagName === "SELECT") {
      const select = el;
      const option = Array.from(select.options).find(
        (o) => o.value === value || o.textContent?.trim().toLowerCase() === value.trim().toLowerCase(),
      );
      if (!option) return false;
      select.value = option.value;
    } else {
      const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, value);
      else el.value = value;
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  const QUESTION_PATTERN = /\?\s*$|are you|do you|have you|years of experience|willing to|authorized to work|require sponsorship/i;

  /**
   * Best-effort detection of screening-question prompts near an answer
   * field (radio group, select, or textarea). Returns question text only —
   * answers are never inserted or submitted automatically; the popup shows
   * a suggestion with evidence for the user to review and enter themselves.
   */
  function detectQuestions() {
    const nodes = Array.from(document.querySelectorAll("label, legend, p, div, span")).filter(
      (el) => isVisible(el) && el.children.length === 0,
    );

    const seen = new Set();
    const results = [];
    nodes.forEach((el, idx) => {
      const text = (el.textContent || "").trim();
      if (text.length < 8 || text.length > 300) return;
      if (!QUESTION_PATTERN.test(text)) return;
      if (seen.has(text)) return;
      seen.add(text);
      el.setAttribute("data-jobpilot-qindex", String(idx));
      results.push({ index: idx, text });
    });
    return results.slice(0, 25);
  }

  window.__jobpilotDetectFields = detectFields;
  window.__jobpilotInsertValue = insertValue;
  window.__jobpilotDetectQuestions = detectQuestions;
})();
