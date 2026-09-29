const MENU_TEXT = "fqn-add-selection";
const MENU_IMAGE = "fqn-add-image";
const STORAGE_KEY = "floatingQuickNoteV3";
const HISTORY_LIMIT = 50;

function createId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDefaultState() {
  const now = Date.now();
  const noteId = createId();
  return {
    meta: { lastWriter: "background" },
    activeNoteId: noteId,
    notes: [{
      id: noteId,
      title: "New note",
      html: "",
      createdAt: now,
      updatedAt: now,
      history: []
    }],
    settings: {
      language: "en",
      theme: "paper",
      shortcuts: {
        save: "Mod+S",
        search: "Mod+K",
        newNote: "Mod+Alt+N",
        copyNote: "Mod+Alt+C",
        history: "Mod+Alt+H",
        collapse: "Mod+Alt+M",
        nextNote: "Mod+Alt+ArrowDown",
        previousNote: "Mod+Alt+ArrowUp"
      }
    },
    ui: {
      hidden: false,
      collapsed: false,
      bubbleXRatio: 0.92,
      bubbleYRatio: 0.18,
      width: 420,
      height: 390,
      updatedAt: now
    }
  };
}

async function createMenus() {
  let language = "en";
  try {
    const state = await getState();
    language = state?.settings?.language === "vi" ? "vi" : "en";
  } catch {}
  const labels = language === "vi"
    ? { text: "Thêm văn bản đã chọn vào Floating Quick Note", image: "Thêm ảnh vào Floating Quick Note" }
    : { text: "Add selected text to Floating Quick Note", image: "Add image to Floating Quick Note" };
  chrome.contextMenus.removeAll(() => {
    void chrome.runtime.lastError;
    chrome.contextMenus.create({
      id: MENU_TEXT,
      title: labels.text,
      contexts: ["selection"]
    }, () => void chrome.runtime.lastError);
    chrome.contextMenus.create({
      id: MENU_IMAGE,
      title: labels.image,
      contexts: ["image"]
    }, () => void chrome.runtime.lastError);
  });
}

async function getState() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data?.[STORAGE_KEY] || null;
}

async function getOrCreateState() {
  let state = await getState();
  if (!state || !Array.isArray(state.notes) || !state.notes.length) {
    state = createDefaultState();
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  }
  return state;
}

async function setState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

function isInjectableUrl(url) {
  if (!url || typeof url !== "string") return false;
  return /^(https?|file):\/\//i.test(url) && !/^https?:\/\/chromewebstore\.google\.com\//i.test(url) && !/^https?:\/\/chrome\.google\.com\/webstore/i.test(url) && !/^https?:\/\/microsoftedge\.microsoft\.com\/addons/i.test(url);
}

async function injectContentScript(tabId) {
  if (!tabId) return false;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
      injectImmediately: true
    });
    return true;
  } catch {
    return false;
  }
}

async function sendMessage(tabId, message) {
  if (!tabId) return null;
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    return null;
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureContentScript(tabId) {
  if (!tabId) return false;
  const pong = await sendMessage(tabId, { type: "FQN_PING" });
  if (pong?.ok) return true;

  if (!await injectContentScript(tabId)) return false;

  for (let i = 0; i < 6; i++) {
    const retryPong = await sendMessage(tabId, { type: "FQN_PING" });
    if (retryPong?.ok) return true;
    await delay(40);
  }
  return false;
}

async function openStandalonePopup() {
  const standaloneUrl = chrome.runtime.getURL("standalone.html");
  try {
    const existingTabs = await chrome.tabs.query({ url: standaloneUrl });
    if (existingTabs.length > 0 && existingTabs[0].windowId) {
      await chrome.windows.update(existingTabs[0].windowId, { focused: true, drawAttention: true });
      if (existingTabs[0].id) {
        await sendMessage(existingTabs[0].id, { type: "FQN_SHOW_WINDOW" });
      }
      return;
    }
    await chrome.windows.create({
      url: standaloneUrl,
      type: "popup",
      width: 440,
      height: 440,
      focused: true
    });
  } catch (err) {
    console.warn("Floating Quick Note: unable to open the standalone window.", err);
  }
}

async function showWindowOnTab(tabId, tabUrl = "") {
  const canTryTab = tabId && (!tabUrl || isInjectableUrl(tabUrl));
  if (canTryTab) {
    const ready = await ensureContentScript(tabId);
    if (ready) {
      const res = await sendMessage(tabId, { type: "FQN_SHOW_WINDOW" });
      if (res?.ok) return;
    }
  }

  const state = await getOrCreateState();
  state.ui = state.ui || {};
  state.ui.hidden = false;
  state.ui.collapsed = false;
  state.ui.updatedAt = Date.now();
  state.meta = { ...(state.meta || {}), lastWriter: "background" };
  await setState(state);

  await openStandalonePopup();
}

async function showOnActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id) {
    await openStandalonePopup();
    return;
  }
  await showWindowOnTab(tab.id, tab.url || "");
}

chrome.runtime.onInstalled.addListener(() => {
  createMenus();
});

chrome.runtime.onStartup.addListener(() => {
  createMenus();
});

chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    showWindowOnTab(tab.id, tab.url || "");
  } else {
    showOnActiveTab();
  }
});

async function createNewNoteFromCommand() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id && (!tab.url || isInjectableUrl(tab.url))) {
    const ready = await ensureContentScript(tab.id);
    if (ready) {
      const res = await sendMessage(tab.id, { type: "FQN_NEW_NOTE" });
      if (res?.ok) return;
    }
  }

  const state = await getOrCreateState();
  const now = Date.now();
  const id = createId();
  const language = state.settings?.language === "vi" ? "vi" : "en";
  const title = language === "vi" ? `Ghi chú ${state.notes.length + 1}` : `Note ${state.notes.length + 1}`;
  state.notes.push({ id, title, html: "", createdAt: now, updatedAt: now, history: [] });
  state.activeNoteId = id;
  state.ui = { ...(state.ui || {}), hidden: false, collapsed: false, updatedAt: now };
  state.meta = { ...(state.meta || {}), lastWriter: "background" };
  await setState(state);
  if (tab?.id) {
    await showWindowOnTab(tab.id, tab.url || "");
  } else {
    await openStandalonePopup();
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-note") showOnActiveTab();
  if (command === "new-note") createNewNoteFromCommand();
});

const escapeHtml = (s) => String(s ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function guessImageMime(url, currentType) {
  if (currentType && currentType.startsWith("image/")) return currentType;
  const clean = String(url || "").split(/[?#]/)[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  if (clean.endsWith(".bmp")) return "image/bmp";
  if (clean.endsWith(".avif")) return "image/avif";
  if (clean.endsWith(".ico")) return "image/x-icon";
  return "";
}

async function imageUrlToDataUrl(url) {
  try {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("data:image/")) return url;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const mime = guessImageMime(url, blob.type);
    if (!mime || blob.size > 15 * 1024 * 1024) return url;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return `data:${mime};base64,${btoa(binary)}`;
  } catch {
    return url;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "FQN_SHOW_ACTIVE") {
    showOnActiveTab().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "FQN_NEW_NOTE_ACTIVE") {
    createNewNoteFromCommand().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "FQN_CLEAR_STORAGE") {
    (async () => {
      await chrome.storage.local.clear();
      const fresh = createDefaultState();
      await setState(fresh);
      await createMenus();
      sendResponse({ ok: true, state: fresh });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "FQN_REFRESH_CONTEXT_MENUS") {
    createMenus().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "FQN_FETCH_IMAGE" && message.url) {
    imageUrlToDataUrl(message.url)
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch(() => sendResponse({ ok: false, dataUrl: message.url }));
    return true;
  }

  if (message?.type === "FQN_GET_GLOBAL_SHORTCUTS") {
    chrome.commands.getAll()
      .then((commands) => sendResponse({
        ok: true,
        commands: Object.fromEntries(commands.map((command) => [command.name, command.shortcut || "Not set"]))
      }))
      .catch(() => sendResponse({ ok: false, commands: {} }));
    return true;
  }

  if (message?.type === "FQN_OPEN_BROWSER_SHORTCUTS") {
    const isEdge = /Edg\//.test(navigator.userAgent || "");
    const url = isEdge ? "edge://extensions/shortcuts" : "chrome://extensions/shortcuts";
    chrome.tabs.create({ url })
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false, url }));
    return true;
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const state = await getOrCreateState();
  const note = state.notes.find((n) => n.id === state.activeNoteId) || state.notes[0];
  const previousHtml = note.html || "";
  let addition = "";
  let source = "added from web page";

  if (info.menuItemId === MENU_TEXT && info.selectionText) {
    addition = `${escapeHtml(info.selectionText).replace(/\n/g, "<br>")}<br>`;
  } else if (info.menuItemId === MENU_IMAGE && info.srcUrl) {
    const resolvedImage = await imageUrlToDataUrl(info.srcUrl);
    addition = `<img src="${escapeHtml(resolvedImage)}" alt="Image from web page"><br>`;
    source = "image added from web page";
  } else {
    return;
  }

  note.history = Array.isArray(note.history) ? note.history : [];
  if (previousHtml) {
    note.history.push({
      id: createId(),
      timestamp: Date.now(),
      title: note.title || "Note",
      html: previousHtml,
      source: "before adding from web"
    });
    if (note.history.length > HISTORY_LIMIT) {
      note.history = note.history.slice(-HISTORY_LIMIT);
    }
  }

  note.html = previousHtml ? `${previousHtml}<br>${addition}` : addition;
  note.updatedAt = Date.now();
  state.activeNoteId = note.id;
  state.ui = state.ui || {};
  state.ui.hidden = false;
  state.ui.collapsed = false;
  state.ui.updatedAt = Date.now();
  state.lastExternalAction = { source, at: Date.now() };
  state.meta = { ...(state.meta || {}), lastWriter: "background" };
  await setState(state);

  if (tab?.id) {
    await showWindowOnTab(tab.id, tab.url || "");
  } else {
    await showOnActiveTab();
  }
});


chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  const change = changes[STORAGE_KEY];
  if (!change?.newValue) return;
  const before = change.oldValue?.settings?.language;
  const after = change.newValue?.settings?.language;
  if (before !== after) createMenus();
});
