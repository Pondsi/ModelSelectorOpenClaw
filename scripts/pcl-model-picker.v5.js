/*!
 * PCL Model Picker Enhancer v5
 * 作用：把 OpenClaw Control UI 聊天输入框的模型选择器（官方扁平分组列表）
 *       增强为「左列供应商导航 + 右列仅显示该供应商模型」的 master-detail 布局。
 *
 * v5 变更（修复「增强突然消失」的静默失效）：
 *  1) 窄屏阈值 520 → 340，且左列宽度改为 clamp(84px, 26%, 132px) 响应式。
 *     根因：高 DPI 缩放 / 窄窗口 / 分屏会让 innerWidth 掉到 520 以下，
 *     旧逻辑此时会静默 clearFilterState() 退回原生布局 —— 用户看到的就是
 *     「增强消失、恢复原样」，且没有任何提示。现在只有真正的极窄屏才回退。
 *  2) 状态可观测：<html data-pcl-model-picker="v5">、菜单 data-pcl-state
 *     = two-col / fallback-narrow / fallback-filter，window.pclModelPickerDiag()
 *     一行返回诊断结果 —— 以后「怎么又没了」可直接查，不再靠猜。
 *  3) 菜单查找加兜底：优先 picker 内查找，找不到则全文档查找（防官方改为
 *     顶层浮层 / portal 渲染后静默失效）。
 *  4) 文件名 v4→v5 + 注入 URL 追加内容指纹 ?h=<sha256前8位>（见 pcl-patch.ps1）：
 *     Control UI Service Worker 对 /assets/ 是 cache-first 且 HTTP 缓存
 *     immutable，同名改内容必然被旧缓存钉死（v4 就是这样踩的坑）。指纹让
 *     每次内容变更都是新的缓存键，浏览器立即取到新脚本。
 *
 * v4 变更：隐藏官方「此聊天使用的账户」账号控件（.chat-model-account）。
 * v3.1 变更：修复自激循环——所有 DOM 写操作先查状态，无变化则零写入。
 * v3 变更：CSS Grid 结构性双列 + 两列独立滚动 + 官方设计 token 主题跟随。
 *
 * 数据：完全跟随 openclaw.json 的 models/providers 配置。
 * 原理：纯运行时 DOM/CSS 增强，不修改 OpenClaw 任何打包代码。
 * 注入：由 index.html 中的 <script> 标签加载（见 pcl-patch.ps1）。
 */
(() => {
  'use strict';
  if (window.__PCL_MODEL_PICKER__) return;
  const VERSION = '5';
  window.__PCL_MODEL_PICKER__ = VERSION;

  const PICKER_SEL = 'details.chat-controls__inline-select.chat-controls__model-picker';
  const MENU_SEL = '.chat-controls__inline-select-menu.chat-controls__model-menu';
  const OPTIONS_SEL = '.chat-controls__model-options';
  const SECTION_SEL = '.chat-controls__provider-model-group';
  const RAIL_CLASS = 'pcl-rail';
  const RAIL_SEL = '.' + RAIL_CLASS;
  const ACTIVE_CLS = 'pcl-active-group';
  const FILTERED_CLS = 'pcl-filtered';
  const MIN_WIDTH = 340; // 仅真正的极窄屏才退回官方原生布局（旧值 520 会误伤窄窗口/高 DPI 缩放）

  const CSS = `
  /* ===== Grid 结构性双列：rail 与 options 平级，互不重叠、各自滚动 ===== */
  .chat-controls__model-menu.pcl-two-col {
    display: grid !important;
    /* 左列响应式：窄屏自动收窄，不再整块退回原生布局 */
    grid-template-columns: clamp(84px, 26%, 132px) minmax(0, 1fr) !important;
    grid-template-rows: auto auto minmax(0, 1fr) !important; /* 搜索 | 状态横幅(通常空) | 模型列表 */
    width: min(520px, calc(100vw - 24px)) !important;
  }
  /* 非 rail 的官方子元素全部归右列 */
  .chat-controls__model-menu.pcl-two-col > :not(${RAIL_SEL}) {
    grid-column: 2 !important;
    min-width: 0;
  }
  .chat-controls__model-menu.pcl-two-col > .chat-controls__model-search-wrap { grid-row: 1 !important; }
  .chat-controls__model-menu.pcl-two-col > .chat-controls__model-catalog-state { grid-row: 2 !important; }
  .chat-controls__model-menu.pcl-two-col > .chat-controls__model-options {
    grid-row: 3 !important;
    min-height: 0 !important;   /* 允许在 max-height 内收缩，滚动发生在自己内部 */
    max-height: none !important;
    overflow-y: auto !important; /* 内容超出才出滚动条；外观继承官方全局滚动条 */
    overscroll-behavior: contain;
  }
  /* 左列：跨全部行的独立滚动容器 */
  .chat-controls__model-menu.pcl-two-col > ${RAIL_SEL} {
    grid-column: 1 !important;
    grid-row: 1 / span 3 !important;
    min-height: 0;
    min-width: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    display: flex; flex-direction: column; gap: 2px;
    padding: 8px 5px 8px 7px;
    border-right: 1px solid color-mix(in srgb, var(--border) 62%, transparent);
  }
  /* ===== 芯片：完全使用官方设计 token（hover=官方 --bg-hover，激活=--accent 混色） ===== */
  .pcl-rail__chip {
    display: flex; align-items: center; gap: 7px;
    padding: 6px 8px; border-radius: var(--radius-sm, 6px);
    border: 1px solid transparent; background: transparent;
    color: var(--text, inherit); font: inherit; font-size: 12.5px; line-height: 1.3;
    cursor: pointer; text-align: left; width: 100%; min-width: 0;
    flex: none;
    transition: background var(--duration-fast, .12s) var(--ease-out, ease-out);
  }
  .pcl-rail__chip:hover { background: var(--bg-hover, rgba(128,128,128,.12)); border-color: transparent; }
  .pcl-rail__chip[data-pcl-active="true"] {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border-color: color-mix(in srgb, var(--accent) 38%, transparent);
    color: var(--text-strong, inherit);
    font-weight: 600;
  }
  .pcl-rail__chip span.pcl-rail__label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pcl-rail__chip .chat-controls__provider-icon { flex: none; }
  .pcl-rail__chip svg { width: 14px; height: 14px; flex: none; }
  .pcl-rail__chip--all { color: var(--muted, inherit); margin-bottom: 2px; }
  /* ===== 过滤态：class 控制显隐（官方 section 默认 grid，过滤期 contents） ===== */
  .chat-controls__model-menu.pcl-two-col.pcl-filtered .chat-controls__provider-model-group {
    display: none !important;
  }
  .chat-controls__model-menu.pcl-two-col.pcl-filtered .chat-controls__provider-model-group.pcl-active-group {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr);
  }
  /* ===== v4: 隐藏官方「此聊天使用的账户」账号控件（与供应商/模型选择无关） ===== */
  .chat-controls__model-menu > .chat-model-account {
    display: none !important;
  }
  `;

  let active = null;          // null = 全部；字符串 = 供应商 key
  let pendingAuto = false;    // 打开菜单时自动跟随当前选中模型的供应商
  let schedulePending = false;

  // 用 setTimeout 而非 rAF：后台标签页/无头环境 rAF 会被饿死，setTimeout 始终可靠
  function schedule() {
    if (schedulePending) return;
    schedulePending = true;
    setTimeout(() => { schedulePending = false; ensure(); }, 0);
  }

  // 菜单查找兜底：官方若把浮层改到顶层/portal 渲染，picker 内查不到时全文档查
  function resolveMenu(picker) {
    if (picker) {
      const inside = picker.querySelector(MENU_SEL);
      if (inside) return inside;
    }
    return document.querySelector(MENU_SEL);
  }

  function isVisible(el) {
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null;
  }

  function markState(menu, state) {
    if (menu && menu.dataset.pclState !== state) menu.dataset.pclState = state;
  }

  function sectionKey(sec) {
    const p = sec.getAttribute('data-chat-model-provider-group');
    return p != null ? p : 'target:' + (sec.getAttribute('data-chat-model-target-group') || '');
  }

  function sectionLabel(sec) {
    const lbl = sec.querySelector('.chat-controls__provider-label');
    if (lbl && lbl.textContent.trim()) return lbl.textContent.trim();
    const h = sec.querySelector('.chat-controls__provider-heading');
    if (h) {
      const t = h.textContent.trim();
      if (t) return t;
    }
    return sectionKey(sec);
  }

  function sectionIcon(sec) {
    const ic = sec.querySelector('.chat-controls__provider-icon');
    return ic ? ic.cloneNode(true) : null;
  }

  function chipSignature(sections) {
    return sections.map((s) => sectionKey(s)).join('|');
  }

  function syncChips(rail, sections) {
    const sig = chipSignature(sections);
    if (rail.__pclSig === sig) return;
    rail.__pclSig = sig;
    rail.textContent = '';
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'pcl-rail__chip pcl-rail__chip--all';
    all.dataset.pclKey = '';
    all.textContent = '全部';
    rail.appendChild(all);
    for (const sec of sections) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pcl-rail__chip';
      chip.dataset.pclKey = sectionKey(sec);
      chip.title = sectionLabel(sec);
      const icon = sectionIcon(sec);
      if (icon) chip.appendChild(icon);
      const label = document.createElement('span');
      label.className = 'pcl-rail__label';
      label.textContent = sectionLabel(sec);
      chip.appendChild(label);
      rail.appendChild(chip);
    }
    paintChips(rail);
  }

  function paintChips(rail) {
    for (const chip of rail.querySelectorAll('.pcl-rail__chip')) {
      const on = (chip.dataset.pclKey || '') === (active || '');
      if (chip.dataset.pclActive !== String(on)) chip.dataset.pclActive = String(on);
    }
  }

  // 过滤完全用 class 表达，不依赖 hidden 属性
  function applyFilter(menu, sections) {
    const filtered = active != null;
    // 门控：状态无变化不调用 toggle（Blink 对无变化的 add/remove 也会发记录）
    if (menu.classList.contains(FILTERED_CLS) !== filtered) {
      menu.classList.toggle(FILTERED_CLS, filtered);
    }
    for (const sec of sections) {
      const wantActive = filtered && sectionKey(sec) === active;
      if (wantActive !== sec.classList.contains(ACTIVE_CLS)) {
        sec.classList.toggle(ACTIVE_CLS, wantActive);
      }
      if (sec.hidden) sec.hidden = false; // 清理 v1 遗留
    }
  }

  function clearFilterState(menu, sections) {
    if (menu.classList.contains('pcl-two-col')) menu.classList.remove('pcl-two-col');
    if (menu.classList.contains(FILTERED_CLS)) menu.classList.remove(FILTERED_CLS);
    for (const sec of sections) {
      if (sec.classList.contains(ACTIVE_CLS)) sec.classList.remove(ACTIVE_CLS);
      if (sec.hidden) sec.hidden = false;
    }
  }

  function detectSelectedKey(sections) {
    for (const sec of sections) {
      if (sec.querySelector('[aria-selected="true"]')) return sectionKey(sec);
    }
    return null;
  }

  function onRailClick(event) {
    const chip = event.target.closest('.pcl-rail__chip');
    if (!chip) return;
    event.stopPropagation();
    const key = chip.dataset.pclKey || '';
    active = key === '' ? null : key;
    const menu = chip.closest(MENU_SEL);
    if (!menu) return;
    const options = menu.querySelector(OPTIONS_SEL);
    const sections = options ? [...options.querySelectorAll(':scope > ' + SECTION_SEL)] : [];
    paintChips(chip.parentElement);
    applyFilter(menu, sections);
    // 切换供应商 = 右列内容整体更换，滚动归零是预期行为，避免位置错乱
    if (options) options.scrollTop = 0;
  }

  function ensure() {
    const picker = document.querySelector(PICKER_SEL);
    const menu = resolveMenu(picker);
    if (!menu) return;
    if (picker && !picker.open && !isVisible(menu)) return;
    const options = menu.querySelector(OPTIONS_SEL);
    if (!options) return;
    const sections = [...options.querySelectorAll(':scope > ' + SECTION_SEL)];
    if (!sections.length) return;

    // 退回原生布局的两种情况：官方搜索过滤激活 / 极窄视口
    const tooNarrow = window.innerWidth < MIN_WIDTH;
    if (menu.hasAttribute('data-chat-model-filtering') || tooNarrow) {
      clearFilterState(menu, sections);
      markState(menu, tooNarrow ? 'fallback-narrow' : 'fallback-filter');
      const rail = menu.querySelector(':scope > ' + RAIL_SEL);
      if (rail && !rail.hidden) rail.hidden = true; // 门控：已隐藏则零写入
      return;
    }

    // rail 挂在 menu（grid 第 1 列）下，与 options（第 2 列）平级、互不嵌套
    let rail = menu.querySelector(':scope > ' + RAIL_SEL);
    if (!rail) {
      rail = document.createElement('div');
      rail.className = RAIL_CLASS;
      menu.insertBefore(rail, menu.firstChild);
      rail.addEventListener('click', onRailClick);
    }
    if (rail.hidden) rail.hidden = false; // 门控：已可见则零写入
    syncChips(rail, sections);
    if (pendingAuto) {
      pendingAuto = false;
      active = detectSelectedKey(sections);
    }
    if (!menu.classList.contains('pcl-two-col')) {
      menu.classList.add('pcl-two-col'); // 门控：已存在则零写入（防 observer 自激）
    }
    applyFilter(menu, sections);
    paintChips(rail);
    markState(menu, 'two-col');
  }

  // 样式注入（一次；重跑本脚本时替换旧内容，保证幂等）
  const oldStyle = document.getElementById('pcl-model-picker-style');
  if (oldStyle) oldStyle.remove();
  const style = document.createElement('style');
  style.id = 'pcl-model-picker-style';
  style.textContent = CSS;
  document.documentElement.appendChild(style);
  document.documentElement.dataset.pclModelPicker = 'v' + VERSION;

  // 一行诊断：控制台执行 window.pclModelPickerDiag() 即可看到状态与原因
  window.pclModelPickerDiag = function () {
    const picker = document.querySelector(PICKER_SEL);
    const menu = resolveMenu(picker);
    const options = menu ? menu.querySelector(OPTIONS_SEL) : null;
    return {
      version: VERSION,
      innerWidth: window.innerWidth,
      minWidth: MIN_WIDTH,
      pickerFound: !!picker,
      pickerOpen: picker ? picker.open : null,
      menuFound: !!menu,
      state: menu ? menu.dataset.pclState || null : null,
      filtering: menu ? menu.hasAttribute('data-chat-model-filtering') : null,
      sections: options ? options.querySelectorAll(':scope > ' + SECTION_SEL).length : 0,
      railFound: menu ? !!menu.querySelector(':scope > ' + RAIL_SEL) : false,
      chips: menu ? menu.querySelectorAll('.pcl-rail__chip').length : 0,
      twoCol: menu ? menu.classList.contains('pcl-two-col') : false
    };
  };

  // details 展开/收起：打开时自动跟随当前选中模型
  document.addEventListener(
    'toggle',
    (e) => {
      const t = e.target;
      if (t && t.matches && t.matches(PICKER_SEL)) {
        pendingAuto = (e.newState || 'open') === 'open';
        schedule();
      }
    },
    true,
  );

  // 搜索输入：立刻退回原生过滤（属性观察兜底）
  document.addEventListener(
    'input',
    (e) => {
      if (e.target && e.target.closest && e.target.closest('[data-chat-model-search]')) schedule();
    },
    true,
  );

  // 视口尺寸变化：窄屏退回原生，宽屏恢复两列
  window.addEventListener('resize', schedule);

  const mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['open', 'data-chat-model-filtering', 'class', 'hidden'],
  });
  schedule();
})();
