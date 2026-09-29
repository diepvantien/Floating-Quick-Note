const STORAGE_KEY = "floatingQuickNoteV3";
const POPUP_ID = `settings-${crypto.randomUUID?.() || Math.random().toString(16).slice(2)}`;
const SHORTCUT_DEFAULTS = {
  save:"Mod+S",search:"Mod+K",newNote:"Mod+Alt+N",copyNote:"Mod+Alt+C",history:"Mod+Alt+H",collapse:"Mod+Alt+M",nextNote:"Mod+Alt+ArrowDown",previousNote:"Mod+Alt+ArrowUp"
};
const THEMES = [
  {id:"paper",name:{en:"Paper",vi:"Giấy ấm"},desc:{en:"Warm & clean",vi:"Ấm và tối giản"},p:{panel:"#fdf9f0",header:"#f4ede0",accent:"#eba825",text:"#2e210b",muted:"#8c8270",line:"rgba(68,48,16,.11)"}},
  {id:"midnight",name:{en:"Midnight",vi:"Đêm sâu"},desc:{en:"Deep navy",vi:"Xanh đêm dịu"},p:{panel:"#181c26",header:"#212735",accent:"#8496ff",text:"#eef2fb",muted:"#8e9ab0",line:"rgba(255,255,255,.11)"}},
  {id:"ocean",name:{en:"Ocean",vi:"Đại dương"},desc:{en:"Cool & airy",vi:"Mát và thoáng"},p:{panel:"#eef9fe",header:"#e1f3fb",accent:"#259fd1",text:"#102f44",muted:"#5e7e92",line:"rgba(18,88,120,.13)"}},
  {id:"sakura",name:{en:"Sakura",vi:"Hoa anh đào"},desc:{en:"Soft rose",vi:"Hồng dịu nhẹ"},p:{panel:"#fef5f8",header:"#fbe9f0",accent:"#e4759f",text:"#492432",muted:"#966b7b",line:"rgba(128,50,78,.12)"}},
  {id:"forest",name:{en:"Forest",vi:"Rừng xanh"},desc:{en:"Natural green",vi:"Xanh tự nhiên"},p:{panel:"#eff6ee",header:"#e4efe2",accent:"#5c996b",text:"#203426",muted:"#6a7e70",line:"rgba(45,88,56,.13)"}},
  {id:"graphite",name:{en:"Graphite",vi:"Than chì"},desc:{en:"Neutral dark",vi:"Tối trung tính"},p:{panel:"#222226",header:"#2c2c31",accent:"#d4d4dc",text:"#f3f3f5",muted:"#9e9ea8",line:"rgba(255,255,255,.11)"}}
];
const TEXT = {
  en:{settingsTitle:"Floating Quick Note",settingsSubtitle:"Preferences",openNote:"Open note",newNote:"New note",appearance:"Appearance",shortcuts:"Shortcuts",data:"Data",theme:"Theme",themeHint:"Applied instantly to the floating note.",language:"Language",languageHint:"Interface language",quickShortcuts:"Quick shortcuts",shortcutHint:"Click a key combo, then press a replacement.",reset:"Reset",browserShortcuts:"Browser shortcuts",browserHint:"Global commands are managed by Chrome or Edge.",manage:"Manage",storage:"Extension memory",storageHint:"Notes, images, history and preferences are stored locally.",clearData:"Clear all extension data",confirmTitle:"Delete everything?",confirmClear:"This permanently removes notes, images, history and settings.",cancel:"Cancel",deleteAll:"Delete all",ready:"Ready",saved:"Saved",recording:"Press keys…",conflict:"That shortcut is already in use.",modifier:"Use Ctrl/Cmd or Alt to avoid typing conflicts.",cleared:"Extension data cleared.",authorLabel:"Author:",donateLabel:"Donate:",shortcut_save:"Save note",shortcut_search:"Search notes",shortcut_newNote:"New note",shortcut_copyNote:"Copy note",shortcut_history:"History",shortcut_collapse:"Collapse",shortcut_nextNote:"Next note",shortcut_previousNote:"Previous note"},
  vi:{settingsTitle:"Floating Quick Note",settingsSubtitle:"Tùy chỉnh",openNote:"Mở ghi chú",newNote:"Ghi chú mới",appearance:"Giao diện",shortcuts:"Phím tắt",data:"Dữ liệu",theme:"Chủ đề",themeHint:"Áp dụng ngay cho cửa sổ ghi chú nổi.",language:"Ngôn ngữ",languageHint:"Ngôn ngữ giao diện",quickShortcuts:"Phím tắt nhanh",shortcutHint:"Bấm tổ hợp rồi nhấn phím thay thế.",reset:"Đặt lại",browserShortcuts:"Phím tắt trình duyệt",browserHint:"Lệnh toàn trình duyệt do Chrome hoặc Edge quản lý.",manage:"Quản lý",storage:"Bộ nhớ extension",storageHint:"Ghi chú, ảnh, lịch sử và tùy chỉnh được lưu cục bộ.",clearData:"Xóa toàn bộ dữ liệu extension",confirmTitle:"Xóa tất cả?",confirmClear:"Thao tác này xóa vĩnh viễn ghi chú, ảnh, lịch sử và cài đặt.",cancel:"Hủy",deleteAll:"Xóa tất cả",ready:"Sẵn sàng",saved:"Đã lưu",recording:"Nhấn tổ hợp…",conflict:"Tổ hợp này đã được sử dụng.",modifier:"Hãy dùng Ctrl/Cmd hoặc Alt để tránh xung đột khi gõ.",cleared:"Đã xóa dữ liệu extension.",authorLabel:"Tác giả:",donateLabel:"Donate:",shortcut_save:"Lưu ghi chú",shortcut_search:"Tìm ghi chú",shortcut_newNote:"Ghi chú mới",shortcut_copyNote:"Sao chép ghi chú",shortcut_history:"Lịch sử",shortcut_collapse:"Thu gọn",shortcut_nextNote:"Ghi chú tiếp",shortcut_previousNote:"Ghi chú trước"}
};
const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator.platform||navigator.userAgent||"");
let state=null, language="en", recording=null, currentTab="appearance";
const $=s=>document.querySelector(s);
function t(k){return (TEXT[language]||TEXT.en)[k]||TEXT.en[k]||k}
function keyName(k){const m={ArrowUp:"↑",ArrowDown:"↓",ArrowLeft:"←",ArrowRight:"→",Slash:"/",Equal:"+",Minus:"−",Space:"Space"};return m[k]||k}
function shortcutParts(spec){return String(spec||"").split("+").filter(Boolean).map(p=>p==="Mod"?(IS_MAC?"Cmd":"Ctrl"):keyName(p))}
function shortcutHtml(spec){return shortcutParts(spec).map(x=>`<kbd>${x}</kbd>`).join("")}
function normalizeKey(key){const a={" ":"Space",Spacebar:"Space","/":"Slash","=":"Equal","+":"Equal","-":"Minus",Esc:"Escape",Up:"ArrowUp",Down:"ArrowDown",Left:"ArrowLeft",Right:"ArrowRight"};const n=a[key]||key;return n.length===1?n.toUpperCase():n}
function eventSpec(e){const key=normalizeKey(e.key);if(!key||["Control","Meta","Alt","Shift"].includes(key))return"";const p=[];if(IS_MAC?e.metaKey:e.ctrlKey)p.push("Mod");if(e.altKey)p.push("Alt");if(e.shiftKey)p.push("Shift");p.push(key);return p.join("+")}
function ensureState(raw){const s=raw&&Array.isArray(raw.notes)?raw:{notes:[],settings:{},ui:{}};s.settings=s.settings||{};s.settings.language=s.settings.language==="vi"?"vi":"en";s.settings.theme=THEMES.some(x=>x.id===s.settings.theme)?s.settings.theme:"paper";const existing=s.settings.shortcuts||{};s.settings.shortcuts=Object.fromEntries(Object.keys(SHORTCUT_DEFAULTS).map(k=>[k,existing[k]||SHORTCUT_DEFAULTS[k]]));s.meta=s.meta||{};return s}
async function save(){
  // Merge only settings into the freshest stored state so an open Settings popup can never
  // overwrite notes/history that changed in another tab while the popup was open.
  const latestRaw=(await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  const latest=ensureState(latestRaw||state);
  latest.settings={...latest.settings,...state.settings,shortcuts:{...SHORTCUT_DEFAULTS,...state.settings.shortcuts}};
  latest.meta={...(latest.meta||{}),lastWriter:POPUP_ID,settingsUpdatedAt:Date.now()};
  state=latest;
  await chrome.storage.local.set({[STORAGE_KEY]:latest});
  setStatus(t("saved"));
}
function setStatus(v){const el=$("#status");if(el)el.textContent=v}
function applyPopupTheme(){document.body.dataset.theme=state.settings.theme||"paper"}
function renderText(){document.documentElement.lang=language;document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));document.querySelectorAll("[data-tooltip]").forEach(el=>{const value=t(el.dataset.tooltip);el.title=value;el.setAttribute("aria-label",value)});renderThemes();renderShortcuts()}
function renderThemes(){const grid=$("#themeGrid");grid.innerHTML="";for(const th of THEMES){const b=document.createElement("button");b.type="button";b.className="theme-card"+(state.settings.theme===th.id?" selected":"");for(const [k,v] of Object.entries(th.p))b.style.setProperty(`--p-${k}`,v);b.innerHTML=`<div class="theme-preview"><div class="mini-header"></div><span class="mini-dot"></span><span class="mini-line"></span><span class="mini-accent"></span></div><strong>${th.name[language]}</strong><small>${th.desc[language]}</small>`;b.onclick=async()=>{state.settings.theme=th.id;applyPopupTheme();renderThemes();await save()};grid.appendChild(b)}}
function renderLanguage(){document.querySelectorAll(".lang-btn").forEach(b=>b.classList.toggle("selected",b.dataset.lang===language))}
function renderShortcuts(){const wrap=$("#shortcutList");wrap.innerHTML="";for(const action of Object.keys(SHORTCUT_DEFAULTS)){const spec=state.settings.shortcuts[action]||SHORTCUT_DEFAULTS[action];const row=document.createElement("div");row.className="shortcut-row";row.innerHTML=`<span>${t("shortcut_"+action)}</span><button class="shortcut-key${recording===action?" recording":""}" type="button" data-action="${action}">${recording===action?t("recording"):shortcutHtml(spec)}</button>`;wrap.appendChild(row)}wrap.querySelectorAll(".shortcut-key").forEach(b=>b.onclick=()=>{recording=b.dataset.action;renderShortcuts();setTimeout(()=>document.addEventListener("keydown",captureShortcut,true),0)})}
function captureShortcut(e){if(!recording||e.isComposing||e.keyCode===229||e.key==="Process"||e.key==="Dead"||e.getModifierState?.("AltGraph"))return;e.preventDefault();e.stopPropagation();if(e.key==="Escape"){recording=null;document.removeEventListener("keydown",captureShortcut,true);renderShortcuts();return}const spec=eventSpec(e);if(!spec)return;const parts=spec.split("+");if(!parts.includes("Mod")&&!parts.includes("Alt")){setStatus(t("modifier"));return}const conflict=Object.entries(state.settings.shortcuts).find(([a,v])=>a!==recording&&v===spec);if(conflict){setStatus(t("conflict"));return}state.settings.shortcuts[recording]=spec;recording=null;document.removeEventListener("keydown",captureShortcut,true);save().then(renderShortcuts)}
function showTab(name){currentTab=name;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("selected",b.dataset.tab===name));document.querySelectorAll(".tab-panel").forEach(p=>p.classList.toggle("active",p.dataset.panel===name))}
function setGlobalShortcutBadge(selector,value){const el=$(selector);if(!el)return;const raw=String(value||"").trim();const assigned=raw&&!/^(not\s*set|unassigned|none|—|-)$/.test(raw.toLowerCase());el.hidden=!assigned;if(assigned)el.textContent=raw.replace(/\+/g," + ")}
async function loadGlobal(){try{const r=await chrome.runtime.sendMessage({type:"FQN_GET_GLOBAL_SHORTCUTS"});if(r?.ok){setGlobalShortcutBadge("#globalOpen",r.commands["toggle-note"]);setGlobalShortcutBadge("#globalNew",r.commands["new-note"])}}catch{setGlobalShortcutBadge("#globalOpen","");setGlobalShortcutBadge("#globalNew","")}}
async function init(){const data=await chrome.storage.local.get(STORAGE_KEY);state=ensureState(data[STORAGE_KEY]);language=state.settings.language;applyPopupTheme();renderText();renderLanguage();showTab(currentTab);loadGlobal()}
$("#openNoteWide").onclick=()=>chrome.runtime.sendMessage({type:"FQN_SHOW_ACTIVE"}).finally(()=>window.close());
$("#newNote").onclick=()=>chrome.runtime.sendMessage({type:"FQN_NEW_NOTE_ACTIVE"}).finally(()=>window.close());
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
document.querySelectorAll(".lang-btn").forEach(b=>b.onclick=async()=>{language=b.dataset.lang;state.settings.language=language;await save();renderText();renderLanguage();chrome.runtime.sendMessage({type:"FQN_REFRESH_CONTEXT_MENUS"}).catch(()=>{})});
$("#resetShortcuts").onclick=async()=>{state.settings.shortcuts={...SHORTCUT_DEFAULTS};recording=null;await save();renderShortcuts()};
$("#browserShortcuts").onclick=()=>chrome.runtime.sendMessage({type:"FQN_OPEN_BROWSER_SHORTCUTS"});
$("#clearData").onclick=()=>{$("#confirmClear").hidden=false};
$("#cancelClear").onclick=()=>{$("#confirmClear").hidden=true};
$("#confirmClearBtn").onclick=async()=>{const r=await chrome.runtime.sendMessage({type:"FQN_CLEAR_STORAGE"});if(r?.ok){state=ensureState(r.state);language=state.settings.language;$("#confirmClear").hidden=true;applyPopupTheme();renderText();renderLanguage();showTab("appearance");setStatus(t("cleared"))}};
init().catch(()=>setStatus("Error"));
