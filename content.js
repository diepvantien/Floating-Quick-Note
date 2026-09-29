((pageWindow, pageDocument) => {
  // Storage and the controller stay in the content script; UI DOM/event targets
  // switch to the child browsing context when the floating window is mounted.
  let window = pageWindow;
  let document = pageDocument;
  if (window.top !== window) return;

  if (pageWindow.__FQN_CONTROLLER__?.isAlive?.()) {
    pageWindow.__FQN_CONTROLLER__.ensureMounted();
    return;
  }

  // Clean up any orphaned DOM host left over from a previous extension reload
  document.querySelectorAll("#__floating_quick_note_host__").forEach((el) => el.remove());

  const IS_STANDALONE =
    document.documentElement?.hasAttribute("data-fqn-standalone") ||
    (location.protocol === "chrome-extension:" && location.pathname.endsWith("/standalone.html"));

  const STORAGE_KEY = "floatingQuickNoteV3";
  const OLD_KEY = "floatingQuickNoteV2";
  const HISTORY_LIMIT = 50;
  const INSTANCE_ID = `tab-${crypto.randomUUID?.() || Math.random().toString(16).slice(2)}`;
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const textToHtml = (text) => escapeHtml(text).replace(/\n/g, "<br>");

  const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");
  const SHORTCUT_DEFAULTS = Object.freeze({
    save: "Mod+S",
    search: "Mod+K",
    newNote: "Mod+Alt+N",
    copyNote: "Mod+Alt+C",
    history: "Mod+Alt+H",
    collapse: "Mod+Alt+M",
    nextNote: "Mod+Alt+ArrowDown",
    previousNote: "Mod+Alt+ArrowUp"
  });
  const SHORTCUT_LABELS = Object.freeze({
    save: "shortcutSave",
    search: "shortcutSearch",
    newNote: "newNote",
    copyNote: "copyEntireNote",
    history: "editHistory",
    collapse: "collapseBubble",
    nextNote: "nextNote",
    previousNote: "previousNote"
  });

  const THEME_DEFAULT = "paper";
  const LANGUAGE_DEFAULT = "en";
  const SUPPORTED_THEMES = new Set(["paper", "midnight", "ocean", "sakura", "forest", "graphite"]);
  const I18N = {
    en: {
      saved: "Saved", saving: "Saving…", note: "Note", newNote: "New note", noteN: "Note {n}",
      savedNotes: "Saved notes", editHistory: "Edit history", keyboardShortcuts: "Keyboard shortcuts",
      moreActions: "More actions", collapseBubble: "Collapse to bubble", hideAll: "Hide on all tabs",
      copyEntireNote: "Copy entire note", noteTitle: "Note title", openNote: "Open note", closeBubble: "Close bubble",
      placeholder: "Type a note, paste an image (Ctrl+V / Cmd+V), or drag an image here…",
      dropImage: "Drop image here to add it to the note", searchPlaceholder: "Search title or content…",
      delete: "Delete", back: "Back", zoomOut: "Zoom out image", zoomIn: "Zoom in image",
      fitImage: "Fit image to note", previewImage: "Open image preview", copyImage: "Copy this image",
      deleteImage: "Delete image", dragResize: "Drag to resize image", imagePreviewHelp: "Image preview · Scroll to zoom · Drag to pan",
      close: "Close", reset100: "Reset to 100%", noMatching: "No matching notes found.", noSaved: "No saved notes yet.",
      noteWithImage: "Note with image", emptyNote: "Empty note", edited: "Edited {time}", noHistory: "No edit history yet.",
      restoreVersion: "Restore this version", versionWithImage: "Version with image", emptyVersion: "Empty version",
      versionRestored: "Version restored", newNoteCreated: "New note created", noteCleared: "Note cleared", noteDeleted: "Note deleted",
      nextNote: "Next note", previousNote: "Previous note", imageFitted: "Image fitted to note", imageDeleted: "Image deleted",
      imageCopiedClipboard: "Image copied to clipboard", imageCopied: "Image copied", couldNotCopyImage: "Could not copy image",
      contentImagePasted: "Content and image pasted", pastedImages: "Pasted {n} images", imagePasted: "Image pasted",
      imagePastedLink: "Image pasted from link", textImagesCopied: "Text and images copied", noteCopied: "Note copied",
      couldNotCopy: "Could not copy", shortcutReset: "Shortcut reset", quickShortcutsReset: "Quick shortcuts reset",
      shortcutUpdated: "Shortcut updated", shortcutConflict: "Already used by {name}", shortcutModifier: "Use Ctrl/Cmd or Alt to avoid typing conflicts",
      browserShortcutHint: "Open your browser's extension shortcut settings", addedImage: "Image added to note", added: "Added to note",
      characters: "{n} characters", images: "{n} image", imagesPlural: "{n} images", noteCount: "{n} note", notesCount: "{n} notes",
      imageMeta: "Image {scale}% • Ctrl/Cmd+C copy • +/− resize • Enter preview", shortcutSave: "Save note", shortcutSearch: "Search notes",
      worksFocused: "Works while the note popup is focused.", browserWide: "Browser-wide shortcuts", browserCommand: "Browser command",
      changeBrowserShortcuts: "Change browser shortcuts", quickShortcuts: "Quick shortcuts", resetQuickShortcuts: "Reset quick shortcuts",
      imageContext: "Image context", copySelectedImage: "Copy selected image", resizeSelectedImage: "Resize selected image",
      fitSelectedImage: "Fit image", previewSelectedImage: "Preview image", deleteSelectedImage: "Delete image", pressKeys: "Press keys…",
      resetShortcut: "Reset shortcut", openHistory: "Open history"
    },
    vi: {
      saved: "Đã lưu", saving: "Đang lưu…", note: "Ghi chú", newNote: "Ghi chú mới", noteN: "Ghi chú {n}",
      savedNotes: "Ghi chú đã lưu", editHistory: "Lịch sử chỉnh sửa", keyboardShortcuts: "Phím tắt",
      moreActions: "Thêm thao tác", collapseBubble: "Thu gọn thành bong bóng", hideAll: "Ẩn trên tất cả tab",
      copyEntireNote: "Sao chép toàn bộ ghi chú", noteTitle: "Tên ghi chú", openNote: "Mở ghi chú", closeBubble: "Đóng bong bóng",
      placeholder: "Nhập ghi chú, dán ảnh (Ctrl+V / Cmd+V), hoặc kéo ảnh vào đây…",
      dropImage: "Thả ảnh vào đây để thêm vào ghi chú", searchPlaceholder: "Tìm theo tên hoặc nội dung…",
      delete: "Xóa", back: "Quay lại", zoomOut: "Thu nhỏ ảnh", zoomIn: "Phóng to ảnh",
      fitImage: "Vừa ảnh với ghi chú", previewImage: "Xem trước ảnh", copyImage: "Sao chép ảnh này",
      deleteImage: "Xóa ảnh", dragResize: "Kéo để đổi kích thước ảnh", imagePreviewHelp: "Xem ảnh · Cuộn để zoom · Kéo để di chuyển",
      close: "Đóng", reset100: "Đặt lại 100%", noMatching: "Không tìm thấy ghi chú phù hợp.", noSaved: "Chưa có ghi chú đã lưu.",
      noteWithImage: "Ghi chú có ảnh", emptyNote: "Ghi chú trống", edited: "Đã sửa {time}", noHistory: "Chưa có lịch sử chỉnh sửa.",
      restoreVersion: "Khôi phục phiên bản này", versionWithImage: "Phiên bản có ảnh", emptyVersion: "Phiên bản trống",
      versionRestored: "Đã khôi phục phiên bản", newNoteCreated: "Đã tạo ghi chú mới", noteCleared: "Đã làm trống ghi chú", noteDeleted: "Đã xóa ghi chú",
      nextNote: "Ghi chú tiếp theo", previousNote: "Ghi chú trước", imageFitted: "Đã căn ảnh vừa ghi chú", imageDeleted: "Đã xóa ảnh",
      imageCopiedClipboard: "Đã sao chép ảnh", imageCopied: "Đã sao chép ảnh", couldNotCopyImage: "Không thể sao chép ảnh",
      contentImagePasted: "Đã dán nội dung và ảnh", pastedImages: "Đã dán {n} ảnh", imagePasted: "Đã dán ảnh",
      imagePastedLink: "Đã dán ảnh từ liên kết", textImagesCopied: "Đã sao chép chữ và ảnh", noteCopied: "Đã sao chép ghi chú",
      couldNotCopy: "Không thể sao chép", shortcutReset: "Đã đặt lại phím tắt", quickShortcutsReset: "Đã đặt lại phím tắt nhanh",
      shortcutUpdated: "Đã cập nhật phím tắt", shortcutConflict: "Đã được dùng bởi {name}", shortcutModifier: "Hãy dùng Ctrl/Cmd hoặc Alt để tránh xung đột khi gõ",
      browserShortcutHint: "Mở phần phím tắt extension của trình duyệt", addedImage: "Đã thêm ảnh vào ghi chú", added: "Đã thêm vào ghi chú",
      characters: "{n} ký tự", images: "{n} ảnh", imagesPlural: "{n} ảnh", noteCount: "{n} ghi chú", notesCount: "{n} ghi chú",
      imageMeta: "Ảnh {scale}% • Ctrl/Cmd+C sao chép • +/− đổi cỡ • Enter xem trước", shortcutSave: "Lưu ghi chú", shortcutSearch: "Tìm ghi chú",
      worksFocused: "Hoạt động khi cửa sổ ghi chú đang được focus.", browserWide: "Phím tắt toàn trình duyệt", browserCommand: "Lệnh trình duyệt",
      changeBrowserShortcuts: "Đổi phím tắt trình duyệt", quickShortcuts: "Phím tắt nhanh", resetQuickShortcuts: "Đặt lại phím tắt nhanh",
      imageContext: "Khi chọn ảnh", copySelectedImage: "Sao chép ảnh đang chọn", resizeSelectedImage: "Đổi cỡ ảnh đang chọn",
      fitSelectedImage: "Vừa ảnh", previewSelectedImage: "Xem trước ảnh", deleteSelectedImage: "Xóa ảnh", pressKeys: "Nhấn tổ hợp…",
      resetShortcut: "Đặt lại phím tắt", openHistory: "Mở lịch sử"
    }
  };

  const icons = {
    note: `<svg viewBox="0 0 24 24"><path d="M7 3.75h7.7L19.25 8.3V20A1.25 1.25 0 0 1 18 21.25H7A2.25 2.25 0 0 1 4.75 19V6A2.25 2.25 0 0 1 7 3.75Z"/><path d="M14.5 3.9V8.5h4.6"/><path d="M8.25 12h7.5M8.25 15.5h7.5"/></svg>`,
    chatNote: `<svg viewBox="0 0 24 24"><path d="M6.5 5.25h11A2.25 2.25 0 0 1 19.75 7.5v7A2.25 2.25 0 0 1 17.5 16.75h-5.7l-4.3 2.65v-2.65h-1A2.25 2.25 0 0 1 4.25 14.5v-7A2.25 2.25 0 0 1 6.5 5.25Z"/><path d="M8.25 9.25h7.5M8.25 12.5h5"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><rect x="8" y="8" width="10.5" height="10.5" rx="2"/><path d="M15.5 8V6.5A2 2 0 0 0 13.5 4.5h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2H8"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="m5.5 12.5 4.25 4.25 8.75-9"/></svg>`,
    minus: `<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
    list: `<svg viewBox="0 0 24 24"><path d="M9 7h10M9 12h10M9 17h10"/><circle cx="5" cy="7" r=".8"/><circle cx="5" cy="12" r=".8"/><circle cx="5" cy="17" r=".8"/></svg>`,
    history: `<svg viewBox="0 0 24 24"><path d="M4.5 8.5V4.75M4.5 4.75h3.75"/><path d="M5.1 7.2A8 8 0 1 1 4.2 14"/><path d="M12 8v4.25l2.75 1.6"/></svg>`,
    trash: `<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4.75h6V7M7.25 7l.7 12.25h8.1L16.75 7M10 10.25v5.5M14 10.25v5.5"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="m14.5 6.5-5.5 5.5 5.5 5.5"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.75"/><path d="m15 15 4.25 4.25"/></svg>`,
    zoomIn: `<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.75"/><path d="M10.5 8v5M8 10.5h5M15 15l4.25 4.25"/></svg>`,
    fit: `<svg viewBox="0 0 24 24"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/></svg>`,
    keyboard: `<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M7 10h.01M10.5 10h.01M14 10h.01M17.5 10h.01M7 13.5h.01M10.5 13.5h.01M14 13.5h3.5M8 16h8"/></svg>`,
    external: `<svg viewBox="0 0 24 24"><path d="M11 5H7.25A2.25 2.25 0 0 0 5 7.25v9.5A2.25 2.25 0 0 0 7.25 19h9.5A2.25 2.25 0 0 0 19 16.75V13"/><path d="M14.25 5H19v4.75M18.75 5.25 11.5 12.5"/></svg>`,
    more: `<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>`,
    reset: `<svg viewBox="0 0 24 24"><path d="M5 8V4.5M5 4.5h3.5"/><path d="M5.6 6.8A7.8 7.8 0 1 1 4.4 14"/></svg>`,
    edit: `<svg viewBox="0 0 24 24"><path d="M4.5 19.5h4l10-10-4-4-10 10v4Z"/><path d="m12.8 7.2 4 4"/></svg>`
  };

  function isExtensionContextValid() {
    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }

  function makeNote(title = "New note", html = "") {
    const now = Date.now();
    return { id: uid(), title, html, createdAt: now, updatedAt: now, history: [] };
  }

  const first = makeNote();
  const DEFAULT_STATE = {
    meta: { lastWriter: "init" },
    activeNoteId: first.id,
    notes: [first],
    settings: { language: LANGUAGE_DEFAULT, theme: THEME_DEFAULT, shortcuts: { ...SHORTCUT_DEFAULTS } },
    ui: {
      hidden: false,
      collapsed: false,
      bubbleXRatio: 0.92,
      bubbleYRatio: 0.18,
      windowXRatio: null,
      windowYRatio: null,
      width: 420,
      height: 390,
      updatedAt: Date.now()
    }
  };

  let state = structuredClone(DEFAULT_STATE);
  let host, shadow, rootEl, noteEl, bubbleWrapEl, bubbleEl, bodyEl, editor, titleInput, statusEl, footer, notesPanel, historyPanel, shortcutsPanel, shortcutListEl, searchInput, savedCountEl, toastEl, moreMenuEl;
  let imgHudEl, imgScaleBtn, imgResizeHandle, lightboxEl, lightboxImg, lightboxScaleEl, copyImageBtn;
  let activeImg = null;
  let hoveredImg = null;
  let isResizingImg = false;
  let lightboxZoom = 1;
  let lightboxPanX = 0;
  let lightboxPanY = 0;
  let mounted = false;
  let saveTimer = null;
  let historyTimer = null;
  let lastSnapshotHtml = "";
  let applyingExternalState = false;
  let composingTarget = null;
  let compositionCommitTimer = null;
  let pendingExternalState = null;
  let editRevision = 0;
  const dirtyNoteFields = new Map();
  let recordingShortcutAction = null;
  let globalShortcutAssignments = {};
  let activePhysicsAnimations = [];
  let currentMorphDirection = null;
  let currentMorphPromise = null;
  let frameHost, frameEl, frameShadowEl, framePointerActive = false, frameClipRequest = null;

  function currentLanguage() {
    return state.settings?.language === "vi" ? "vi" : "en";
  }

  function tr(key, vars = {}) {
    const table = I18N[currentLanguage()] || I18N.en;
    let value = table[key] ?? I18N.en[key] ?? key;
    return String(value).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
  }

  function localizeHistorySource(source) {
    const map = currentLanguage() === "vi" ? {
      "auto save":"tự động lưu", "edit":"chỉnh sửa", "switch note":"đổi ghi chú", "before restore":"trước khi khôi phục",
      "create new note":"tạo ghi chú mới", "open history":"mở lịch sử", "switch note by shortcut":"đổi ghi chú bằng phím tắt",
      "resize image":"đổi kích thước ảnh", "fit image":"căn ảnh", "delete image":"xóa ảnh", "sync image":"đồng bộ ảnh",
      "paste text":"dán văn bản", "paste image":"dán ảnh", "paste content and image":"dán nội dung và ảnh", "add content":"thêm nội dung",
      "manual save":"lưu thủ công", "editor blur":"rời vùng soạn thảo", "added from web page":"thêm từ trang web",
      "image added from web page":"thêm ảnh từ trang web", "before adding from web":"trước khi thêm từ web"
    } : {};
    return map[source] || source;
  }

  function applyThemeAndLanguage() {
    if (!rootEl) return;
    const theme = SUPPORTED_THEMES.has(state.settings?.theme) ? state.settings.theme : THEME_DEFAULT;
    rootEl.dataset.theme = theme;
    rootEl.lang = currentLanguage();
    const setTitle = (selector, value) => {
      const el = shadow.querySelector(selector);
      if (el) { el.title = value; if (el.hasAttribute("aria-label")) el.setAttribute("aria-label", value); }
    };
    if (titleInput) { titleInput.title = tr("noteTitle"); titleInput.setAttribute("aria-label", tr("noteTitle")); }
    setTitle(".notes-btn", tr("savedNotes"));
    setTitle(".new-btn", tr("newNote"));
    setTitle(".history-btn", tr("editHistory"));
    setTitle(".content-copy-btn", tr("copyEntireNote"));
    setTitle(".more-btn", tr("moreActions"));
    setTitle(".collapse-btn", tr("collapseBubble"));
    setTitle(".close-btn", tr("hideAll"));
    setTitle(".bubble", tr("openNote"));
    setTitle(".bubble-close", tr("closeBubble"));
    if (editor) editor.dataset.placeholder = tr("placeholder");
    if (bodyEl) bodyEl.dataset.dropLabel = tr("dropImage");
    if (searchInput) searchInput.placeholder = tr("searchPlaceholder");
    if (statusEl && !String(statusEl.textContent || "").toLowerCase().includes("saving") && !String(statusEl.textContent || "").toLowerCase().includes("đang lưu")) statusEl.textContent = tr("saved");
    const notesTitle = shadow.querySelector(".notes-panel .panel-title"); if (notesTitle) notesTitle.textContent = tr("savedNotes");
    const historyTitle = shadow.querySelector(".history-panel .panel-title"); if (historyTitle) historyTitle.textContent = tr("editHistory");
    shadow.querySelectorAll(".panel-back").forEach((el) => { el.title = tr("back"); });
    setTitle(".hud-zoom-out", `${tr("zoomOut")} (−)`); setTitle(".hud-zoom-in", `${tr("zoomIn")} (+)`);
    setTitle(".hud-scale", tr("fitImage")); setTitle(".hud-preview", tr("previewImage")); setTitle(".hud-copy-img", tr("copyImage")); setTitle(".hud-delete", tr("deleteImage"));
    const deleteText = shadow.querySelector(".hud-delete span"); if (deleteText) deleteText.textContent = tr("delete");
    const resize = shadow.querySelector(".img-resize-handle"); if (resize) resize.title = tr("dragResize");
    const lightboxHelp = shadow.querySelector(".lightbox-head > span"); if (lightboxHelp) lightboxHelp.textContent = tr("imagePreviewHelp");
    setTitle(".lb-zoom-out", tr("zoomOut")); setTitle(".lb-zoom-in", tr("zoomIn")); setTitle(".lb-scale", tr("reset100")); setTitle(".lb-delete", tr("deleteImage")); setTitle(".lb-close", tr("close"));
    const mh = shadow.querySelector(".more-history span"); if (mh) mh.textContent = tr("editHistory");
    updateMeta();
    if (notesPanel?.classList.contains("visible")) renderNotesPanel(searchInput?.value || "");
    if (historyPanel?.classList.contains("visible")) renderHistoryPanel();
  }

  const css = `
    :host{all:initial}*,*::before,*::after{box-sizing:border-box}
    .root{--bg:rgba(255,255,255,.985);--panel:#fffdf7;--panel2:#faf9f5;--header:rgba(250,250,248,.96);--text:#202124;--muted:#777770;--line:rgba(0,0,0,.09);--hover:rgba(0,0,0,.055);--accent:#f3b93c;--accent-soft:rgba(243,185,60,.18);--bubble-a:#ffd76a;--bubble-b:#f1b333;--bubble-text:#30220a;--brand-text:#33250b;--card-hover:#fffdf3;--icon:#5f6266;--placeholder:#aaa79f;--window-shadow:0 20px 70px rgba(0,0,0,.22),0 4px 16px rgba(0,0,0,.08);position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text);font-size:14px;line-height:1.45}
    .root[data-theme="paper"]{--bg:rgba(255,255,255,.985);--panel:#fffdf7;--panel2:#faf9f5;--header:rgba(250,250,248,.96);--text:#202124;--muted:#777770;--line:rgba(0,0,0,.09);--hover:rgba(0,0,0,.055);--accent:#f3b93c;--accent-soft:rgba(243,185,60,.18);--bubble-a:#ffd76a;--bubble-b:#f1b333;--bubble-text:#30220a;--brand-text:#33250b;--card-hover:#fffdf3;--icon:#5f6266;--placeholder:#aaa79f;--window-shadow:0 20px 70px rgba(0,0,0,.22),0 4px 16px rgba(0,0,0,.08)}
    .root[data-theme="midnight"]{--bg:rgba(24,27,34,.985);--panel:#1d2129;--panel2:#171a21;--header:rgba(29,33,42,.97);--text:#f2f5fb;--muted:#98a2b3;--line:rgba(255,255,255,.10);--hover:rgba(255,255,255,.075);--accent:#8b9dff;--accent-soft:rgba(139,157,255,.18);--bubble-a:#9aa8ff;--bubble-b:#697cff;--bubble-text:#11162d;--brand-text:#11162d;--card-hover:#242a35;--icon:#aeb7c6;--placeholder:#6f7b8d;--window-shadow:0 22px 72px rgba(0,0,0,.48),0 4px 18px rgba(0,0,0,.26)}
    .root[data-theme="ocean"]{--bg:rgba(244,251,255,.988);--panel:#f2faff;--panel2:#eaf6fc;--header:rgba(238,248,253,.97);--text:#123146;--muted:#668294;--line:rgba(21,94,126,.13);--hover:rgba(34,139,181,.08);--accent:#35a9d6;--accent-soft:rgba(53,169,214,.16);--bubble-a:#71d8f3;--bubble-b:#2ba2d1;--bubble-text:#073145;--brand-text:#073145;--card-hover:#eaf8fe;--icon:#54788c;--placeholder:#8ba5b3;--window-shadow:0 20px 66px rgba(27,98,126,.18),0 4px 14px rgba(21,94,126,.08)}
    .root[data-theme="sakura"]{--bg:rgba(255,249,251,.99);--panel:#fff7fa;--panel2:#fdf0f5;--header:rgba(255,246,249,.97);--text:#4b2835;--muted:#9a7180;--line:rgba(129,55,82,.12);--hover:rgba(208,88,130,.08);--accent:#e985aa;--accent-soft:rgba(233,133,170,.18);--bubble-a:#ffc3d7;--bubble-b:#eb80aa;--bubble-text:#4c1d30;--brand-text:#4c1d30;--card-hover:#fff0f5;--icon:#8f6978;--placeholder:#b69ba5;--window-shadow:0 20px 66px rgba(131,63,88,.16),0 4px 14px rgba(129,55,82,.07)}
    .root[data-theme="forest"]{--bg:rgba(246,250,246,.99);--panel:#f3f8f2;--panel2:#eaf2e8;--header:rgba(241,247,239,.97);--text:#24372a;--muted:#718277;--line:rgba(53,96,65,.13);--hover:rgba(76,132,90,.09);--accent:#6da57a;--accent-soft:rgba(109,165,122,.18);--bubble-a:#9fd3a8;--bubble-b:#629d70;--bubble-text:#17301d;--brand-text:#17301d;--card-hover:#eaf5e9;--icon:#637b69;--placeholder:#91a196;--window-shadow:0 20px 66px rgba(53,96,65,.16),0 4px 14px rgba(53,96,65,.07)}
    .root[data-theme="graphite"]{--bg:rgba(38,38,40,.99);--panel:#2a2a2d;--panel2:#232326;--header:rgba(43,43,46,.98);--text:#f3f3f4;--muted:#a7a7ad;--line:rgba(255,255,255,.10);--hover:rgba(255,255,255,.075);--accent:#d0d0d6;--accent-soft:rgba(208,208,214,.15);--bubble-a:#dadbe0;--bubble-b:#aeb0b8;--bubble-text:#252529;--brand-text:#252529;--card-hover:#333337;--icon:#b5b5bc;--placeholder:#77777f;--window-shadow:0 22px 72px rgba(0,0,0,.5),0 4px 18px rgba(0,0,0,.3)}
    .window,.bubble-wrap{pointer-events:none}
    .window{position:fixed;width:420px;height:390px;min-width:310px;min-height:230px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);display:flex;flex-direction:column;overflow:hidden;resize:both;border:1px solid var(--line);border-radius:18px;background:var(--bg);box-shadow:var(--window-shadow);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);opacity:0;visibility:hidden;transform:translate3d(0,6px,0) scale(.98);transform-origin:center center;transition:opacity 120ms ease-out,transform 165ms cubic-bezier(.22,1,.36,1),visibility 0s linear 165ms;will-change:transform,opacity;backface-visibility:hidden}
    .window.visible{opacity:1;visibility:visible;pointer-events:auto;transform:translate3d(0,0,0) scale(1);transition-delay:0s}.window.physics-animating,.window.physics-animating *{transition:none!important;pointer-events:none!important}
    .window.standalone{inset:0!important;width:100vw!important;height:100vh!important;max-width:100vw!important;max-height:100vh!important;border-radius:0!important;border:0!important;resize:none!important;box-shadow:none!important}
    .header{height:50px;min-height:50px;display:flex;align-items:center;gap:8px;padding:0 9px 0 13px;border-bottom:1px solid var(--line);background:var(--header);user-select:none;cursor:grab;touch-action:none}
    .header:active{cursor:grabbing}
    .brand{display:flex;align-items:center;gap:9px;min-width:0;flex:1;overflow:hidden}
    .brand-mark{width:28px;height:28px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;color:var(--brand-text);background:linear-gradient(145deg,var(--bubble-a),var(--bubble-b));box-shadow:inset 0 1px rgba(255,255,255,.7),0 3px 10px rgba(190,130,20,.20)}
    .brand-mark svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
    .title-input{width:100%;min-width:0;text-overflow:ellipsis;border:0;outline:0;background:transparent;color:var(--text);font:650 14px/1.2 inherit;letter-spacing:-.01em;padding:5px 3px;border-radius:7px}
    .title-input:focus{background:var(--hover)}
    .actions{display:flex;align-items:center;gap:3px;flex:0 0 auto}
    .icon-btn{appearance:none;border:0;outline:0;width:32px;height:32px;border-radius:10px;display:inline-grid;place-items:center;color:var(--icon);background:transparent;cursor:pointer;padding:0}
    .icon-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .icon-btn svg circle{fill:currentColor;stroke:none}
    .icon-btn:hover{background:var(--hover);color:var(--text)}
    .icon-btn:active{transform:translateY(1px)}
    .more-menu-wrap{position:relative;display:none;flex:0 0 auto}
    .more-menu{position:absolute;top:37px;right:0;width:180px;padding:5px;border:1px solid var(--line);border-radius:12px;background:var(--bg);box-shadow:0 14px 36px rgba(0,0,0,.18);opacity:0;visibility:hidden;transform:translateY(-4px) scale(.98);transform-origin:top right;transition:opacity 110ms ease,transform 150ms cubic-bezier(.2,.8,.2,1),visibility 0s linear 150ms;z-index:40}
    .more-menu.open{opacity:1;visibility:visible;transform:translateY(0) scale(1);transition-delay:0s}
    .menu-item{width:100%;height:34px;border:0;border-radius:8px;background:transparent;color:var(--text);display:flex;align-items:center;gap:9px;padding:0 9px;font:600 12px/1 inherit;cursor:pointer;text-align:left}
    .menu-item:hover{background:var(--hover)}
    .menu-item svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
    .window.header-compact .action-overflow{display:none}
    .window.header-compact .more-menu-wrap{display:block}
    .window.header-tight .header{gap:5px;padding-left:9px;padding-right:7px}
    .window.header-tight .brand{gap:6px}
    .window.header-tight .brand-mark{width:26px;height:26px;border-radius:8px}
    .window.header-tight .title-input{font-size:13px}
    .window.header-tight .icon-btn{width:29px;height:29px;border-radius:9px}
    .window.header-ultra .brand-mark{width:24px;height:24px}
    .window.header-ultra .brand{gap:4px}
    .body{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;padding:4px 2px 2px 0;background:var(--panel);overflow:hidden}
    .content-copy-btn{position:absolute;top:10px;right:var(--copy-right,14px);z-index:10;width:28px;height:28px;border:1px solid transparent;border-radius:8.5px;background:color-mix(in srgb,var(--panel) 78%,transparent);color:var(--muted);display:grid;place-items:center;cursor:pointer;opacity:.26;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:opacity 130ms ease,transform 130ms cubic-bezier(.22,1,.36,1),background 140ms ease,border-color 140ms ease,color 140ms ease,box-shadow 140ms ease,right 120ms ease}
    .body:hover .content-copy-btn{opacity:.58;border-color:color-mix(in srgb,var(--line) 65%,transparent)}
    .content-copy-btn:hover,.content-copy-btn:focus-visible{opacity:1!important;transform:translateY(-1px);background:color-mix(in srgb,var(--bg) 95%,transparent);border-color:var(--line);color:var(--text);box-shadow:0 3px 10px rgba(0,0,0,.08)}
    .content-copy-btn:active{transform:translateY(0) scale(.94)}
    .content-copy-btn.copied{opacity:1!important;color:#239b56;border-color:rgba(35,155,86,.35);background:color-mix(in srgb,var(--bg) 90%,#239b56 10%)}
    .content-copy-btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .body.drag-over::after{content:attr(data-drop-label);position:absolute;inset:8px;border:2px dashed var(--accent);border-radius:12px;background:var(--accent-soft);color:var(--text);font-weight:650;font-size:13px;display:grid;place-items:center;pointer-events:none;z-index:12}
    .editor{width:100%;height:100%;flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable;border:0;outline:0;padding:10px 46px 10px 15px;background:transparent;color:var(--text);caret-color:var(--text);font:14px/1.58 ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;white-space:pre-wrap;word-break:break-word}
    .editor::-webkit-scrollbar,.panel-content::-webkit-scrollbar{width:8px;height:8px}
    .editor::-webkit-scrollbar-track,.panel-content::-webkit-scrollbar-track{background:transparent;margin:6px 0}
    .editor::-webkit-scrollbar-thumb,.panel-content::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--muted) 22%,transparent);border-radius:999px;border:2px solid transparent;background-clip:padding-box}
    .editor:hover::-webkit-scrollbar-thumb,.panel-content:hover::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--muted) 38%,transparent);border:2px solid transparent;background-clip:padding-box}
    .editor::-webkit-scrollbar-thumb:hover,.panel-content::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb,var(--muted) 56%,transparent);border:2px solid transparent;background-clip:padding-box}
    .editor:empty::before{content:attr(data-placeholder);color:var(--placeholder);pointer-events:none}
    .editor img{display:block;max-width:100%;height:auto;margin:10px 0;border-radius:12px;border:1.5px solid var(--line);background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer;user-select:none;-webkit-user-drag:none;transition:border-color 140ms ease,box-shadow 160ms ease,filter 160ms ease}
    .editor img[data-custom-width]{max-width:none;max-height:none}
    .editor img:hover{border-color:var(--accent);box-shadow:0 5px 18px rgba(0,0,0,.10)}
    .editor img.fqn-img-selected{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft),0 7px 24px rgba(0,0,0,.14)}
    .editor img.fqn-img-enter{animation:fqnImageIn 260ms cubic-bezier(.2,.8,.2,1) both}
    .editor img.fqn-img-copying{animation:fqnCopyPulse 420ms ease}
    @keyframes fqnImageIn{from{opacity:0;filter:blur(2px);transform:translateY(7px) scale(.985)}to{opacity:1;filter:blur(0);transform:translateY(0) scale(1)}}
    @keyframes fqnCopyPulse{0%{box-shadow:0 0 0 0 rgba(46,160,90,.45)}55%{box-shadow:0 0 0 6px rgba(46,160,90,.20),0 7px 24px rgba(0,0,0,.14)}100%{box-shadow:0 0 0 0 rgba(46,160,90,0),0 7px 24px rgba(0,0,0,.14)}}
    .img-hud{position:absolute;display:block;pointer-events:none;z-index:8;border-radius:12px;border:1.5px solid var(--accent);box-shadow:0 0 0 2px var(--accent-soft);opacity:0;visibility:hidden;transform:scale(.995);transition:opacity 110ms ease,transform 140ms ease,visibility 0s linear 140ms}
    .img-hud.visible{opacity:1;visibility:visible;transform:scale(1);transition-delay:0s}
    .img-hud-bar{position:absolute;top:6px;left:6px;right:6px;display:flex;align-items:center;justify-content:space-between;gap:4px;pointer-events:none}
    .img-hud-group{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:9px;background:rgba(24,24,24,.84);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 4px 12px rgba(0,0,0,.22);pointer-events:auto}
    .hud-btn{appearance:none;border:0;outline:0;min-width:24px;height:24px;padding:0 6px;border-radius:6px;background:transparent;color:#f5f5f5;font:650 12px/1 inherit;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;user-select:none}
    .hud-btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .hud-btn:hover{background:rgba(255,255,255,.16);color:#fff}
    .hud-btn.success{background:rgba(46,160,90,.92);color:#fff}
    .hud-btn.danger{background:rgba(220,53,69,.92);color:#fff;padding:0 7px;gap:4px}
    .hud-btn.danger:hover{background:#e02f42}
    .hud-scale{font-size:11px;min-width:42px;color:#ffd86e}
    .img-resize-handle{position:absolute;right:-5px;bottom:-5px;width:20px;height:20px;border-radius:6px;background:var(--accent);border:2px solid var(--bg);box-shadow:0 2px 8px rgba(0,0,0,.28);cursor:nwse-resize;pointer-events:auto;display:grid;place-items:center;touch-action:none}
    .img-resize-handle::after{content:"";width:6px;height:6px;border-right:2px solid #33250b;border-bottom:2px solid #33250b}
    .img-resize-handle:hover{transform:scale(1.12);background:#ffc94d}
    .lightbox{position:absolute;inset:0;z-index:25;display:flex;flex-direction:column;background:rgba(18,18,18,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);user-select:none;opacity:0;visibility:hidden;pointer-events:none;transition:opacity 150ms ease,visibility 0s linear 150ms}
    .lightbox.visible{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
    .lightbox-head{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-bottom:1px solid rgba(255,255,255,.1);color:#fff;font-size:12px}
    .lightbox-actions{display:flex;align-items:center;gap:4px}
    .lightbox-viewport{flex:1;min-height:0;overflow:hidden;display:grid;place-items:center;cursor:grab;position:relative}
    .lightbox-viewport:active{cursor:grabbing}
    .lightbox-viewport img{max-width:92%;max-height:92%;object-fit:contain;border-radius:10px;transform-origin:center center;transition:transform 95ms cubic-bezier(.2,.8,.2,1),opacity 140ms ease;user-select:none;-webkit-user-drag:none;box-shadow:0 14px 42px rgba(0,0,0,.48)}
    .footer{min-height:30px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 12px 7px;background:var(--panel);color:var(--muted);font-size:11px;user-select:none}
    .panel{position:absolute;inset:50px 0 0;display:flex;flex-direction:column;background:var(--bg);z-index:15;opacity:0;visibility:hidden;pointer-events:none;transform:translateX(12px);transition:opacity 120ms ease,transform 170ms cubic-bezier(.2,.8,.2,1),visibility 0s linear 170ms}
    .panel.visible{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(0);transition-delay:0s}
    .panel-head{min-height:50px;display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--line)}
    .panel-title{flex:1;font-weight:700;letter-spacing:-.01em}
    .count{font-size:11px;color:var(--muted);font-weight:600}
    .search-wrap{display:flex;align-items:center;gap:7px;margin:8px 10px 0;padding:0 10px;height:36px;border:1px solid var(--line);border-radius:11px;background:var(--panel2)}
    .search-wrap svg{width:16px;height:16px;fill:none;stroke:var(--muted);stroke-width:1.8;stroke-linecap:round}
    .search{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--text);font:13px inherit}
    .panel-content{flex:1;min-height:0;overflow:auto;padding:10px;background:var(--panel2)}
    .note-card,.history-card{width:100%;display:block;border:1px solid var(--line);border-radius:13px;padding:10px 11px;margin:0 0 8px;background:var(--bg);color:var(--text);text-align:left;cursor:pointer}
    .note-card:hover,.history-card:hover{background:var(--card-hover)}
    .note-card.active{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}
    .card-row{display:flex;align-items:center;gap:8px}
    .card-title{flex:1;min-width:0;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .card-preview{margin-top:4px;color:var(--muted);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .card-time{margin-top:5px;color:#99968e;font-size:10px}
    .mini-delete{width:27px;height:27px;border:0;border-radius:8px;display:grid;place-items:center;background:transparent;color:#888;cursor:pointer;flex:0 0 auto}
    .mini-delete:hover{background:rgba(190,50,50,.08);color:#c94c4c}
    .mini-delete svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
    .restore{margin-top:7px;display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border:0;border-radius:8px;background:var(--accent-soft);color:var(--text);font:650 11px/1 inherit;cursor:pointer}
    .restore svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    .shortcut-list{display:grid;gap:8px}
    .shortcut-section{font-size:11px;font-weight:750;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:8px 2px 2px}
    .shortcut-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border:1px solid var(--line);border-radius:11px;background:var(--bg)}
    .shortcut-label{min-width:0;color:var(--text);font-size:12px;flex:1}
    .shortcut-actions{display:flex;align-items:center;gap:5px;flex:0 0 auto}
    .shortcut-edit{min-width:92px;height:30px;padding:0 8px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--text);font:650 10px/1 inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px}
    .shortcut-edit:hover{background:var(--hover)}
    .shortcut-edit.recording{border-color:rgba(243,185,60,.9);box-shadow:0 0 0 3px rgba(243,185,60,.15);color:#8a5a00}
    .shortcut-reset{width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--muted);display:grid;place-items:center;cursor:pointer}
    .shortcut-reset:hover{background:var(--hover);color:var(--text)}
    .shortcut-reset svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .shortcut-keys{display:flex;align-items:center;gap:4px;flex:0 0 auto}
    .shortcut-note{font-size:10px;color:var(--muted);line-height:1.35;margin-top:3px}
    .shortcut-global-actions{display:flex;gap:6px;margin:6px 0 4px}
    .shortcut-primary{height:32px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--text);padding:0 10px;font:650 11px/1 inherit;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
    .shortcut-primary:hover{background:var(--hover)}
    .shortcut-primary svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    kbd{min-width:24px;height:23px;padding:0 6px;display:inline-grid;place-items:center;border:1px solid var(--line);border-bottom-width:2px;border-radius:6px;background:var(--panel2);color:var(--text);font:650 10px/1 inherit;box-shadow:0 1px 0 rgba(0,0,0,.04)}
    .empty{padding:30px 18px;color:var(--muted);text-align:center;font-size:12px}
    .bubble-wrap{position:fixed;width:56px;height:56px;opacity:0;visibility:hidden;transform:translate3d(0,0,0) scale(.9);transform-origin:center center;transition:opacity 110ms ease-out,transform 150ms cubic-bezier(.22,1,.36,1),visibility 0s linear 150ms;will-change:transform,opacity;backface-visibility:hidden}
    .bubble-wrap.visible{opacity:1;visibility:visible;transform:translate3d(0,0,0) scale(1);transition-delay:0s}
    .bubble-wrap.visible .bubble,.bubble-wrap.visible .bubble-close{pointer-events:auto}
    .bubble-wrap.physics-animating,.bubble-wrap.physics-animating *{transition:none!important;pointer-events:none!important}
    .bubble-wrap.physics-animating .bubble{transform:none!important}
    .bubble{position:absolute;inset:0;width:56px;height:56px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--bubble-text) 18%,transparent);border-radius:50%;background:radial-gradient(circle at 31% 24%,rgba(255,255,255,.52),transparent 28%),linear-gradient(145deg,var(--bubble-a),var(--bubble-b));color:var(--bubble-text);box-shadow:0 11px 28px rgba(0,0,0,.19),inset 0 1px rgba(255,255,255,.72),inset 0 -1px color-mix(in srgb,var(--bubble-text) 10%,transparent);cursor:grab;user-select:none;touch-action:none;transition:transform 130ms ease,box-shadow 130ms ease,filter 130ms ease}
    .bubble:hover{transform:scale(1.045);filter:saturate(1.04);box-shadow:0 14px 32px rgba(0,0,0,.22),inset 0 1px rgba(255,255,255,.8),inset 0 -1px color-mix(in srgb,var(--bubble-text) 10%,transparent)}
    .bubble.dragging{cursor:grabbing;transform:scale(1.025)}
    .bubble-glyph{width:36px;height:36px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,white 25%,transparent);border:1px solid color-mix(in srgb,white 28%,transparent);box-shadow:inset 0 1px rgba(255,255,255,.26);transition:transform 130ms ease,background 130ms ease}
    .bubble:hover .bubble-glyph{transform:translateY(-.5px);background:color-mix(in srgb,white 31%,transparent)}
    .bubble-glyph svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.72;stroke-linecap:round;stroke-linejoin:round}
    .bubble-close{position:absolute;right:-5px;top:-5px;width:20px;height:20px;border:1px solid color-mix(in srgb,var(--text) 13%,transparent);border-radius:50%;display:block;padding:0;background:color-mix(in srgb,var(--bg) 92%,var(--accent) 8%);color:var(--text);box-shadow:0 4px 12px rgba(0,0,0,.16),inset 0 1px rgba(255,255,255,.42);cursor:pointer;opacity:.88;transform:scale(.94);transition:transform 115ms ease,opacity 115ms ease,background 115ms ease}
    .bubble-close::before,.bubble-close::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:1.6px;border-radius:2px;background:currentColor;transform-origin:center}
    .bubble-close::before{transform:translate(-50%,-50%) rotate(45deg)}
    .bubble-close::after{transform:translate(-50%,-50%) rotate(-45deg)}
    .bubble-close:hover{transform:scale(1.06);opacity:1;background:var(--bg)}
    .bubble-close:active{transform:scale(.96)}
    .toast{position:absolute;left:50%;bottom:37px;transform:translateX(-50%) translateY(7px);padding:7px 11px;border-radius:999px;background:rgba(26,26,26,.94);color:#fff;font-size:12px;font-weight:650;pointer-events:none;opacity:0;transition:opacity 140ms ease,transform 140ms ease;white-space:nowrap;z-index:30}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    @media(prefers-reduced-motion:reduce){
      .window,.bubble-wrap,.bubble,.panel,.lightbox,.img-hud,.lightbox-viewport img,.editor img,.more-menu{transition:none!important;animation:none!important}
    }
  `;

  function normalizeShortcutKey(key) {
    if (!key) return "";
    const aliases = {
      " ": "Space", Spacebar: "Space", "/": "Slash", "=": "Equal", "+": "Equal", "-": "Minus",
      Esc: "Escape", Up: "ArrowUp", Down: "ArrowDown", Left: "ArrowLeft", Right: "ArrowRight"
    };
    const normalized = aliases[key] || key;
    return normalized.length === 1 ? normalized.toUpperCase() : normalized;
  }

  function eventToShortcutSpec(e) {
    if (isComposingEvent(e)) return "";
    const key = normalizeShortcutKey(e.key);
    if (["Control", "Meta", "Alt", "Shift"].includes(key) || !key) return "";
    const parts = [];
    if (IS_MAC ? e.metaKey : e.ctrlKey) parts.push("Mod");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    parts.push(key);
    return parts.join("+");
  }

  function shortcutMatches(e, spec) {
    if (!spec || isComposingEvent(e) || e.getModifierState?.("AltGraph")) return false;
    const parts = String(spec).split("+").filter(Boolean);
    const wantsMod = parts.includes("Mod");
    const wantsAlt = parts.includes("Alt");
    const wantsShift = parts.includes("Shift");
    // Ignore legacy/invalid single-key bindings: printable keys belong to typing.
    if (!wantsMod && !wantsAlt) return false;
    const key = parts.find((part) => !["Mod", "Alt", "Shift"].includes(part));
    if (!key) return false;
    const modPressed = IS_MAC ? e.metaKey : e.ctrlKey;
    const otherPrimary = IS_MAC ? e.ctrlKey : e.metaKey;
    return modPressed === wantsMod && !otherPrimary && e.altKey === wantsAlt && e.shiftKey === wantsShift && normalizeShortcutKey(e.key) === key;
  }

  function shortcutParts(spec) {
    return String(spec || "").split("+").filter(Boolean).map((part) => {
      if (part === "Mod") return IS_MAC ? "Cmd" : "Ctrl";
      if (part === "ArrowUp") return "↑";
      if (part === "ArrowDown") return "↓";
      if (part === "ArrowLeft") return "←";
      if (part === "ArrowRight") return "→";
      if (part === "Slash") return "/";
      if (part === "Equal") return "+";
      if (part === "Minus") return "−";
      return part;
    });
  }

  function shortcutHtml(spec) {
    return shortcutParts(spec).map((part) => `<kbd>${escapeHtml(part)}</kbd>`).join("");
  }

  function currentShortcut(action) {
    return state.settings?.shortcuts?.[action] || SHORTCUT_DEFAULTS[action] || "";
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  }

  function normalizeUrl(src) {
    try {
      const u = new URL(src, location.href);
      return ["http:", "https:", "data:", "blob:"].includes(u.protocol) ? u.href : "";
    } catch {
      return "";
    }
  }

  function cleanEditorHtml(rawHtml) {
    if (!rawHtml) return "";
    const temp = document.createElement("div");
    temp.innerHTML = String(rawHtml);
    temp.querySelectorAll("img").forEach((img) => {
      img.classList.remove("fqn-img-selected", "fqn-img-enter", "fqn-img-copying");
      if (!img.className.trim()) img.removeAttribute("class");
      img.removeAttribute("data-fqn-temp");
    });
    return temp.innerHTML;
  }

  function plainTextFromHtml(html) {
    const el = document.createElement("div");
    el.innerHTML = html || "";
    return (el.innerText || el.textContent || "").trim();
  }

  function previewFromHtml(html, max = 100) {
    const t = plainTextFromHtml(html).replace(/\s+/g, " ");
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
  }

  function activeNote() {
    let n = state.notes.find((x) => x.id === state.activeNoteId);
    if (!n) {
      n = state.notes[0] || makeNote();
      if (!state.notes.length) state.notes.push(n);
      state.activeNoteId = n.id;
    }
    return n;
  }

  function normalizeRatio(val, fallback) {
    const num = Number(val);
    return Number.isFinite(num) ? Math.min(1, Math.max(0, num)) : fallback;
  }

  function migrateLegacyGeneratedTitle(title, fallback = "Note") {
    const value = typeof title === "string" ? title : fallback;
    if (value === "Ghi ch\u00fa m\u1edbi") return "New note";
    if (value === "Ghi ch\u00fa") return "Note";
    const match = value.match(/^Ghi ch\u00fa\s+(\d+)$/);
    return match ? `Note ${match[1]}` : value;
  }

  function migrateLegacyHistorySource(source) {
    const value = typeof source === "string" ? source : "edit";
    const map = {
      "t\u1ef1 \u0111\u1ed9ng": "auto save",
      "ch\u1ec9nh s\u1eeda": "edit",
      "\u0111\u1ed5i ghi ch\u00fa": "switch note",
      "tr\u01b0\u1edbc khi kh\u00f4i ph\u1ee5c": "before restore",
      "t\u1ea1o ghi ch\u00fa m\u1edbi": "create new note",
      "m\u1edf l\u1ecbch s\u1eed": "open history",
      "\u0111\u1ed5i ghi ch\u00fa b\u1eb1ng ph\u00edm t\u1eaft": "switch note by shortcut",
      "thu ph\u00f3ng \u1ea3nh": "resize image",
      "\u0111\u1eb7t l\u1ea1i k\u00edch th\u01b0\u1edbc \u1ea3nh": "fit image",
      "xo\u00e1 \u1ea3nh": "delete image",
      "\u0111\u1ed3ng b\u1ed9 \u1ea3nh": "sync image",
      "d\u00e1n v\u0103n b\u1ea3n": "paste text",
      "d\u00e1n \u1ea3nh": "paste image",
      "d\u00e1n n\u1ed9i dung v\u00e0 \u1ea3nh": "paste content and image",
      "th\u00eam n\u1ed9i dung": "add content",
      "l\u01b0u th\u1ee7 c\u00f4ng": "manual save",
      "r\u1eddi v\u00f9ng so\u1ea1n th\u1ea3o": "editor blur",
      "th\u00eam t\u1eeb trang web": "added from web page",
      "th\u00eam \u1ea3nh t\u1eeb trang web": "image added from web page",
      "tr\u01b0\u1edbc khi th\u00eam t\u1eeb web": "before adding from web"
    };
    return map[value] || value;
  }

  function normalizeState(s) {
    const out = s && Array.isArray(s.notes) ? s : structuredClone(DEFAULT_STATE);
    out.notes = (out.notes || []).map((n) => ({
      id: n.id || uid(),
      title: migrateLegacyGeneratedTitle(n.title, "Note"),
      html: typeof n.html === "string" ? cleanEditorHtml(n.html) : textToHtml(n.text || ""),
      createdAt: Number(n.createdAt) || Date.now(),
      updatedAt: Number(n.updatedAt) || Date.now(),
      history: Array.isArray(n.history)
        ? n.history
            .map((h) => ({
              id: h.id || uid(),
              timestamp: Number(h.timestamp) || Date.now(),
              title: migrateLegacyGeneratedTitle(h.title || n.title, "Note"),
              html: typeof h.html === "string" ? cleanEditorHtml(h.html) : textToHtml(h.text || ""),
              source: migrateLegacyHistorySource(h.source)
            }))
            .slice(-HISTORY_LIMIT)
        : []
    }));
    if (!out.notes.length) out.notes = [makeNote()];
    if (!out.notes.some((n) => n.id === out.activeNoteId)) out.activeNoteId = out.notes[0].id;
    out.meta = { lastWriter: "init", ...(out.meta || {}) };
    const settings = out.settings || {};
    out.settings = {
      ...settings,
      language: settings.language === "vi" ? "vi" : LANGUAGE_DEFAULT,
      theme: SUPPORTED_THEMES.has(settings.theme) ? settings.theme : THEME_DEFAULT,
      shortcuts: { ...SHORTCUT_DEFAULTS, ...(settings.shortcuts || {}) }
    };
    const ui = out.ui || {};
    out.ui = {
      hidden: Boolean(ui.hidden),
      collapsed: Boolean(ui.collapsed),
      bubbleXRatio: normalizeRatio(ui.bubbleXRatio, 0.92),
      bubbleYRatio: normalizeRatio(ui.bubbleYRatio, 0.18),
      windowXRatio: ui.windowXRatio != null && Number.isFinite(Number(ui.windowXRatio)) ? normalizeRatio(ui.windowXRatio, null) : null,
      windowYRatio: ui.windowYRatio != null && Number.isFinite(Number(ui.windowYRatio)) ? normalizeRatio(ui.windowYRatio, null) : null,
      width: Math.max(310, Number(ui.width) || 420),
      height: Math.max(230, Number(ui.height) || 390),
      updatedAt: Number(ui.updatedAt) || Date.now()
    };
    if (s?.lastExternalAction) {
      out.lastExternalAction = s.lastExternalAction;
    }
    return out;
  }

  async function loadState() {
    if (!isExtensionContextValid()) return;
    const data = await chrome.storage.local.get([STORAGE_KEY, OLD_KEY]);
    if (data?.[STORAGE_KEY]) {
      state = normalizeState(data[STORAGE_KEY]);
      return;
    }
    if (data?.[OLD_KEY]) {
      const old = data[OLD_KEY];
      state = normalizeState({
        activeNoteId: old.activeNoteId,
        notes: (old.notes || []).map((n) => ({
          ...n,
          html: textToHtml(n.text || ""),
          history: (n.history || []).map((h) => ({ ...h, html: textToHtml(h.text || "") }))
        })),
        ui: {
          hidden: false,
          collapsed: old.ui?.collapsed ?? true,
          bubbleXRatio: old.ui?.bubbleX != null ? old.ui.bubbleX / Math.max(1, innerWidth) : 0.92,
          bubbleYRatio: old.ui?.bubbleY != null ? old.ui.bubbleY / Math.max(1, innerHeight) : 0.18,
          width: old.ui?.width || 420,
          height: old.ui?.height || 390
        }
      });
      await chrome.storage.local.set({ [STORAGE_KEY]: state });
      return;
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  }

  function persist(immediate = false) {
    if (applyingExternalState || !isExtensionContextValid()) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    if (composingTarget) return;
    state.meta = { ...(state.meta || {}), lastWriter: INSTANCE_ID };
    const save = () => {
      saveTimer = null;
      if (!isExtensionContextValid()) return;
      if (composingTarget) return;
      const revision = editRevision;
      chrome.storage.local.set({ [STORAGE_KEY]: state }).then(() => {
        if (revision === editRevision && !isEditingNote()) dirtyNoteFields.clear();
        setStatus(tr("saved"));
      }).catch(() => {});
    };
    if (immediate) save();
    else saveTimer = setTimeout(save, 180);
  }

  function formatTime(ts) {
    try {
      return new Intl.DateTimeFormat(currentLanguage() === "vi" ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleString();
    }
  }

  function setStatus(t) {
    if (statusEl) statusEl.textContent = t;
  }

  function showToast(t) {
    if (!toastEl) return;
    toastEl.textContent = t;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), 1400);
  }

  function refreshEditor() {
    if (!editor || !titleInput || composingTarget) return;
    const n = activeNote();
    const cleaned = cleanEditorHtml(n.html || "");
    if (cleanEditorHtml(editor.innerHTML) !== cleaned) {
      editor.innerHTML = cleaned;
      clearSelectedImage();
    }
    if (shadow?.activeElement !== titleInput) {
      titleInput.value = n.title || tr("note");
    }
    lastSnapshotHtml = n.history.at(-1)?.html ?? cleaned;
    updateMeta();
    updateImageHud();
  }

  function updateCopyButtonOffset() {
    if (!bodyEl || !editor) return;
    const sbWidth = Math.max(0, editor.offsetWidth - editor.clientWidth);
    const hasScroll = editor.scrollHeight > editor.clientHeight + 1;
    const rightPx = sbWidth > 0 ? sbWidth + 8 : hasScroll ? 16 : 12;
    bodyEl.style.setProperty("--copy-right", `${rightPx}px`);
  }

  function updateMeta() {
    if (!footer) return;
    const metaEl = footer.querySelector(".meta");
    if (activeImg && editor?.contains(activeImg)) {
      metaEl.textContent = tr("imageMeta", { scale: getImageScalePercent(activeImg) });
    } else {
      const n = activeNote();
      const text = plainTextFromHtml(n.html);
      const images = editor?.querySelectorAll("img").length || 0;
      const imageText = images ? ` • ${tr(images === 1 ? "images" : "imagesPlural", { n: images })}` : "";
      metaEl.textContent = `${tr("characters", { n: text.length })}${imageText}`;
    }
    if (savedCountEl) savedCountEl.textContent = tr(state.notes.length === 1 ? "noteCount" : "notesCount", { n: state.notes.length });
    updateCopyButtonOffset();
  }

  function snapshot(source = "auto save") {
    if (composingTarget) return;
    const n = activeNote();
    const currentHtml = cleanEditorHtml(n.html || "");
    if (currentHtml === lastSnapshotHtml) return;
    n.history.push({
      id: uid(),
      timestamp: Date.now(),
      title: n.title,
      html: currentHtml,
      source
    });
    if (n.history.length > HISTORY_LIMIT) n.history = n.history.slice(-HISTORY_LIMIT);
    lastSnapshotHtml = currentHtml;
    persist(false);
  }

  function scheduleHistory(source = "auto save") {
    clearTimeout(historyTimer);
    historyTimer = setTimeout(() => snapshot(source), 1500);
  }

  function renderNotesPanel(query = "") {
    const wrap = notesPanel.querySelector(".panel-content");
    wrap.innerHTML = "";
    savedCountEl.textContent = tr(state.notes.length === 1 ? "noteCount" : "notesCount", { n: state.notes.length });
    const q = query.trim().toLocaleLowerCase(currentLanguage() === "vi" ? "vi" : "en");
    const filtered = [...state.notes]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter(
        (n) =>
          !q ||
          n.title.toLocaleLowerCase(currentLanguage() === "vi" ? "vi" : "en").includes(q) ||
          plainTextFromHtml(n.html).toLocaleLowerCase(currentLanguage() === "vi" ? "vi" : "en").includes(q)
      );
    if (!filtered.length) {
      wrap.innerHTML = `<div class="empty">${q ? tr("noMatching") : tr("noSaved")}</div>`;
      return;
    }
    for (const n of filtered) {
      const card = document.createElement("div");
      card.className = "note-card" + (n.id === state.activeNoteId ? " active" : "");
      card.dataset.noteId = n.id;
      card.tabIndex = 0;
      card.innerHTML = `<div class="card-row"><div class="card-title"></div><button class="mini-delete" title="${escapeHtml(tr("delete"))}">${icons.trash}</button></div><div class="card-preview"></div><div class="card-time"></div>`;
      card.querySelector(".card-title").textContent = n.title || tr("note");
      card.querySelector(".card-preview").textContent =
        previewFromHtml(n.html) || (n.html.includes("<img") ? tr("noteWithImage") : tr("emptyNote"));
      card.querySelector(".card-time").textContent = tr("edited", { time: formatTime(n.updatedAt) });
      card.addEventListener("click", (e) => {
        if (e.target.closest(".mini-delete")) return;
        if (composingTarget) finishComposition();
        snapshot("switch note");
        state.activeNoteId = n.id;
        refreshEditor();
        closePanels();
        persist(true);
        editor.focus();
      });
      card.querySelector(".mini-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNote(n.id);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); card.click(); }
        if (e.key === "ArrowDown") { e.preventDefault(); card.nextElementSibling?.focus?.(); }
        if (e.key === "ArrowUp") { e.preventDefault(); (card.previousElementSibling || searchInput)?.focus?.(); }
      });
      wrap.appendChild(card);
    }
  }

  function renderHistoryPanel() {
    const n = activeNote();
    const wrap = historyPanel.querySelector(".panel-content");
    wrap.innerHTML = "";
    if (!n.history.length) {
      wrap.innerHTML = `<div class="empty">${tr("noHistory")}</div>`;
      return;
    }
    [...n.history].reverse().forEach((h) => {
      const card = document.createElement("div");
      card.className = "history-card";
      card.innerHTML = `<div class="card-title"></div><div class="card-preview"></div><div class="card-time"></div><button class="restore">${icons.history}<span>${escapeHtml(tr("restoreVersion"))}</span></button>`;
      card.querySelector(".card-title").textContent = h.title || n.title || tr("note");
      card.querySelector(".card-preview").textContent =
        previewFromHtml(h.html, 115) || (h.html?.includes("<img") ? tr("versionWithImage") : tr("emptyVersion"));
      card.querySelector(".card-time").textContent = `${formatTime(h.timestamp)} • ${localizeHistorySource(h.source)}`;
      card.querySelector(".restore").addEventListener("click", () => restoreHistory(h));
      wrap.appendChild(card);
    });
  }

  function restoreHistory(h) {
    if (composingTarget) finishComposition();
    const n = activeNote();
    if (n.html !== h.html) {
      n.history.push({
        id: uid(),
        timestamp: Date.now(),
        title: n.title,
        html: cleanEditorHtml(n.html),
        source: "before restore"
      });
    }
    n.html = cleanEditorHtml(h.html);
    n.title = h.title || n.title;
    n.updatedAt = Date.now();
    if (n.history.length > HISTORY_LIMIT) n.history = n.history.slice(-HISTORY_LIMIT);
    refreshEditor();
    renderHistoryPanel();
    persist(true);
    showToast(tr("versionRestored"));
  }

  function createNote() {
    if (composingTarget) finishComposition();
    snapshot("create new note");
    const n = makeNote(tr("noteN", { n: state.notes.length + 1 }));
    state.notes.push(n);
    state.activeNoteId = n.id;
    refreshEditor();
    closePanels();
    persist(true);
    editor.focus();
    showToast(tr("newNoteCreated"));
  }

  function deleteNote(id) {
    if (composingTarget) finishComposition();
    if (state.notes.length === 1) {
      const n = state.notes[0];
      n.title = tr("newNote");
      n.html = "";
      n.history = [];
      n.updatedAt = Date.now();
      refreshEditor();
      renderNotesPanel(searchInput.value);
      persist(true);
      showToast(tr("noteCleared"));
      return;
    }
    const idx = state.notes.findIndex((n) => n.id === id);
    if (idx < 0) return;
    state.notes.splice(idx, 1);
    if (state.activeNoteId === id) {
      state.activeNoteId = state.notes[Math.max(0, idx - 1)]?.id || state.notes[0].id;
    }
    refreshEditor();
    renderNotesPanel(searchInput.value);
    persist(true);
    showToast(tr("noteDeleted"));
  }

  async function refreshGlobalShortcutAssignments() {
    if (!isExtensionContextValid()) return;
    try {
      const response = await chrome.runtime.sendMessage({ type: "FQN_GET_GLOBAL_SHORTCUTS" });
      if (response?.ok) globalShortcutAssignments = response.commands || {};
    } catch {}
  }

  function cancelShortcutRecording() {
    recordingShortcutAction = null;
    renderShortcutsPanel();
  }

  function renderShortcutsPanel() {
    if (!shortcutListEl) return;
    const globalOpen = globalShortcutAssignments["toggle-note"] || "Alt+Shift+N";
    const globalNew = globalShortcutAssignments["new-note"] || "Alt+Shift+M";
    const rows = Object.keys(SHORTCUT_DEFAULTS).map((action) => {
      const recording = recordingShortcutAction === action;
      const spec = currentShortcut(action);
      return `<div class="shortcut-row" data-shortcut-row="${action}">
        <div class="shortcut-label"><strong>${escapeHtml(tr(SHORTCUT_LABELS[action]))}</strong><div class="shortcut-note">${escapeHtml(tr("worksFocused"))}</div></div>
        <div class="shortcut-actions">
          <button class="shortcut-edit${recording ? " recording" : ""}" type="button" data-record-shortcut="${action}">${recording ? escapeHtml(tr("pressKeys")) : shortcutHtml(spec)}</button>
          <button class="shortcut-reset" type="button" data-reset-shortcut="${action}" title="${escapeHtml(tr("resetShortcut"))}">${icons.reset}</button>
        </div>
      </div>`;
    }).join("");

    shortcutListEl.innerHTML = `
      <div class="shortcut-section">${escapeHtml(tr("browserWide"))}</div>
      <div class="shortcut-row"><div class="shortcut-label"><strong>${escapeHtml(tr("openNote"))}</strong><div class="shortcut-note">${escapeHtml(tr("browserCommand"))}</div></div><span class="shortcut-keys">${shortcutHtml(globalOpen.replace(/Command|MacCtrl|Ctrl/g, "Mod").replace(/\s/g, ""))}</span></div>
      <div class="shortcut-row"><div class="shortcut-label"><strong>${escapeHtml(tr("newNote"))}</strong><div class="shortcut-note">${escapeHtml(tr("browserCommand"))}</div></div><span class="shortcut-keys">${shortcutHtml(globalNew.replace(/Command|MacCtrl|Ctrl/g, "Mod").replace(/\s/g, ""))}</span></div>
      <div class="shortcut-global-actions"><button class="shortcut-primary open-browser-shortcuts" type="button">${icons.external}<span>${escapeHtml(tr("changeBrowserShortcuts"))}</span></button></div>
      <div class="shortcut-section">${escapeHtml(tr("quickShortcuts"))}</div>
      ${rows}
      <div class="shortcut-global-actions"><button class="shortcut-primary reset-all-shortcuts" type="button">${icons.reset}<span>${escapeHtml(tr("resetQuickShortcuts"))}</span></button></div>
      <div class="shortcut-section">${escapeHtml(tr("imageContext"))}</div>
      <div class="shortcut-row"><span class="shortcut-label">${escapeHtml(tr("copySelectedImage"))}</span><span class="shortcut-keys"><kbd>${IS_MAC ? "Cmd" : "Ctrl"}</kbd><kbd>C</kbd></span></div>
      <div class="shortcut-row"><span class="shortcut-label">${escapeHtml(tr("resizeSelectedImage"))}</span><span class="shortcut-keys"><kbd>+</kbd><kbd>−</kbd></span></div>
      <div class="shortcut-row"><span class="shortcut-label">${escapeHtml(tr("fitSelectedImage"))}</span><span class="shortcut-keys"><kbd>0</kbd></span></div>
      <div class="shortcut-row"><span class="shortcut-label">${escapeHtml(tr("previewSelectedImage"))}</span><span class="shortcut-keys"><kbd>Enter</kbd></span></div>
      <div class="shortcut-row"><span class="shortcut-label">${escapeHtml(tr("deleteSelectedImage"))}</span><span class="shortcut-keys"><kbd>Delete</kbd></span></div>`;
  }

  function beginShortcutRecording(action) {
    if (!SHORTCUT_DEFAULTS[action]) return;
    recordingShortcutAction = action;
    renderShortcutsPanel();
    shortcutsPanel?.querySelector(`[data-record-shortcut="${action}"]`)?.focus();
  }

  function assignRecordedShortcut(action, spec) {
    if (!action || !spec) return;
    const parts = spec.split("+");
    if (!parts.includes("Mod") && !parts.includes("Alt")) {
      showToast(tr("shortcutModifier"));
      return;
    }
    const conflict = Object.keys(SHORTCUT_DEFAULTS).find((key) => key !== action && currentShortcut(key) === spec);
    if (conflict) {
      showToast(tr("shortcutConflict", { name: tr(SHORTCUT_LABELS[conflict]) }));
      return;
    }
    state.settings = state.settings || {};
    state.settings.shortcuts = { ...SHORTCUT_DEFAULTS, ...(state.settings.shortcuts || {}), [action]: spec };
    recordingShortcutAction = null;
    persist(true);
    renderShortcutsPanel();
    showToast(tr("shortcutUpdated"));
  }

  async function openBrowserShortcutSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: "FQN_OPEN_BROWSER_SHORTCUTS" });
      if (!response?.ok) showToast(tr("browserShortcutHint"));
    } catch {
      showToast(tr("browserShortcutHint"));
    }
  }

  function openNotesPanel() {
    clearSelectedImage();
    searchInput.value = "";
    renderNotesPanel("");
    notesPanel.classList.add("visible");
    historyPanel.classList.remove("visible");
    shortcutsPanel?.classList.remove("visible");
    setTimeout(() => searchInput.focus(), 0);
  }

  function openHistoryPanel() {
    clearSelectedImage();
    snapshot("open history");
    renderHistoryPanel();
    historyPanel.classList.add("visible");
    notesPanel.classList.remove("visible");
    shortcutsPanel?.classList.remove("visible");
  }

  function openShortcutsPanel() {
    clearSelectedImage();
    notesPanel.classList.remove("visible");
    historyPanel.classList.remove("visible");
    shortcutsPanel?.classList.add("visible");
    renderShortcutsPanel();
    refreshGlobalShortcutAssignments().then(renderShortcutsPanel);
  }

  function closePanels() {
    notesPanel?.classList.remove("visible");
    historyPanel?.classList.remove("visible");
    shortcutsPanel?.classList.remove("visible");
    recordingShortcutAction = null;
  }

  function cycleNote(direction) {
    if (composingTarget) finishComposition();
    if (!state.notes.length) return;
    snapshot("switch note by shortcut");
    const ordered = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt);
    let idx = ordered.findIndex((n) => n.id === state.activeNoteId);
    if (idx < 0) idx = 0;
    idx = (idx + direction + ordered.length) % ordered.length;
    state.activeNoteId = ordered[idx].id;
    refreshEditor();
    closePanels();
    persist(true);
    showToast(direction > 0 ? tr("nextNote") : tr("previousNote"));
    editor.focus();
  }

  function viewportWidth() {
    return Math.max(340, window.innerWidth || document.documentElement?.clientWidth || 1024);
  }

  function viewportHeight() {
    return Math.max(260, window.innerHeight || document.documentElement?.clientHeight || 768);
  }

  function bubbleCoords() {
    const size = 56;
    const margin = 8;
    const vw = viewportWidth();
    const vh = viewportHeight();
    const xRatio = normalizeRatio(state.ui.bubbleXRatio, 0.92);
    const yRatio = normalizeRatio(state.ui.bubbleYRatio, 0.18);
    const x = Math.round((vw - size) * xRatio);
    const y = Math.round((vh - size) * yRatio);
    return {
      x: Math.max(margin, Math.min(x, vw - size - margin)),
      y: Math.max(margin, Math.min(y, vh - size - margin))
    };
  }

  function applyBubblePosition() {
    if (!bubbleWrapEl) return;
    const p = bubbleCoords();
    bubbleWrapEl.style.left = `${p.x}px`;
    bubbleWrapEl.style.top = `${p.y}px`;
  }

  function updateResponsiveHeader() {
    if (!noteEl || IS_STANDALONE) return;
    const width = noteEl.getBoundingClientRect().width || state.ui.width || 420;
    noteEl.classList.remove("header-compact");
    noteEl.classList.toggle("header-tight", width < 365);
    noteEl.classList.toggle("header-ultra", width < 325);
  }

  function positionWindow(forceByBubble = false) {
    if (!noteEl || IS_STANDALONE) return;
    const vw = viewportWidth();
    const vh = viewportHeight();
    const w = Math.min(Math.max(310, Number(state.ui.width) || 420), Math.max(310, vw - 16));
    const h = Math.min(Math.max(230, Number(state.ui.height) || 390), Math.max(230, vh - 16));
    noteEl.style.width = `${w}px`;
    noteEl.style.height = `${h}px`;

    let x;
    let y;
    const canUseSavedWindow =
      !forceByBubble &&
      state.ui.windowXRatio != null &&
      state.ui.windowYRatio != null;

    if (canUseSavedWindow) {
      x = Math.round((vw - w) * normalizeRatio(state.ui.windowXRatio, 0.5));
      y = Math.round((vh - h) * normalizeRatio(state.ui.windowYRatio, 0.15));
    } else {
      const b = bubbleCoords();
      const gap = 12;
      const bubbleSize = 56;
      x = b.x + bubbleSize + gap;
      if (x + w > vw - 8) x = b.x - w - gap;
      x = Math.max(8, Math.min(x, vw - w - 8));
      y = b.y + bubbleSize / 2 - 25;
      if (y + h > vh - 8) y = vh - h - 8;
      y = Math.max(8, y);
    }
    noteEl.style.left = `${x}px`;
    noteEl.style.top = `${y}px`;
    updateResponsiveHeader();
  }

  function cancelPhysicsAnimations() {
    for (const anim of activePhysicsAnimations) {
      try { anim?.cancel(); } catch {}
    }
    activePhysicsAnimations = [];
    currentMorphDirection = null;
    currentMorphPromise = null;
    if (noteEl) {
      noteEl.classList.remove("physics-animating");
      noteEl.style.transformOrigin = "";
    }
    if (bubbleWrapEl) {
      bubbleWrapEl.classList.remove("physics-animating");
      bubbleWrapEl.style.transformOrigin = "";
    }
  }

  function popupTransformFromBubble() {
    const b = bubbleCoords();
    const bubbleSize = 56;
    const bubbleCx = b.x + bubbleSize / 2;
    const bubbleCy = b.y + bubbleSize / 2;

    const wLeft = noteEl ? noteEl.offsetLeft : 0;
    const wTop = noteEl ? noteEl.offsetTop : 0;
    const wWidth = Math.max(200, (noteEl && noteEl.offsetWidth) || Number(state.ui.width) || 420);
    const wHeight = Math.max(180, (noteEl && noteEl.offsetHeight) || Number(state.ui.height) || 390);
    const windowCx = wLeft + wWidth / 2;
    const windowCy = wTop + wHeight / 2;

    const scaleX = Math.max(0.12, Math.min(0.32, bubbleSize / wWidth));
    const scaleY = Math.max(0.12, Math.min(0.32, bubbleSize / wHeight));

    return {
      dx: bubbleCx - windowCx,
      dy: bubbleCy - windowCy,
      scaleX,
      scaleY
    };
  }

  function animateExpandFromBubble() {
    if (prefersReducedMotion() || !noteEl?.animate || !bubbleWrapEl?.animate) {
      bubbleWrapEl?.classList.remove("visible");
      noteEl?.classList.add("visible");
      positionWindow(false);
      return Promise.resolve();
    }
    if (currentMorphDirection === "expand" && currentMorphPromise) {
      return currentMorphPromise;
    }
    cancelPhysicsAnimations();
    applyBubblePosition();
    positionWindow(false);
    bubbleWrapEl.classList.add("visible", "physics-animating");
    noteEl.classList.add("visible", "physics-animating");

    const { dx, dy, scaleX, scaleY } = popupTransformFromBubble();
    noteEl.style.transformOrigin = "center center";
    bubbleWrapEl.style.transformOrigin = "center center";

    const winTransform = noteEl.animate([
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})` },
      { transform: "translate3d(0, 0, 0) scale(1, 1)" }
    ], { duration: 265, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" });

    const winOpacity = noteEl.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 120, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" });

    const bubTransform = bubbleWrapEl.animate([
      { transform: "translate3d(0, 0, 0) scale(1)" },
      { transform: `translate3d(${-dx * 0.26}px, ${-dy * 0.26}px, 0) scale(1.62)` }
    ], { duration: 150, easing: "cubic-bezier(0.16, 0.88, 0.3, 1)", fill: "both" });

    const bubOpacity = bubbleWrapEl.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], { duration: 105, easing: "cubic-bezier(0.35, 0, 0.65, 1)", fill: "both" });

    const batch = [winTransform, winOpacity, bubTransform, bubOpacity];
    activePhysicsAnimations = batch;
    currentMorphDirection = "expand";

    const promise = Promise.allSettled(batch.map((a) => a.finished)).then(() => {
      if (activePhysicsAnimations !== batch) return;
      bubbleWrapEl.classList.remove("visible");
      for (const anim of batch) {
        try { anim.cancel(); } catch {}
      }
      activePhysicsAnimations = [];
      currentMorphDirection = null;
      currentMorphPromise = null;
      void noteEl.offsetWidth;
      void bubbleWrapEl.offsetWidth;
      bubbleWrapEl.classList.remove("physics-animating");
      noteEl.classList.remove("physics-animating");
      noteEl.style.transformOrigin = "";
      bubbleWrapEl.style.transformOrigin = "";
      updateResponsiveHeader();
      updateImageHud();
    });
    currentMorphPromise = promise;
    return promise;
  }

  function animateCollapseToBubble() {
    if (prefersReducedMotion() || !noteEl?.animate || !bubbleWrapEl?.animate) {
      noteEl?.classList.remove("visible");
      bubbleWrapEl?.classList.add("visible");
      applyBubblePosition();
      return Promise.resolve();
    }
    if (currentMorphDirection === "collapse" && currentMorphPromise) {
      return currentMorphPromise;
    }
    cancelPhysicsAnimations();
    applyBubblePosition();
    bubbleWrapEl.classList.add("visible", "physics-animating");
    noteEl.classList.add("visible", "physics-animating");

    const { dx, dy, scaleX, scaleY } = popupTransformFromBubble();
    noteEl.style.transformOrigin = "center center";
    bubbleWrapEl.style.transformOrigin = "center center";

    const winTransform = noteEl.animate([
      { transform: "translate3d(0, 0, 0) scale(1, 1)" },
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})` }
    ], { duration: 235, easing: "cubic-bezier(0.32, 0, 0.15, 1)", fill: "both" });

    const winOpacity = noteEl.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], { duration: 165, delay: 35, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "both" });

    const bubTransform = bubbleWrapEl.animate([
      { transform: `translate3d(${-dx * 0.22}px, ${-dy * 0.22}px, 0) scale(1.42)` },
      { transform: "translate3d(0, 0, 0) scale(1)" }
    ], { duration: 245, easing: "cubic-bezier(0.18, 1.06, 0.28, 1)", fill: "both" });

    const bubOpacity = bubbleWrapEl.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 135, delay: 60, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" });

    const batch = [winTransform, winOpacity, bubTransform, bubOpacity];
    activePhysicsAnimations = batch;
    currentMorphDirection = "collapse";

    const promise = Promise.allSettled(batch.map((a) => a.finished)).then(() => {
      if (activePhysicsAnimations !== batch) return;
      noteEl.classList.remove("visible");
      for (const anim of batch) {
        try { anim.cancel(); } catch {}
      }
      activePhysicsAnimations = [];
      currentMorphDirection = null;
      currentMorphPromise = null;
      void noteEl.offsetWidth;
      void bubbleWrapEl.offsetWidth;
      noteEl.classList.remove("physics-animating");
      bubbleWrapEl.classList.remove("physics-animating");
      noteEl.style.transformOrigin = "";
      bubbleWrapEl.style.transformOrigin = "";
    });
    currentMorphPromise = promise;
    return promise;
  }

  function ensureMounted() {
    if (frameHost && !frameHost.isConnected) {
      // Reattaching an iframe creates a new browsing context. Rebuild the UI
      // from the current state instead of retaining nodes from its old document.
      const detachedHost = frameHost;
      if (composingTarget) finishComposition();
      if (frameHost !== detachedHost) return; // A queued external update remounted it.
      cancelPhysicsAnimations();
      pageWindow.cancelAnimationFrame(frameClipRequest);
      frameClipRequest = null;
      framePointerActive = false;
      mounted = false;
      host = frameHost = frameEl = frameShadowEl = null;
      window = pageWindow;
      document = pageDocument;
    }
    if (!mounted || !host) {
      mount();
      return;
    }
    const rootTarget = document.documentElement || document.body;
    if (rootTarget && !host.isConnected) {
      rootTarget.appendChild(host);
    }
  }

  function applyVisibility(options = {}) {
    ensureMounted();
    if (!mounted) return;
    cancelPhysicsAnimations();

    if (IS_STANDALONE) {
      noteEl.classList.add("visible", "standalone");
      bubbleWrapEl?.classList.remove("visible");
      updateResponsiveHeader();
      return;
    }

    if (state.ui.hidden) {
      closePanels();
      closeLightbox();
      clearSelectedImage();
      noteEl.classList.remove("visible");
      bubbleWrapEl.classList.remove("visible");
      return;
    }

    if (state.ui.collapsed) {
      closePanels();
      closeLightbox();
      clearSelectedImage();
      noteEl.classList.remove("visible");
      bubbleWrapEl.classList.add("visible");
      applyBubblePosition();
    } else {
      const wasVisible = noteEl.classList.contains("visible");
      bubbleWrapEl.classList.remove("visible");
      noteEl.classList.add("visible");
      if (!wasVisible || options.forcePosition) positionWindow(Boolean(options.fromBubble));
      updateResponsiveHeader();
      updateImageHud();
    }
  }

  async function setCollapsed(collapsed, fromBubble = false) {
    if (IS_STANDALONE && collapsed) {
      window.close();
      return;
    }
    state.ui.collapsed = collapsed;
    state.ui.hidden = false;
    state.ui.updatedAt = Date.now();
    closePanels();
    closeLightbox();
    clearSelectedImage();

    if (!collapsed && fromBubble) {
      await animateExpandFromBubble();
    } else if (collapsed && noteEl?.classList.contains("visible")) {
      await animateCollapseToBubble();
    } else {
      applyVisibility({ forcePosition: true, fromBubble });
    }
    persist(true);
    if (!collapsed) setTimeout(() => editor?.focus({ preventScroll: true }), 0);
  }

  // ============================================================================
  // IMAGE ZOOM / RESIZE & DELETE SYSTEM
  // ============================================================================

  function currentHudTarget() {
    if (activeImg && editor?.contains(activeImg)) return activeImg;
    if (hoveredImg && editor?.contains(hoveredImg)) return hoveredImg;
    return null;
  }

  function selectImage(img) {
    if (activeImg && activeImg !== img) {
      activeImg.classList.remove("fqn-img-selected");
    }
    activeImg = img;
    if (activeImg) {
      activeImg.classList.add("fqn-img-selected");
    }
    updateImageHud();
    updateMeta();
  }

  function clearSelectedImage() {
    if (activeImg) {
      activeImg.classList.remove("fqn-img-selected");
      activeImg = null;
    }
    hoveredImg = null;
    updateImageHud();
    updateMeta();
  }

  function getImageScalePercent(img) {
    if (!img || !editor) return 100;
    const editorInnerWidth = Math.max(100, editor.clientWidth - 16);
    const imgWidth = img.getBoundingClientRect().width || img.naturalWidth || editorInnerWidth;
    return Math.max(10, Math.round((imgWidth / editorInnerWidth) * 100));
  }

  function setImageWidthPx(img, newWidthPx, recordSync = true) {
    if (!img || !editor) return;
    const clamped = Math.max(56, Math.min(1800, Math.round(newWidthPx)));
    img.setAttribute("data-custom-width", String(clamped));
    img.setAttribute("width", String(clamped));
    img.style.width = `${clamped}px`;
    img.style.height = "auto";
    updateImageHud();
    if (recordSync) {
      syncEditor("resize image");
    }
  }

  function resetImageFit(img) {
    if (!img) return;
    img.removeAttribute("data-custom-width");
    img.removeAttribute("width");
    img.style.width = "";
    img.style.height = "";
    updateImageHud();
    syncEditor("fit image");
    showToast(tr("imageFitted"));
  }

  function stepZoomImage(img, factor) {
    if (!img || !editor) return;
    const currentWidth = img.getBoundingClientRect().width || Math.max(120, editor.clientWidth - 16);
    setImageWidthPx(img, currentWidth * factor, true);
  }

  function deleteImageElement(img) {
    if (!img || !editor?.contains(img)) return;
    const nextSibling = img.nextSibling;
    if (nextSibling && nextSibling.nodeName === "BR") {
      nextSibling.remove();
    }
    img.remove();
    clearSelectedImage();
    syncEditor("delete image");
    snapshot("delete image");
    showToast(tr("imageDeleted"));
  }

  function updateImageHud() {
    if (!imgHudEl || !bodyEl || !editor) return;
    const target = currentHudTarget();
    if (!target || !noteEl.classList.contains("visible") || notesPanel.classList.contains("visible") || historyPanel.classList.contains("visible") || shortcutsPanel?.classList.contains("visible")) {
      imgHudEl.classList.remove("visible");
      return;
    }

    const bodyRect = bodyEl.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const imgRect = target.getBoundingClientRect();

    // Check if image is visible inside the editor scroll viewport
    const visibleTop = Math.max(editorRect.top, imgRect.top);
    const visibleBottom = Math.min(editorRect.bottom, imgRect.bottom);
    const visibleLeft = Math.max(editorRect.left, imgRect.left);
    const visibleRight = Math.min(editorRect.right, imgRect.right);

    if (visibleBottom - visibleTop < 24 || visibleRight - visibleLeft < 24) {
      imgHudEl.classList.remove("visible");
      return;
    }

    const top = imgRect.top - bodyRect.top;
    const left = imgRect.left - bodyRect.left;
    const width = imgRect.width;
    const height = imgRect.height;

    imgHudEl.style.top = `${Math.round(top)}px`;
    imgHudEl.style.left = `${Math.round(left)}px`;
    imgHudEl.style.width = `${Math.round(width)}px`;
    imgHudEl.style.height = `${Math.round(height)}px`;

    // Keep top toolbar pinned inside the visible region of the image
    const barOffsetTop = Math.max(6, Math.min(height - 34, visibleTop - imgRect.top + 6));
    const barEl = imgHudEl.querySelector(".img-hud-bar");
    if (barEl) {
      barEl.style.top = `${Math.round(barOffsetTop)}px`;
    }

    if (imgScaleBtn) {
      imgScaleBtn.textContent = `${getImageScalePercent(target)}%`;
    }

    imgHudEl.classList.add("visible");
  }

  function startImageResize(e) {
    const target = currentHudTarget();
    if (!target || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    selectImage(target);
    isResizingImg = true;

    const startX = e.clientX;
    const startWidth = target.getBoundingClientRect().width || 200;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      setImageWidthPx(target, startWidth + dx, false);
    };

    const onUp = () => {
      isResizingImg = false;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      syncEditor("resize image");
      snapshot("resize image");
    };

    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
  }

  function markImageCopySuccess(img) {
    if (!img) return;
    img.classList.remove("fqn-img-copying");
    void img.offsetWidth;
    img.classList.add("fqn-img-copying");
    img.addEventListener("animationend", () => img.classList.remove("fqn-img-copying"), { once: true });
    if (copyImageBtn) {
      copyImageBtn.classList.add("success");
      const oldTitle = copyImageBtn.title;
      copyImageBtn.title = "Copied";
      setTimeout(() => { copyImageBtn?.classList.remove("success"); if (copyImageBtn) copyImageBtn.title = oldTitle; }, 650);
    }
  }

  async function copySingleImage(img) {
    if (!img?.src) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const res = await fetch(img.src);
        const blob = await res.blob();
        let pngBlob = blob;
        if (blob.type !== "image/png") {
          const bmp = await createImageBitmap(blob);
          const canvas = document.createElement("canvas");
          canvas.width = bmp.width;
          canvas.height = bmp.height;
          canvas.getContext("2d").drawImage(bmp, 0, 0);
          pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        }
        if (pngBlob) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
          markImageCopySuccess(img);
          showToast(tr("imageCopiedClipboard"));
          return;
        }
      }
    } catch {
      // Fallback to HTML selection copy
    }
    try {
      const html = `<img src="${escapeHtml(img.src)}" alt="Image">`;
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([img.src], { type: "text/plain" })
        })
      ]);
      markImageCopySuccess(img);
      showToast(tr("imageCopied"));
    } catch {
      showToast(tr("couldNotCopyImage"));
    }
  }

  function openLightbox(img) {
    if (!img || !lightboxEl || !lightboxImg) return;
    selectImage(img);
    lightboxImg.src = img.src;
    lightboxZoom = 1;
    lightboxPanX = 0;
    lightboxPanY = 0;
    applyLightboxTransform();
    lightboxEl.classList.add("visible");
  }

  function closeLightbox() {
    lightboxEl?.classList.remove("visible");
  }

  function applyLightboxTransform() {
    if (!lightboxImg || !lightboxScaleEl) return;
    lightboxImg.style.transform = `translate(${Math.round(lightboxPanX)}px, ${Math.round(lightboxPanY)}px) scale(${lightboxZoom.toFixed(2)})`;
    lightboxScaleEl.textContent = `${Math.round(lightboxZoom * 100)}%`;
  }

  // ============================================================================
  // RICH PASTE & DRAG-DROP IMAGE SYSTEM
  // ============================================================================

  function getSelectionForEditor() {
    return shadow.getSelection?.() || window.getSelection();
  }

  function insertHtmlAtCaret(html, source = "add content") {
    editor.focus();
    const sel = getSelectionForEditor();
    let range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node;
    let last;
    while ((node = temp.firstChild)) last = frag.appendChild(node);
    range.insertNode(frag);
    if (last && sel) {
      range.setStartAfter(last);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    syncEditor(source);
  }

  function insertTextAtCaret(text) {
    insertHtmlAtCaret(escapeHtml(text).replace(/\n/g, "<br>") + "<br>", "paste text");
  }

  function resolveExternalImageInEditor(imgId, externalUrl) {
    if (!externalUrl || externalUrl.startsWith("data:") || !isExtensionContextValid()) return;
    chrome.runtime.sendMessage({ type: "FQN_FETCH_IMAGE", url: externalUrl }, (res) => {
      void chrome.runtime.lastError;
      if (res?.ok && res.dataUrl && res.dataUrl.startsWith("data:image/")) {
        const targetImg = editor?.querySelector(`img[data-fqn-id="${imgId}"]`);
        if (targetImg) {
          targetImg.src = res.dataUrl;
          targetImg.removeAttribute("data-fqn-id");
          syncEditor("sync image");
        }
      }
    });
  }

  function insertImageSrc(src, alt = "Image") {
    const safe = normalizeUrl(src);
    if (!safe) return false;
    const imgId = uid();
    const needsResolve = /^https?:\/\//i.test(safe);
    const attrId = needsResolve ? ` data-fqn-id="${imgId}"` : "";
    insertHtmlAtCaret(`<img src="${escapeHtml(safe)}" alt="${escapeHtml(alt)}" data-fqn-temp="${imgId}"${attrId}><br>`, "paste image");
    const inserted = editor?.querySelector(`img[data-fqn-temp="${imgId}"]`);
    if (inserted) {
      inserted.removeAttribute("data-fqn-temp");
      inserted.classList.add("fqn-img-enter");
      inserted.addEventListener("animationend", () => inserted.classList.remove("fqn-img-enter"), { once: true });
      selectImage(inserted);
      requestAnimationFrame(() => inserted.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    }
    if (needsResolve) {
      resolveExternalImageInEditor(imgId, safe);
    } else if (safe.startsWith("blob:")) {
      fetch(safe)
        .then((r) => r.blob())
        .then((b) => {
          const reader = new FileReader();
          reader.onload = () => {
            const target = editor?.querySelector(`img[src="${CSS.escape(safe)}"]`);
            if (target && typeof reader.result === "string") {
              target.src = reader.result;
              syncEditor("sync image");
            }
          };
          reader.readAsDataURL(b);
        })
        .catch(() => {});
    }
    return true;
  }

  function isImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith("image/")) return true;
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(file.name || "");
  }

  function looksLikeDirectImageUrl(str) {
    const trimmed = String(str || "").trim();
    if (!trimmed || /\s/.test(trimmed)) return false;
    if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return true;
    try {
      const u = new URL(trimmed);
      if (!["http:", "https:"].includes(u.protocol)) return false;
      return /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(\?.*)?(#.*)?$/i.test(u.pathname + u.search);
    } catch {
      return false;
    }
  }

  function extractImageFilesFromDataTransfer(dt) {
    if (!dt) return [];
    const seen = new Set();
    const result = [];
    const addFile = (f) => {
      if (!isImageFile(f)) return;
      const key = `${f.name}-${f.size}-${f.type}-${f.lastModified}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push(f);
    };
    for (const item of [...(dt.items || [])]) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) addFile(f);
      }
    }
    for (const f of [...(dt.files || [])]) {
      addFile(f);
    }
    return result;
  }

  function extractStructuredHtmlWithImages(rawHtml) {
    if (!rawHtml) return { hasImage: false, hasText: false, html: "" };
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
    const imgs = [...doc.querySelectorAll("img")];
    if (!imgs.length) return { hasImage: false, hasText: Boolean(doc.body?.textContent?.trim()), html: "" };

    const pendingResolves = [];
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return escapeHtml(node.nodeValue || "");
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const tag = node.tagName.toLowerCase();
      if (["script", "style", "meta", "link", "head", "noscript"].includes(tag)) return "";
      if (tag === "br") return "<br>";
      if (tag === "img") {
        const rawSrc =
          node.getAttribute("src") ||
          node.getAttribute("data-src") ||
          node.getAttribute("data-original") ||
          "";
        const safe = normalizeUrl(rawSrc);
        if (!safe) return "";
        const imgId = uid();
        const needsResolve = /^https?:\/\//i.test(safe);
        if (needsResolve) pendingResolves.push({ imgId, url: safe });
        return `<img src="${escapeHtml(safe)}" alt="${escapeHtml(node.getAttribute("alt") || "Image")}"${
          needsResolve ? ` data-fqn-id="${imgId}"` : ""
        }><br>`;
      }
      const childrenHtml = [...node.childNodes].map(walk).join("");
      if (["p", "div", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "section", "article"].includes(tag)) {
        return childrenHtml ? `${childrenHtml}<br>` : "";
      }
      return childrenHtml;
    };

    const builtHtml = walk(doc.body).replace(/(<br>\s*){3,}/g, "<br><br>");
    const hasText = Boolean((doc.body?.textContent || "").trim());
    return {
      hasImage: pendingResolves.length > 0 || builtHtml.includes("<img "),
      hasText,
      html: builtHtml,
      pendingResolves
    };
  }

  function handleDataTransferInput(dt) {
    if (!dt) return false;
    const imageFiles = extractImageFilesFromDataTransfer(dt);
    const rawHtml = dt.getData("text/html") || "";
    const plainText = dt.getData("text/plain") || "";
    const uriList = (dt.getData("text/uri-list") || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#"));

    const parsedHtml = extractStructuredHtmlWithImages(rawHtml);

    // Case 1: Clipboard/Drop has binary image file(s) (screenshots, "Copy image", Finder/Explorer files)
    if (imageFiles.length > 0) {
      // Only also insert text if the clipboard had real multi-word text alongside the image in HTML
      if (parsedHtml.hasText && parsedHtml.hasImage) {
        insertHtmlAtCaret(parsedHtml.html, "paste content and image");
        for (const item of parsedHtml.pendingResolves || []) {
          resolveExternalImageInEditor(item.imgId, item.url);
        }
        showToast(tr("contentImagePasted"));
        return true;
      }

      for (const file of imageFiles) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            insertImageSrc(reader.result, file.name || "Image");
          }
        };
        reader.readAsDataURL(file);
      }
      showToast(imageFiles.length > 1 ? tr("pastedImages", { n: imageFiles.length }) : tr("imagePasted"));
      return true;
    }

    // Case 2: Clipboard/Drop has HTML containing <img> (e.g. copied from webpage, Docs, Word, Zalo, Notion)
    if (parsedHtml.hasImage && parsedHtml.html) {
      insertHtmlAtCaret(parsedHtml.html, "paste image");
      for (const item of parsedHtml.pendingResolves || []) {
        resolveExternalImageInEditor(item.imgId, item.url);
      }
      showToast(tr("imagePasted"));
      return true;
    }

    // Case 3: Clipboard/Drop has a direct image URL or data:image URL
    const candidateUrl = looksLikeDirectImageUrl(uriList)
      ? uriList
      : looksLikeDirectImageUrl(plainText)
      ? plainText.trim()
      : "";
    if (candidateUrl) {
      if (insertImageSrc(candidateUrl, "Image")) {
        showToast(tr("imagePastedLink"));
        return true;
      }
    }

    // Case 4: Plain text
    if (plainText) {
      insertTextAtCaret(plainText);
      return true;
    }
    return false;
  }

  function handlePaste(e) {
    const dt = e.clipboardData;
    if (!dt) return;
    e.preventDefault();
    e.stopPropagation();
    handleDataTransferInput(dt);
  }

  function syncEditor(source = "auto save") {
    if (composingTarget === editor) return;
    const n = activeNote();
    const html = cleanEditorHtml(editor.innerHTML);
    if (n.html !== html) markNoteDirty(n.id, "html");
    n.html = html;
    n.updatedAt = Date.now();
    setStatus(tr("saving"));
    updateMeta();
    updateImageHud();
    persist(false);
    scheduleHistory(source);
  }

  function isEditingNote() {
    return document.hasFocus() && (shadow?.activeElement === editor || shadow?.activeElement === titleInput);
  }

  function isComposingEvent(e) {
    // keyCode 229 also covers IMEs whose first/last key has isComposing=false.
    return Boolean(composingTarget || e.isComposing || e.keyCode === 229 || e.key === "Process" || e.key === "Dead");
  }

  function markNoteDirty(id, field) {
    if (!dirtyNoteFields.has(id)) dirtyNoteFields.set(id, new Set());
    dirtyNoteFields.get(id).add(field);
    editRevision++;
  }

  function syncTitle() {
    if (composingTarget === titleInput) return;
    const n = activeNote();
    const title = titleInput.value || tr("note");
    if (n.title !== title) markNoteDirty(n.id, "title");
    n.title = title;
    n.updatedAt = Date.now();
    setStatus(tr("saving"));
    persist(false);
  }

  function finishComposition() {
    clearTimeout(compositionCommitTimer);
    const target = composingTarget;
    composingTarget = null;
    if (target === editor) syncEditor();
    else if (target === titleInput) syncTitle();
    else if (target === searchInput) renderNotesPanel(searchInput.value);
    if (pendingExternalState) {
      const incoming = pendingExternalState;
      pendingExternalState = null;
      applyExternalState(incoming);
    }
    persist(false);
  }

  function markNoteCopySuccess() {
    const btn = shadow?.querySelector(".content-copy-btn");
    if (!btn) return;
    btn.classList.add("copied");
    btn.innerHTML = icons.check;
    clearTimeout(markNoteCopySuccess._t);
    markNoteCopySuccess._t = setTimeout(() => {
      btn.classList.remove("copied");
      btn.innerHTML = icons.copy;
    }, 850);
  }

  async function copyRichNote() {
    const n = activeNote();
    const html = cleanEditorHtml(n.html || "");
    const plain = plainTextFromHtml(html);
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" })
          })
        ]);
        markNoteCopySuccess();
        showToast(tr("textImagesCopied"));
        return;
      }
    } catch {}
    try {
      const range = document.createRange();
      range.selectNodeContents(editor);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand("copy");
      sel.removeAllRanges();
      if (ok) markNoteCopySuccess();
      showToast(ok ? tr("noteCopied") : tr("couldNotCopy"));
    } catch {
      showToast(tr("couldNotCopy"));
    }
  }

  // ============================================================================
  // WINDOW & BUBBLE DRAGGING
  // ============================================================================

  function startBubbleDrag(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = bubbleWrapEl.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const sl = rect.left;
    const st = rect.top;
    let moved = false;

    bubbleEl.classList.add("dragging");
    try {
      bubbleEl.setPointerCapture?.(e.pointerId);
    } catch {}

    const move = (ev) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 7) {
        moved = true;
      }
      if (!moved) return;
      const vw = viewportWidth();
      const vh = viewportHeight();
      const x = Math.max(8, Math.min(sl + dx, vw - 64));
      const y = Math.max(8, Math.min(st + dy, vh - 64));
      bubbleWrapEl.style.left = `${x}px`;
      bubbleWrapEl.style.top = `${y}px`;
    };

    const up = (ev) => {
      try {
        bubbleEl.releasePointerCapture?.(ev.pointerId);
      } catch {}
      bubbleEl.classList.remove("dragging");
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);

      if (moved) {
        const r = bubbleWrapEl.getBoundingClientRect();
        const vw = viewportWidth();
        const vh = viewportHeight();
        state.ui.bubbleXRatio = Math.max(0, Math.min(1, r.left / Math.max(1, vw - 56)));
        state.ui.bubbleYRatio = Math.max(0, Math.min(1, r.top / Math.max(1, vh - 56)));
        state.ui.windowXRatio = null;
        state.ui.windowYRatio = null;
        state.ui.updatedAt = Date.now();
        persist(true);
      } else {
        setCollapsed(false, true);
      }
    };

    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
  }

  function startWindowDrag(e) {
    if (IS_STANDALONE || e.button !== 0 || e.target.closest("button,input")) return;
    e.preventDefault();
    const rect = noteEl.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const sl = rect.left;
    const st = rect.top;
    const header = e.currentTarget;
    let moved = false;

    try {
      header.setPointerCapture?.(e.pointerId);
    } catch {}

    const move = (ev) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 3) moved = true;
      if (!moved) return;
      const vw = viewportWidth();
      const vh = viewportHeight();
      const x = Math.max(8, Math.min(sl + dx, vw - noteEl.offsetWidth - 8));
      const y = Math.max(8, Math.min(st + dy, vh - noteEl.offsetHeight - 8));
      noteEl.style.left = `${x}px`;
      noteEl.style.top = `${y}px`;
    };

    const up = (ev) => {
      try {
        header.releasePointerCapture?.(ev.pointerId);
      } catch {}
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);

      if (moved) {
        const r = noteEl.getBoundingClientRect();
        const vw = viewportWidth();
        const vh = viewportHeight();
        state.ui.windowXRatio = Math.max(0, Math.min(1, r.left / Math.max(1, vw - r.width)));
        state.ui.windowYRatio = Math.max(0, Math.min(1, r.top / Math.max(1, vh - r.height)));
        state.ui.updatedAt = Date.now();
        persist(false);
      }
    };

    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
  }

  // ============================================================================
  // MOUNT UI
  // ============================================================================

  function updateFrameClip() {
    frameClipRequest = null;
    if (!frameEl?.isConnected) return;
    if (noteEl && frameShadowEl) {
      const r = noteEl.getBoundingClientRect();
      const style = window.getComputedStyle(noteEl);
      // Paint the exterior shadow separately without making that area clickable.
      frameShadowEl.style.cssText = `position:absolute;pointer-events:none;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${style.borderRadius};box-shadow:${style.boxShadow};opacity:${style.opacity};visibility:${style.visibility};`;
    }
    if (framePointerActive) {
      // Keep drags, text selections and native resizing in the child document
      // until pointerup, even if the pointer leaves the visible note rectangle.
      frameEl.style.clipPath = "none";
      return;
    }
    const paths = [noteEl, bubbleWrapEl].filter((el) => el &&
      (el.classList.contains("visible") || el.classList.contains("physics-animating")))
      .map((el) => {
        const r = el.getBoundingClientRect();
        const pad = el === bubbleWrapEl ? 8 : 0;
        return `M${r.left - pad} ${r.top - pad}H${r.right + pad}V${r.bottom + pad}H${r.left - pad}Z`;
      });
    // Clip the full-viewport iframe to the UI so the page outside stays clickable.
    frameEl.style.clipPath = paths.length ? `path("${paths.join(" ")}")` : "inset(100%)";
    if (currentMorphDirection) scheduleFrameClip();
  }

  function scheduleFrameClip() {
    if (frameEl && frameClipRequest === null) frameClipRequest = pageWindow.requestAnimationFrame(updateFrameClip);
  }

  function mountIsolatedFrame() {
    frameHost = pageDocument.createElement("div");
    frameHost.id = "__floating_quick_note_host__";
    frameHost.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;";
    const frameShadow = frameHost.attachShadow({ mode: "open" });
    frameShadowEl = pageDocument.createElement("div");
    frameShadow.appendChild(frameShadowEl);
    frameEl = pageDocument.createElement("iframe");
    frameEl.dataset.fqnFrame = "true";
    frameEl.title = "Floating Quick Note";
    frameEl.style.cssText = "display:block;position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;pointer-events:auto;clip-path:inset(100%);color-scheme:normal;";
    frameShadow.appendChild(frameEl);
    (pageDocument.documentElement || pageDocument.body).appendChild(frameHost);
    // An initial about:blank document needs no remote URL, permissions or scripts.
    // Native keyboard, beforeinput, clipboard and IME events stay in this document.
    window = frameEl.contentWindow;
    document = frameEl.contentDocument;
    document.documentElement.style.cssText = "margin:0;background:transparent;overflow:hidden";
    document.body.style.cssText = "margin:0;background:transparent;overflow:hidden";
    window.addEventListener("pointerdown", () => {
      framePointerActive = true;
      frameEl.style.clipPath = "none";
      scheduleFrameClip();
    }, true);
    const releasePointer = () => {
      framePointerActive = false;
      scheduleFrameClip();
    };
    window.addEventListener("pointerup", releasePointer, true);
    window.addEventListener("pointercancel", releasePointer, true);
    window.addEventListener("blur", releasePointer);
    window.addEventListener("resize", scheduleFrameClip);
  }

  function mount() {
    if (mounted && host) {
      const rootTarget = document.documentElement || document.body;
      if (rootTarget && !host.isConnected) rootTarget.appendChild(host);
      return;
    }
    mounted = true;
    if (!IS_STANDALONE) mountIsolatedFrame();
    host = document.createElement("div");
    host.id = "__floating_quick_note_host__";
    host.style.all = "initial";
    (document.documentElement || document.body).appendChild(host);
    shadow = host.attachShadow({ mode: "open" });

    // Keep UI events inside its shadow tree; the iframe also isolates capture listeners.
    for (const type of ["keydown", "keypress", "keyup", "beforeinput", "input",
      "compositionstart", "compositionupdate", "compositionend", "paste", "copy", "cut"]) {
      shadow.addEventListener(type, (e) => e.stopPropagation());
    }

    shadow.innerHTML = `
      <style>${css}</style>
      <div class="root">
        <section class="window" tabindex="-1" role="dialog" aria-label="Floating Quick Note">
          <div class="header">
            <div class="brand">
              <div class="brand-mark">${icons.note}</div>
              <input class="title-input" maxlength="80" aria-label="Note title" title="Note title">
            </div>
            <div class="actions">
              <button class="icon-btn notes-btn" title="Saved notes">${icons.list}</button>
              <button class="icon-btn new-btn" title="New note">${icons.plus}</button>
              <button class="icon-btn history-btn" title="Edit history">${icons.history}</button>
              <button class="icon-btn collapse-btn" title="Collapse to bubble">${icons.minus}</button>
              <button class="icon-btn close-btn" title="Hide on all tabs">${icons.close}</button>
            </div>
          </div>
          <div class="body" data-drop-label="Drop image here to add it to the note">
            <button class="content-copy-btn" type="button" title="Copy entire note" aria-label="Copy entire note">${icons.copy}</button>
            <div class="editor" contenteditable="true" spellcheck="false" data-placeholder="Type a note, paste an image (Ctrl+V / Cmd+V), or drag an image here…"></div>
            <div class="img-hud">
              <div class="img-hud-bar">
                <div class="img-hud-group">
                  <button class="hud-btn hud-zoom-out" type="button" title="Zoom out image (−)">−</button>
                  <button class="hud-btn hud-scale" type="button" title="Fit image to note (100%)">100%</button>
                  <button class="hud-btn hud-zoom-in" type="button" title="Zoom in image (+)">+</button>
                  <button class="hud-btn hud-preview" type="button" title="Open image preview (double-click)">${icons.zoomIn}</button>
                  <button class="hud-btn hud-copy-img" type="button" title="Copy this image">${icons.copy}</button>
                </div>
                <div class="img-hud-group">
                  <button class="hud-btn danger hud-delete" type="button" title="Delete image (Delete / Backspace)">${icons.trash}<span>Delete</span></button>
                </div>
              </div>
              <div class="img-resize-handle" title="Drag to resize image"></div>
            </div>
          </div>
          <div class="footer">
            <span class="meta"></span>
            <span class="status">Saved</span>
          </div>
          <div class="panel notes-panel">
            <div class="panel-head">
              <button class="icon-btn panel-back">${icons.back}</button>
              <div class="panel-title">Saved notes</div>
              <span class="count saved-count"></span>
              <button class="icon-btn panel-new">${icons.plus}</button>
            </div>
            <div class="search-wrap">${icons.search}<input class="search" placeholder="Search title or content…"></div>
            <div class="panel-content"></div>
          </div>
          <div class="panel history-panel">
            <div class="panel-head">
              <button class="icon-btn panel-back">${icons.back}</button>
              <div class="panel-title">Edit history</div>
            </div>
            <div class="panel-content"></div>
          </div>
          <div class="lightbox">
            <div class="lightbox-head">
              <span>Image preview · Scroll to zoom · Drag to pan</span>
              <div class="lightbox-actions">
                <button class="hud-btn lb-zoom-out" type="button" title="Zoom out">−</button>
                <button class="hud-btn hud-scale lb-scale" type="button" title="Reset to 100%">100%</button>
                <button class="hud-btn lb-zoom-in" type="button" title="Zoom in">+</button>
                <button class="hud-btn danger lb-delete" type="button" title="Delete this image">${icons.trash}</button>
                <button class="hud-btn lb-close" type="button" title="Close (Esc)">${icons.close}</button>
              </div>
            </div>
            <div class="lightbox-viewport">
              <img alt="Image preview">
            </div>
          </div>
          <div class="toast"></div>
        </section>
        <div class="bubble-wrap"><button class="bubble" type="button" aria-label="Open Floating Quick Note" title="Open note"><span class="bubble-glyph">${icons.chatNote}</span></button><button class="bubble-close" type="button" aria-label="Close Floating Quick Note" title="Close bubble"></button></div>
      </div>
    `;

    rootEl = shadow.querySelector(".root");
    noteEl = shadow.querySelector(".window");
    bubbleWrapEl = shadow.querySelector(".bubble-wrap");
    bubbleEl = shadow.querySelector(".bubble");
    bodyEl = shadow.querySelector(".body");
    editor = shadow.querySelector(".editor");
    titleInput = shadow.querySelector(".title-input");
    statusEl = shadow.querySelector(".status");
    footer = shadow.querySelector(".footer");
    notesPanel = shadow.querySelector(".notes-panel");
    historyPanel = shadow.querySelector(".history-panel");
    shortcutsPanel = null;
    shortcutListEl = null;
    searchInput = shadow.querySelector(".search");
    savedCountEl = shadow.querySelector(".saved-count");
    toastEl = shadow.querySelector(".toast");
    moreMenuEl = null;

    imgHudEl = shadow.querySelector(".img-hud");
    imgScaleBtn = shadow.querySelector(".hud-scale");
    imgResizeHandle = shadow.querySelector(".img-resize-handle");
    lightboxEl = shadow.querySelector(".lightbox");
    lightboxImg = lightboxEl.querySelector("img");
    lightboxScaleEl = shadow.querySelector(".lb-scale");
    copyImageBtn = shadow.querySelector(".hud-copy-img");

    shadow.querySelector(".header").addEventListener("pointerdown", startWindowDrag);
    bubbleEl.addEventListener("pointerdown", startBubbleDrag);
    shadow.querySelector(".bubble-close").addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); });
    shadow.querySelector(".bubble-close").addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      state.ui.hidden = true;
      state.ui.collapsed = true;
      state.ui.updatedAt = Date.now();
      applyVisibility();
      persist(true);
    });
    shadow.querySelector(".notes-btn").addEventListener("click", openNotesPanel);
    shadow.querySelector(".new-btn").addEventListener("click", createNote);
    shadow.querySelector(".content-copy-btn").addEventListener("click", copyRichNote);
    shadow.querySelector(".history-btn").addEventListener("click", openHistoryPanel);
    shadow.querySelector(".collapse-btn").addEventListener("click", () => setCollapsed(true));
    shadow.querySelector(".close-btn").addEventListener("click", () => {
      if (IS_STANDALONE) {
        window.close();
        return;
      }
      state.ui.hidden = true;
      state.ui.updatedAt = Date.now();
      applyVisibility();
      persist(true);
    });
    shadow.querySelectorAll(".panel-back").forEach((b) => b.addEventListener("click", closePanels));
    shadow.querySelector(".panel-new").addEventListener("click", createNote);
    for (const field of [editor, titleInput, searchInput]) {
      field.addEventListener("compositionstart", () => {
        if (composingTarget && composingTarget !== field) finishComposition();
        clearTimeout(compositionCommitTimer);
        composingTarget = field;
        if (field === editor && activeImg) clearSelectedImage();
        clearTimeout(saveTimer);
        saveTimer = null;
        clearTimeout(historyTimer);
      });
      field.addEventListener("compositionend", () => {
        // Allow the final native input event to settle before reading the DOM.
        compositionCommitTimer = setTimeout(finishComposition, 0);
      });
      field.addEventListener("blur", () => {
        if (composingTarget === field) compositionCommitTimer = setTimeout(finishComposition, 0);
      });
    }
    searchInput.addEventListener("input", (e) => {
      if (!isComposingEvent(e)) renderNotesPanel(searchInput.value);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (isComposingEvent(e)) return;
      const firstCard = notesPanel.querySelector(".note-card");
      if ((e.key === "Enter" || e.key === "ArrowDown") && firstCard) {
        e.preventDefault();
        if (e.key === "Enter") firstCard.click(); else firstCard.focus();
      }
      if (e.key === "Escape") { e.preventDefault(); closePanels(); editor.focus(); }
    });

    // Editor events
    editor.addEventListener("input", (e) => {
      if (isComposingEvent(e)) return;
      if (activeImg) clearSelectedImage();
      syncEditor("auto save");
    });
    editor.addEventListener("paste", handlePaste);
    editor.addEventListener("scroll", updateImageHud, { passive: true });
    editor.addEventListener("blur", () => {
      snapshot("editor blur");
      persist(false);
    });

    // Global paste inside the note window (even when editor isn't directly focused)
    noteEl.addEventListener("paste", (e) => {
      const active = shadow.activeElement;
      if (active === titleInput || active === searchInput || active === editor) return;
      handlePaste(e);
    });

    // Drag and Drop images from anywhere into the note body/editor
    bodyEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      bodyEl.classList.add("drag-over");
    });
    bodyEl.addEventListener("dragleave", (e) => {
      if (!bodyEl.contains(e.relatedTarget)) {
        bodyEl.classList.remove("drag-over");
      }
    });
    bodyEl.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      bodyEl.classList.remove("drag-over");
      if (e.dataTransfer) {
        handleDataTransferInput(e.dataTransfer);
      }
    });

    // Image hover, click, wheel zoom, double-click lightbox, and keyboard delete
    editor.addEventListener("load", updateImageHud, true);
    editor.addEventListener("pointerover", (e) => {
      const img = e.target.closest?.("img");
      if (img && editor.contains(img)) {
        hoveredImg = img;
        updateImageHud();
      }
    });
    bodyEl.addEventListener("mousemove", (e) => {
      if (isResizingImg) return;
      if (e.target.closest?.(".img-hud")) return;
      const img = e.target.closest?.("img");
      if (img && editor.contains(img)) {
        if (hoveredImg !== img) {
          hoveredImg = img;
          updateImageHud();
        }
      } else if (hoveredImg && !activeImg) {
        hoveredImg = null;
        updateImageHud();
      }
    });
    bodyEl.addEventListener("mouseleave", () => {
      if (!isResizingImg) {
        hoveredImg = null;
        updateImageHud();
      }
    });
    editor.addEventListener("click", (e) => {
      const img = e.target.closest?.("img");
      if (img && editor.contains(img)) {
        selectImage(img);
      } else if (activeImg) {
        clearSelectedImage();
      }
    });
    editor.addEventListener("dblclick", (e) => {
      const img = e.target.closest?.("img");
      if (img && editor.contains(img)) {
        e.preventDefault();
        openLightbox(img);
      }
    });
    editor.addEventListener(
      "wheel",
      (e) => {
        const img = e.target.closest?.("img") || activeImg;
        if (img && editor.contains(img) && (e.ctrlKey || e.metaKey || e.altKey)) {
          e.preventDefault();
          selectImage(img);
          const factor = e.deltaY < 0 ? 1.12 : 0.89;
          stepZoomImage(img, factor);
        }
      },
      { passive: false }
    );

    // Image HUD toolbar actions
    shadow.querySelector(".hud-zoom-out").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = currentHudTarget();
      if (target) {
        selectImage(target);
        stepZoomImage(target, 0.82);
      }
    });
    shadow.querySelector(".hud-zoom-in").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = currentHudTarget();
      if (target) {
        selectImage(target);
        stepZoomImage(target, 1.22);
      }
    });
    imgScaleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = currentHudTarget();
      if (target) {
        selectImage(target);
        resetImageFit(target);
      }
    });
    shadow.querySelector(".hud-preview").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = currentHudTarget();
      if (target) openLightbox(target);
    });
    shadow.querySelector(".hud-copy-img").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = currentHudTarget();
      if (target) copySingleImage(target);
    });
    shadow.querySelector(".hud-delete").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = currentHudTarget();
      if (target) deleteImageElement(target);
    });
    imgResizeHandle.addEventListener("pointerdown", startImageResize);

    // Lightbox events
    const lbViewport = shadow.querySelector(".lightbox-viewport");
    shadow.querySelector(".lb-zoom-out").addEventListener("click", () => {
      lightboxZoom = Math.max(0.25, lightboxZoom * 0.8);
      applyLightboxTransform();
    });
    shadow.querySelector(".lb-zoom-in").addEventListener("click", () => {
      lightboxZoom = Math.min(5, lightboxZoom * 1.25);
      applyLightboxTransform();
    });
    lightboxScaleEl.addEventListener("click", () => {
      lightboxZoom = 1;
      lightboxPanX = 0;
      lightboxPanY = 0;
      applyLightboxTransform();
    });
    shadow.querySelector(".lb-delete").addEventListener("click", () => {
      const target = activeImg || hoveredImg;
      closeLightbox();
      if (target) deleteImageElement(target);
    });
    shadow.querySelector(".lb-close").addEventListener("click", closeLightbox);
    lbViewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        lightboxZoom = Math.max(0.25, Math.min(5, lightboxZoom * factor));
        applyLightboxTransform();
      },
      { passive: false }
    );
    lbViewport.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const sx = e.clientX;
      const sy = e.clientY;
      const spx = lightboxPanX;
      const spy = lightboxPanY;
      const move = (ev) => {
        lightboxPanX = spx + (ev.clientX - sx);
        lightboxPanY = spy + (ev.clientY - sy);
        applyLightboxTransform();
      };
      const up = () => {
        window.removeEventListener("pointermove", move, true);
        window.removeEventListener("pointerup", up, true);
      };
      window.addEventListener("pointermove", move, true);
      window.addEventListener("pointerup", up, true);
    });

    // Smart keyboard shortcuts: editable and scoped to this popup only.
    noteEl.addEventListener("keydown", (e) => {
      if (recordingShortcutAction || e.defaultPrevented || isComposingEvent(e)) return;
      const key = e.key.toLowerCase();
      const primary = e.ctrlKey || e.metaKey;
      const selection = getSelectionForEditor();
      const hasTextSelection = Boolean(selection && !selection.isCollapsed && String(selection).trim());
      const imageSelected = Boolean(activeImg && editor.contains(activeImg));
      const imageKeyboardContext = e.target === editor || editor.contains(e.target) ||
        imgHudEl.contains(e.target) || lightboxEl.contains(e.target);

      const shortcutHandlers = {
        save: () => { snapshot("manual save"); persist(true); showToast(tr("saved")); },
        search: () => openNotesPanel(),
        newNote: () => createNote(),
        copyNote: () => copyRichNote(),
        history: () => openHistoryPanel(),
        collapse: () => setCollapsed(true),
        nextNote: () => cycleNote(1),
        previousNote: () => cycleNote(-1)
      };
      for (const action of Object.keys(SHORTCUT_DEFAULTS)) {
        if (shortcutMatches(e, currentShortcut(action))) {
          e.preventDefault();
          shortcutHandlers[action]?.();
          return;
        }
      }

      // Image-aware shortcuts only take over when an image is explicitly selected.
      if (imageSelected && imageKeyboardContext && !hasTextSelection) {
        if (primary && !e.altKey && key === "c") {
          e.preventDefault(); copySingleImage(activeImg); return;
        }
        if (!primary && !e.altKey && (e.key === "+" || e.key === "=")) {
          e.preventDefault(); stepZoomImage(activeImg, 1.12); return;
        }
        if (!primary && !e.altKey && e.key === "-") {
          e.preventDefault(); stepZoomImage(activeImg, 0.89); return;
        }
        if (!primary && !e.altKey && e.key === "0") {
          e.preventDefault(); resetImageFit(activeImg); return;
        }
        if (!primary && !e.altKey && e.key === "Enter") {
          e.preventDefault(); openLightbox(activeImg); return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault(); deleteImageElement(activeImg); return;
        }
      }

      if (e.key === "Escape") {
        if (lightboxEl.classList.contains("visible")) { e.preventDefault(); closeLightbox(); return; }
        if (imageSelected) { e.preventDefault(); clearSelectedImage(); return; }
        if (notesPanel.classList.contains("visible") || historyPanel.classList.contains("visible") || shortcutsPanel?.classList.contains("visible")) {
          e.preventDefault(); closePanels(); editor.focus(); return;
        }
      }
    });

    titleInput.addEventListener("input", (e) => {
      if (!isComposingEvent(e)) syncTitle();
    });
    titleInput.addEventListener("blur", () => {
      if (composingTarget === titleInput) return;
      if (!titleInput.value.trim()) titleInput.value = tr("note");
      syncTitle();
      persist(true);
    });

    window.addEventListener("blur", () => persist(false));

    // Save user-initiated window resize only on pointerup when dimensions changed
    let resizeStartW = 0;
    let resizeStartH = 0;
    noteEl.addEventListener("pointerdown", () => {
      const r = noteEl.getBoundingClientRect();
      resizeStartW = Math.round(r.width);
      resizeStartH = Math.round(r.height);
    });
    window.addEventListener("pointerup", () => {
      if (!mounted || state.ui.hidden || state.ui.collapsed || !noteEl.classList.contains("visible") || IS_STANDALONE) return;
      const r = noteEl.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (w >= 310 && h >= 230 && (w !== resizeStartW || h !== resizeStartH) && resizeStartW > 0) {
        resizeStartW = w;
        resizeStartH = h;
        state.ui.width = w;
        state.ui.height = h;
        updateImageHud();
        persist(false);
      }
    });

    window.addEventListener("resize", () => {
      if (!mounted) return;
      if (state.ui.collapsed) applyBubblePosition();
      else if (!state.ui.hidden) {
        positionWindow(false);
        updateResponsiveHeader();
        updateImageHud();
      }
    });

    noteEl.addEventListener("pointerdown", (e) => {
      if (!e.target.closest("input,button,[contenteditable]")) noteEl.focus({ preventScroll: true });
    });
    if (frameEl) {
      const frameObserver = new MutationObserver(scheduleFrameClip);
      frameObserver.observe(noteEl, { attributes: true, attributeFilter: ["class", "style"] });
      frameObserver.observe(bubbleWrapEl, { attributes: true, attributeFilter: ["class", "style"] });
    }
    const headerResizeObserver = new ResizeObserver(() => {
      scheduleFrameClip();
      updateResponsiveHeader();
      updateCopyButtonOffset();
    });
    headerResizeObserver.observe(noteEl);
    refreshEditor();
    applyThemeAndLanguage();
    updateResponsiveHeader();
    applyVisibility({ forcePosition: true });
    updateCopyButtonOffset();
    scheduleFrameClip();
  }

  async function initialize() {
    try {
      await loadState();
    } catch (error) {
      console.warn("Floating Quick Note: could not read existing data; using defaults.", error);
      state = structuredClone(DEFAULT_STATE);
    }
    if (document.readyState === "loading") {
      await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }
    try {
      mount();
    } catch (error) {
      console.error("Floating Quick Note: UI initialization failed.", error);
    }
  }

  const initPromise = initialize();

  pageWindow.__FQN_CONTROLLER__ = {
    isAlive: () => isExtensionContextValid(),
    ensureMounted: () => {
      ensureMounted();
      applyVisibility();
    },
    showWindow: async () => {
      await initPromise;
      const wasVisibleBubble = Boolean(
        mounted &&
        ((bubbleWrapEl?.classList.contains("visible") && !noteEl?.classList.contains("visible")) ||
          currentMorphDirection === "expand")
      );
      if (!saveTimer && !composingTarget && dirtyNoteFields.size === 0) {
        await loadState().catch(() => {});
      }
      state.ui = state.ui || {};
      state.ui.hidden = false;
      state.ui.collapsed = false;
      state.ui.updatedAt = Date.now();
      ensureMounted();
      refreshEditor();
      applyThemeAndLanguage();
      if (!IS_STANDALONE && wasVisibleBubble) {
        await animateExpandFromBubble();
      } else {
        applyVisibility({ forcePosition: true });
      }
      persist(true);
      setTimeout(() => editor?.focus({ preventScroll: true }), 0);
    }
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isExtensionContextValid()) return;
    if (message?.type === "FQN_PING") {
      initPromise.then(() => {
        ensureMounted();
        sendResponse({ ok: true });
      });
      return true;
    }
    if (message?.type === "FQN_SHOW_WINDOW") {
      pageWindow.__FQN_CONTROLLER__
        .showWindow()
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
    if (message?.type === "FQN_NEW_NOTE") {
      initPromise.then(async () => {
        const wasVisibleBubble = Boolean(
          mounted &&
          ((bubbleWrapEl?.classList.contains("visible") && !noteEl?.classList.contains("visible")) ||
            currentMorphDirection === "expand")
        );
        state.ui.hidden = false;
        state.ui.collapsed = false;
        createNote();
        if (!IS_STANDALONE && wasVisibleBubble) {
          await animateExpandFromBubble();
        } else {
          applyVisibility({ forcePosition: true });
        }
        sendResponse({ ok: true });
      }).catch(() => sendResponse({ ok: false }));
      return true;
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (!isExtensionContextValid()) return;
    if (area !== "local" || !changes[STORAGE_KEY]?.newValue) return;
    const incoming = normalizeState(changes[STORAGE_KEY].newValue);
    if (incoming.meta?.lastWriter === INSTANCE_ID) return;
    if (composingTarget) {
      pendingExternalState = incoming;
      return;
    }
    applyExternalState(incoming);
  });

  function applyExternalState(incoming) {
    // A settings change or another tab's save can contain an older copy of the
    // note being typed. Merge local edited fields before refreshing the DOM so
    // neither the draft nor its native caret/undo state is replaced.
    const keepActiveNote = isEditingNote() || dirtyNoteFields.size > 0;
    let hasLocalChanges = false;
    for (const [id, fields] of dirtyNoteFields) {
      const local = state.notes.find((n) => n.id === id);
      if (!local) continue;
      const remote = incoming.notes.find((n) => n.id === id);
      if (!remote) {
        incoming.notes.push(structuredClone(local));
        hasLocalChanges = true;
        continue;
      }
      for (const field of fields) {
        if (remote[field] !== local[field]) hasLocalChanges = true;
        remote[field] = local[field];
      }
      remote.updatedAt = Math.max(remote.updatedAt, local.updatedAt);
      remote.history = [...new Map([...remote.history, ...local.history].map((h) => [h.id, h])).values()]
        .sort((a, b) => a.timestamp - b.timestamp).slice(-HISTORY_LIMIT);
    }
    if (keepActiveNote && incoming.notes.some((n) => n.id === state.activeNoteId)) {
      incoming.activeNoteId = state.activeNoteId;
    }

    // The settings popup now writes its own unique lastWriter id, so theme/language updates
    // reach every content script without forcing a tab to process its own typing saves.
    // Prevent any pending local timer in background tabs from overwriting fresher external state
    clearTimeout(saveTimer);
    saveTimer = null;
    clearTimeout(historyTimer);

    const prevHidden = state.ui?.hidden;
    const prevCollapsed = state.ui?.collapsed;
    const prevLanguage = state.settings?.language;
    const prevTheme = state.settings?.theme;
    applyingExternalState = true;
    state = incoming;
    if (mounted) {
      ensureMounted();
      refreshEditor();
      if (prevLanguage !== state.settings?.language || prevTheme !== state.settings?.theme) applyThemeAndLanguage();
      const visibilityChanged = prevHidden !== state.ui.hidden || prevCollapsed !== state.ui.collapsed;
      if (visibilityChanged) {
        const canAnimateMorph =
          !IS_STANDALONE &&
          document.visibilityState === "visible" &&
          !prevHidden &&
          !state.ui.hidden &&
          prevCollapsed !== state.ui.collapsed;
        if (canAnimateMorph) {
          closePanels();
          closeLightbox();
          clearSelectedImage();
          if (state.ui.collapsed) animateCollapseToBubble();
          else animateExpandFromBubble();
        } else {
          applyVisibility({ forcePosition: true });
        }
      } else if (!state.ui.hidden && state.ui.collapsed) {
        applyBubblePosition();
      }
      if (notesPanel.classList.contains("visible")) renderNotesPanel(searchInput.value);
      if (historyPanel.classList.contains("visible")) renderHistoryPanel();
      if (state.lastExternalAction?.at && Date.now() - state.lastExternalAction.at < 1800) {
        showToast(
          state.lastExternalAction.source?.toLowerCase().includes("image")
            ? tr("addedImage")
            : tr("added")
        );
      }
    }
    applyingExternalState = false;
    if (hasLocalChanges) {
      persist(false);
      scheduleHistory();
    }
  }
})(window, document);
