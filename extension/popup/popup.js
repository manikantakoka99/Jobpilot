import {
  DEFAULT_API_BASE,
  PRODUCTION_API_BASE,
  getSettings,
  saveSettings,
  clearSettings,
  fetchMe,
  fetchApplications,
  fetchScreeningSuggestion,
  markApplied,
} from "../lib/api.js";

const FIELD_LABELS = {
  email: "Email",
  phone: "Phone",
  firstName: "First name",
  lastName: "Last name",
  fullName: "Full name",
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolio: "Portfolio",
  location: "Location",
  education: "Education",
  resume: "Resume upload",
  coverLetter: "Cover letter upload",
};

const app = document.getElementById("app");

const state = {
  settings: null,
  me: null,
  fields: [],
  questions: [],
  applications: [],
  selectedResumeVersionId: "",
  selectedApplicationId: "",
  confirmArmed: false,
  busy: false,
  error: null,
};

async function init() {
  state.settings = await getSettings();
  if (state.settings?.token) {
    await loadMe();
  }
  render();
}

async function loadMe() {
  try {
    state.me = await fetchMe();
    if (!state.selectedResumeVersionId && state.me.resumeVersions?.length) {
      state.selectedResumeVersionId = state.me.resumeVersions[0].id;
    }
  } catch (err) {
    state.error = err.message;
    state.me = null;
  }
}

function suggestedValueFor(type) {
  const p = state.me?.profile ?? {};
  switch (type) {
    case "email":
      return p.email ?? "";
    case "phone":
      return p.phone ?? "";
    case "firstName":
      return p.firstName ?? "";
    case "lastName":
      return p.lastName ?? "";
    case "fullName":
      return p.fullName ?? "";
    case "linkedin":
      return p.linkedinUrl ?? "";
    case "github":
      return p.githubUrl ?? "";
    case "portfolio":
      return p.portfolioUrl ?? "";
    case "location":
      return p.location ?? "";
    default:
      return "";
  }
}

/** Runs the on-demand detector in the active tab only — never a background/all-tabs injection. */
async function withActiveTab(fn) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab.");
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/field-detector.js"] });
  return fn(tab.id);
}

async function handleDetectFields() {
  state.busy = true;
  render();
  try {
    const [result] = await withActiveTab((tabId) =>
      chrome.scripting.executeScript({ target: { tabId }, func: () => window.__jobpilotDetectFields() }),
    );
    const detected = result?.result ?? [];
    state.fields = detected.map((f) => ({ ...f, value: suggestedValueFor(f.type), inserted: false }));
    state.error = null;
  } catch (err) {
    state.error = err.message;
  }
  state.busy = false;
  render();
}

async function handleInsertField(index) {
  const field = state.fields.find((f) => f.index === index);
  if (!field) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (i, v) => window.__jobpilotInsertValue(i, v),
      args: [index, field.value],
    });
    field.inserted = Boolean(result?.result);
  } catch (err) {
    state.error = err.message;
  }
  render();
}

async function handleDetectQuestions() {
  state.busy = true;
  render();
  try {
    const [result] = await withActiveTab((tabId) =>
      chrome.scripting.executeScript({ target: { tabId }, func: () => window.__jobpilotDetectQuestions() }),
    );
    const detected = result?.result ?? [];
    state.questions = detected.map((q) => ({ ...q, suggestion: null, loading: false }));
    state.error = null;
  } catch (err) {
    state.error = err.message;
  }
  state.busy = false;
  render();
}

async function handleSuggestAnswer(index) {
  const question = state.questions.find((q) => q.index === index);
  if (!question) return;
  question.loading = true;
  render();
  try {
    question.suggestion = await fetchScreeningSuggestion({
      question: question.text,
      resumeVersionId: state.selectedResumeVersionId || undefined,
    });
  } catch (err) {
    question.suggestion = { hasEvidence: false, suggestion: err.message };
  }
  question.loading = false;
  render();
}

async function handleLoadApplications() {
  state.busy = true;
  render();
  try {
    const result = await fetchApplications();
    state.applications = result.applications ?? [];
    state.error = null;
  } catch (err) {
    state.error = err.message;
  }
  state.busy = false;
  render();
}

async function handleConfirmSubmitted() {
  if (!state.confirmArmed) {
    state.confirmArmed = true;
    render();
    return;
  }
  if (!state.selectedApplicationId) return;
  state.busy = true;
  render();
  try {
    await markApplied(state.selectedApplicationId);
    state.confirmArmed = false;
    state.error = null;
    alertBanner("Marked as Applied in your JobPilot tracker.");
  } catch (err) {
    state.error = err.message;
  }
  state.busy = false;
  render();
}

function alertBanner(message) {
  state.banner = message;
  setTimeout(() => {
    state.banner = null;
    render();
  }, 3000);
}

async function handleConnect(e) {
  e.preventDefault();
  const form = e.target;
  const token = form.token.value.trim();
  const apiBase = form.apiBase.value.trim() || DEFAULT_API_BASE;
  if (!token) return;
  await saveSettings({ token, apiBase });
  state.settings = { token, apiBase };
  state.busy = true;
  render();
  await loadMe();
  state.busy = false;
  render();
}

async function handleDisconnect() {
  await clearSettings();
  Object.assign(state, {
    settings: null,
    me: null,
    fields: [],
    questions: [],
    applications: [],
    selectedApplicationId: "",
    error: null,
  });
  render();
}

function renderPairing() {
  return `
    <h1>JobPilot Apply Assistant</h1>
    <p class="hint">Connect your JobPilot account with an access token. Generate one from
    <strong>JobPilot → Settings → Extension</strong>, then paste it below.</p>
    ${state.error ? `<div class="alert danger">${escapeHtml(state.error)}</div>` : ""}
    <form id="connect-form">
      <label for="apiBase">JobPilot URL</label>
      <input type="url" id="apiBase" name="apiBase" list="api-base-options" placeholder="${DEFAULT_API_BASE}" value="${DEFAULT_API_BASE}" />
      <datalist id="api-base-options">
        <option value="${DEFAULT_API_BASE}">Local development</option>
        <option value="${PRODUCTION_API_BASE}">Production</option>
      </datalist>
      <label for="token">Access token</label>
      <input type="password" id="token" name="token" placeholder="jbpt_..." required />
      <button type="submit" ${state.busy ? "disabled" : ""}>Connect</button>
    </form>
  `;
}

function renderFieldRow(field) {
  if (field.type === "resume" || field.type === "coverLetter") {
    const doc = field.type === "resume" ? state.me?.resumes?.[0] : state.me?.coverLetters?.[0];
    return `
      <div class="field-row">
        <div class="meta"><span>${FIELD_LABELS[field.type]}</span><span>${field.tag}</span></div>
        <p class="small">${escapeHtml(field.label)}</p>
        <p class="small">Browsers don't allow extensions to attach files automatically — open
        Document Hub and attach <strong>${doc ? escapeHtml(doc.label) : "your document"}</strong> yourself.</p>
      </div>
    `;
  }
  return `
    <div class="field-row" data-field-index="${field.index}">
      <div class="meta"><span>${FIELD_LABELS[field.type] ?? field.type}</span><span>${escapeHtml(field.label)}</span></div>
      <input type="text" class="field-value" data-field-index="${field.index}" value="${escapeHtml(field.value)}" />
      <div class="actions">
        <button class="secondary insert-field" data-field-index="${field.index}">
          ${field.inserted ? "Inserted ✓" : "Insert"}
        </button>
      </div>
    </div>
  `;
}

function renderQuestionRow(question) {
  const s = question.suggestion;
  return `
    <div class="question-row">
      <div class="question">${escapeHtml(question.text)}</div>
      ${
        question.loading
          ? `<p class="small">Checking resume for evidence…</p>`
          : s
            ? `<p class="suggestion ${s.hasEvidence ? "evidence" : ""}">${escapeHtml(s.suggestion)}</p>`
            : `<button class="secondary suggest-answer" data-q-index="${question.index}">Suggest an answer</button>`
      }
      <p class="small">Review and type your own answer on the page — JobPilot never fills or submits answers automatically.</p>
    </div>
  `;
}

/** What this application was set up with in JobPilot — helps the user attach the right file, never attaches it for them. */
function renderSelectedDocuments() {
  const app = state.applications.find((a) => a.id === state.selectedApplicationId);
  if (!app) return "";
  return `
    <div class="field-row">
      <p class="small">Resume: <strong>${escapeHtml(app.selectedResume?.label || "Not set")}</strong></p>
      <p class="small">Version: <strong>${escapeHtml(app.selectedResumeVersion?.label || "Original resume")}</strong></p>
      <p class="small">Cover letter: <strong>${escapeHtml(app.selectedCoverLetter?.label || "Not set")}</strong></p>
    </div>
  `;
}

function renderConnected() {
  const me = state.me;
  return `
    ${state.banner ? `<div class="alert">${escapeHtml(state.banner)}</div>` : ""}
    ${state.error ? `<div class="alert danger">${escapeHtml(state.error)}</div>` : ""}
    <div class="row" style="justify-content: space-between;">
      <h1>JobPilot</h1>
      <button class="secondary" id="disconnect">Disconnect</button>
    </div>
    ${
      me
        ? `<p class="hint">Connected as ${escapeHtml(me.profile.fullName || me.profile.email)} · ${escapeHtml(state.settings.apiBase || DEFAULT_API_BASE)}</p>`
        : `<p class="hint">Could not load your profile. Check the token and JobPilot URL.</p>`
    }

    <div class="alert">JobPilot can help fill common application fields. Review everything before submitting.</div>

    <h2>Form fields</h2>
    <button id="detect-fields" ${state.busy ? "disabled" : ""}>Detect fields on this page</button>
    ${state.fields.length === 0 ? `<p class="empty">No fields detected yet.</p>` : state.fields.map(renderFieldRow).join("")}

    <h2>Screening questions</h2>
    <button id="detect-questions" ${state.busy ? "disabled" : ""}>Detect questions on this page</button>
    ${
      state.questions.length === 0
        ? `<p class="empty">No questions detected yet.</p>`
        : state.questions.map(renderQuestionRow).join("")
    }

    <h2>Mark as applied</h2>
    <p class="hint">Only marks your tracker — never submits anything. Use this after you've submitted the application yourself.</p>
    <button class="secondary" id="load-applications" ${state.busy ? "disabled" : ""}>Load my tracked applications</button>
    ${
      state.applications.length > 0
        ? `
      <select id="application-select">
        <option value="">Select an application…</option>
        ${state.applications
          .map(
            (a) =>
              `<option value="${a.id}" ${a.id === state.selectedApplicationId ? "selected" : ""}>${escapeHtml(a.jobTitle)} · ${escapeHtml(a.company)} (${a.status})</option>`,
          )
          .join("")}
      </select>
      ${renderSelectedDocuments()}
      <button id="confirm-submitted" ${state.busy || !state.selectedApplicationId ? "disabled" : ""}>
        ${state.confirmArmed ? "Click again to confirm" : "I submitted this application"}
      </button>
    `
        : ""
    }

    <footer class="small">JobPilot does not automate submission on any site and does not collect your browsing history.</footer>
  `;
}

function render() {
  app.innerHTML = state.settings?.token ? renderConnected() : renderPairing();
  attachHandlers();
}

function attachHandlers() {
  const connectForm = document.getElementById("connect-form");
  if (connectForm) connectForm.addEventListener("submit", handleConnect);

  const disconnect = document.getElementById("disconnect");
  if (disconnect) disconnect.addEventListener("click", handleDisconnect);

  const detectFields = document.getElementById("detect-fields");
  if (detectFields) detectFields.addEventListener("click", handleDetectFields);

  const detectQuestions = document.getElementById("detect-questions");
  if (detectQuestions) detectQuestions.addEventListener("click", handleDetectQuestions);

  const loadApplications = document.getElementById("load-applications");
  if (loadApplications) loadApplications.addEventListener("click", handleLoadApplications);

  const confirmSubmitted = document.getElementById("confirm-submitted");
  if (confirmSubmitted) confirmSubmitted.addEventListener("click", handleConfirmSubmitted);

  const applicationSelect = document.getElementById("application-select");
  if (applicationSelect) {
    applicationSelect.addEventListener("change", (e) => {
      state.selectedApplicationId = e.target.value;
      state.confirmArmed = false;
      render();
    });
  }

  document.querySelectorAll(".field-value").forEach((input) => {
    input.addEventListener("input", (e) => {
      const index = Number(e.target.dataset.fieldIndex);
      const field = state.fields.find((f) => f.index === index);
      if (field) field.value = e.target.value;
    });
  });

  document.querySelectorAll(".insert-field").forEach((btn) => {
    btn.addEventListener("click", (e) => handleInsertField(Number(e.target.dataset.fieldIndex)));
  });

  document.querySelectorAll(".suggest-answer").forEach((btn) => {
    btn.addEventListener("click", (e) => handleSuggestAnswer(Number(e.target.dataset.qIndex)));
  });
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

init();
