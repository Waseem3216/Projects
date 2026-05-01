/* Advanced retro desktop resume OS
   - Data-driven search index
   - Command palette
   - Draggable/resizable/maximizable windows
   - LocalStorage layout + theme persistence
   - Keyboard shortcuts and accessible modal controls
*/

(() => {
  'use strict';

  const STORAGE_KEY = 'waseemResumeDesktop.v3';
  const THEMES = ['classic', 'midnight', 'terminal'];
  const WINDOW_IDS = ['about', 'experience', 'education', 'projects', 'organizations', 'honors', 'skills', 'resume'];

  let zIndex = 100;
  const openWindows = new Set();
  const initialStyles = new Map();
  let resumeIndex = [];
  let commands = [];
  let commandActiveIndex = 0;
  let state = {
    theme: 'classic',
    windows: {},
    openWindows: [],
    selectedRole: 'entergy'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    loadState();
    captureInitialWindowStyles();
    applyTheme(state.theme || 'classic');
    initBootScreen();
    initProgramManager();
    initMenus();
    initWindows();
    initSearch();
    initCommands();
    initGlobalShortcuts();
    initActionButtons();
    updateClock();
    setInterval(updateClock, 1000);
    setInterval(updateNetworkBars, 800);
    buildResumeIndex();
    restoreSavedWindows();
    renderTaskStrip();
    toast('Resume desktop ready. Press Ctrl/⌘ + K for commands.');
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state = { ...state, ...saved, windows: saved.windows || {}, openWindows: saved.openWindows || [] };
    } catch {
      state = { theme: 'classic', windows: {}, openWindows: [], selectedRole: 'entergy' };
    }
  }

  function saveState() {
    WINDOW_IDS.forEach(id => {
      const win = getWindow(id);
      if (!win) return;
      state.windows[id] = {
        left: win.style.left,
        top: win.style.top,
        width: win.style.width,
        height: win.style.height,
        display: win.style.display,
        hidden: win.hidden,
        maximized: win.classList.contains('is-maximized')
      };
    });
    state.openWindows = Array.from(openWindows);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can fail in strict/private environments; the site still works without persistence.
    }
  }

  function captureInitialWindowStyles() {
    WINDOW_IDS.forEach(id => {
      const win = getWindow(id);
      if (win) initialStyles.set(id, win.getAttribute('style') || '');
    });
  }

  function restoreSavedWindows() {
    const savedWindows = state.windows || {};

    Object.entries(savedWindows).forEach(([id, saved]) => {
      const win = getWindow(id);
      if (!win || !saved) return;
      if (saved.left) win.style.left = saved.left;
      if (saved.top) win.style.top = saved.top;
      if (saved.width) win.style.width = saved.width;
      if (saved.height) win.style.height = saved.height;
      win.hidden = Boolean(saved.hidden);
      win.style.display = saved.display || (win.hidden ? 'none' : 'flex');
      win.classList.toggle('is-maximized', Boolean(saved.maximized));
      if (!win.hidden) openWindows.add(id);
    });

    if (state.selectedRole) showRole(state.selectedRole, { silent: true });
  }

  function initBootScreen() {
    const boot = $('#bootScreen');
    const skip = $('#skipBootBtn');
    const hideBoot = () => {
      if (!boot) return;
      boot.classList.add('is-hidden');
      window.setTimeout(() => boot.setAttribute('hidden', ''), 400);
    };

    if (skip) skip.addEventListener('click', hideBoot);
    window.setTimeout(hideBoot, 1550);
  }

  function initProgramManager() {
    const shell = $('#shell');
    const pmIcon = $('#pmDesktopIcon');
    const pmMinBtn = $('#pmMinBtn');
    const pmCloseBtn = $('#pmCloseBtn');

    if (shell) shell.style.display = 'flex';
    if (pmIcon) pmIcon.hidden = true;

    pmMinBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      iconizeProgramManager();
    });

    pmCloseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      iconizeProgramManager();
    });

    pmIcon?.addEventListener('dblclick', restoreProgramManager);
    pmIcon?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        restoreProgramManager();
      }
    });
  }

  function initMenus() {
    $$('.menuBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuId = `menu-${btn.dataset.menu}`;
        const menu = document.getElementById(menuId);
        const wasOpen = menu?.classList.contains('show');
        closeDropdowns();
        if (menu && !wasOpen) menu.classList.add('show');
      });
    });

    $$('[data-action="open"]').forEach(btn => {
      btn.addEventListener('click', () => openWindow(btn.dataset.target));
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-item')) closeDropdowns();
    });
  }

  function initWindows() {
    WINDOW_IDS.forEach(id => {
      const win = getWindow(id);
      if (!win) return;
      win.setAttribute('role', 'dialog');
      win.setAttribute('aria-label', getWindowTitle(win));
      win.addEventListener('pointerdown', () => bringToFront(win));
      enhanceWindowControls(id, win);
      makeDraggable(win);
      makeResizable(win);
    });
  }

  function enhanceWindowControls(id, win) {
    const buttonGroup = $('.winBtns', win);
    if (!buttonGroup || $('[data-window-action="maximize"]', buttonGroup)) return;

    const maxBtn = document.createElement('button');
    maxBtn.className = 'winBtn';
    maxBtn.type = 'button';
    maxBtn.textContent = '□';
    maxBtn.title = 'Maximize / Restore';
    maxBtn.setAttribute('aria-label', `Maximize or restore ${getWindowTitle(win)}`);
    maxBtn.dataset.windowAction = 'maximize';
    maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMaximize(id);
    });

    const closeButton = buttonGroup.lastElementChild;
    buttonGroup.insertBefore(maxBtn, closeButton || null);
  }

  function makeDraggable(win) {
    const titlebar = $('.titlebar', win);
    if (!titlebar || win.id === 'shell') return;

    titlebar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a')) return;
      if (win.classList.contains('is-maximized')) return;
      e.preventDefault();

      bringToFront(win);
      const rect = win.getBoundingClientRect();
      const shiftX = e.clientX - rect.left;
      const shiftY = e.clientY - rect.top;

      const move = (event) => {
        const maxLeft = Math.max(0, window.innerWidth - 80);
        const maxTop = Math.max(0, window.innerHeight - 60);
        const nextLeft = clamp(event.clientX - shiftX, 0, maxLeft);
        const nextTop = clamp(event.clientY - shiftY, 0, maxTop);
        win.style.left = `${nextLeft}px`;
        win.style.top = `${nextTop}px`;
      };

      const stop = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', stop);
        saveState();
      };

      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', stop, { once: true });
    });
  }

  function makeResizable(win) {
    if (win.id === 'shell' || $('.resizeHandle', win)) return;
    const handle = document.createElement('span');
    handle.className = 'resizeHandle';
    handle.setAttribute('aria-hidden', 'true');
    win.appendChild(handle);

    handle.addEventListener('pointerdown', (e) => {
      if (win.classList.contains('is-maximized')) return;
      e.preventDefault();
      e.stopPropagation();
      bringToFront(win);

      const rect = win.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = rect.width;
      const startHeight = rect.height;

      const move = (event) => {
        const width = clamp(startWidth + (event.clientX - startX), 280, window.innerWidth - rect.left - 8);
        const height = clamp(startHeight + (event.clientY - startY), 180, window.innerHeight - rect.top - 40);
        win.style.width = `${width}px`;
        win.style.height = `${height}px`;
      };

      const stop = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', stop);
        saveState();
      };

      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', stop, { once: true });
    });
  }

  function initSearch() {
    const quickSearch = $('#quickSearch');
    const quickSearchBtn = $('#quickSearchBtn');
    const globalSearchInput = $('#globalSearchInput');
    const clearSearchBtn = $('#clearSearchBtn');

    quickSearchBtn?.addEventListener('click', () => openSearch(quickSearch?.value || ''));
    quickSearch?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openSearch(quickSearch.value);
    });

    globalSearchInput?.addEventListener('input', () => renderSearchResults(globalSearchInput.value));
    clearSearchBtn?.addEventListener('click', () => {
      if (globalSearchInput) globalSearchInput.value = '';
      renderSearchResults('');
      globalSearchInput?.focus();
    });

    $$('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
  }

  function buildResumeIndex() {
    resumeIndex = WINDOW_IDS.map(id => {
      const win = getWindow(id);
      const title = win ? getWindowTitle(win) : id;
      const content = win ? normalizeText(win.innerText) : '';
      const preview = content.replace(title, '').slice(0, 260).trim();
      return { id, title, content, preview };
    });
  }

  function openSearch(query = '') {
    buildResumeIndex();
    openModal('searchPanel');
    const input = $('#globalSearchInput');
    if (input) {
      input.value = query;
      input.focus();
      input.select();
    }
    renderSearchResults(query);
  }

  function renderSearchResults(query) {
    const results = $('#searchResults');
    const meta = $('#searchMeta');
    if (!results) return;

    const q = normalizeText(query).toLowerCase();
    results.innerHTML = '';

    if (!q) {
      if (meta) meta.textContent = `${resumeIndex.length} sections indexed. Type a keyword to filter.`;
      resumeIndex.forEach(item => results.appendChild(createSearchResult(item, '')));
      return;
    }

    const terms = q.split(/\s+/).filter(Boolean);
    const matches = resumeIndex
      .map(item => ({ item, score: scoreItem(item.content.toLowerCase(), terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    if (meta) meta.textContent = `${matches.length} matching section${matches.length === 1 ? '' : 's'} for “${query}”.`;

    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'searchResult';
      empty.innerHTML = '<strong>No matching sections</strong><small>Try broader terms like automation, Power Platform, SQL, support, dashboards, or coursework.</small>';
      results.appendChild(empty);
      return;
    }

    matches.forEach(({ item }) => results.appendChild(createSearchResult(item, query)));
  }

  function createSearchResult(item, query) {
    const button = document.createElement('button');
    button.className = 'searchResult';
    button.type = 'button';
    button.setAttribute('role', 'listitem');
    button.innerHTML = `<strong>${escapeHtml(item.title)}</strong><small>${highlightText(makeSnippet(item.content, query), query)}</small>`;
    button.addEventListener('click', () => {
      closeModal('searchPanel');
      openWindow(item.id);
      toast(`Opened ${item.title}.`);
    });
    return button;
  }

  function initCommands() {
    commands = [
      ...WINDOW_IDS.map(id => ({
        id: `open-${id}`,
        label: `Open ${titleForId(id)}`,
        hint: `Show the ${titleForId(id)} resume window`,
        keywords: `${id} section resume window`,
        run: () => openWindow(id)
      })),
      { id: 'search', label: 'Search Resume', hint: 'Open indexed resume search', keywords: 'find lookup filter keyword', run: () => openSearch('') },
      { id: 'theme', label: 'Toggle Theme', hint: 'Cycle Classic, Midnight, and Terminal themes', keywords: 'dark color appearance', run: toggleTheme },
      { id: 'open-all', label: 'Open All Windows', hint: 'Display every resume section', keywords: 'show everything', run: openAllWindows },
      { id: 'minimize-all', label: 'Minimize All Windows', hint: 'Hide open windows to the task strip', keywords: 'hide taskbar', run: minimizeAllWindows },
      { id: 'reset-layout', label: 'Reset Layout', hint: 'Restore original window positions and theme', keywords: 'default clear storage', run: resetLayout },
      { id: 'print', label: 'Print / Save PDF', hint: 'Print the full resume view or save as PDF', keywords: 'download save pdf', run: () => window.print() },
      { id: 'copy-summary', label: 'Copy Profile Summary', hint: 'Copy a concise resume summary to clipboard', keywords: 'clipboard pitch intro', run: copyProfileSummary },
      { id: 'resume-pdf', label: 'Open Resume PDF', hint: 'Open the attached PDF resume in a new tab', keywords: 'download file document', run: () => window.open('Waseem_Sayyedahmad_resume.pdf', '_blank', 'noopener') }
    ];

    $('#commandPaletteBtn')?.addEventListener('click', openCommandPalette);
    $('#themeToggleBtn')?.addEventListener('click', toggleTheme);

    const input = $('#commandInput');
    input?.addEventListener('input', () => renderCommandList(input.value));
    input?.addEventListener('keydown', handleCommandKeys);
  }

  function openCommandPalette() {
    commandActiveIndex = 0;
    openModal('commandPalette');
    const input = $('#commandInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    renderCommandList('');
  }

  function renderCommandList(query) {
    const list = $('#commandList');
    if (!list) return;
    list.innerHTML = '';

    const q = normalizeText(query).toLowerCase();
    const filtered = commands.filter(cmd => {
      const haystack = `${cmd.label} ${cmd.hint} ${cmd.keywords}`.toLowerCase();
      return !q || q.split(/\s+/).every(term => haystack.includes(term));
    });

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'commandItem';
      empty.innerHTML = '<strong>No commands found</strong><small>Try “open”, “search”, “theme”, or “print”.</small>';
      list.appendChild(empty);
      return;
    }

    commandActiveIndex = clamp(commandActiveIndex, 0, filtered.length - 1);
    filtered.forEach((cmd, index) => {
      const button = document.createElement('button');
      button.className = `commandItem${index === commandActiveIndex ? ' is-active' : ''}`;
      button.type = 'button';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(index === commandActiveIndex));
      button.innerHTML = `<strong>${escapeHtml(cmd.label)}</strong><small>${escapeHtml(cmd.hint)}</small>`;
      button.addEventListener('mouseenter', () => {
        commandActiveIndex = index;
        renderCommandList($('#commandInput')?.value || '');
      });
      button.addEventListener('click', () => runCommand(cmd));
      list.appendChild(button);
    });

    list.dataset.commandIds = JSON.stringify(filtered.map(cmd => cmd.id));
  }

  function handleCommandKeys(e) {
    const ids = JSON.parse($('#commandList')?.dataset.commandIds || '[]');
    if (!ids.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      commandActiveIndex = (commandActiveIndex + 1) % ids.length;
      renderCommandList(e.currentTarget.value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      commandActiveIndex = (commandActiveIndex - 1 + ids.length) % ids.length;
      renderCommandList(e.currentTarget.value);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = commands.find(item => item.id === ids[commandActiveIndex]);
      if (cmd) runCommand(cmd);
    }
  }

  function runCommand(cmd) {
    closeModal('commandPalette');
    cmd.run();
    if (!cmd.label.startsWith('Open Resume PDF')) toast(cmd.label);
  }

  function initGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      const isTyping = target?.matches?.('input, textarea, select, [contenteditable="true"]');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      if (!isTyping && e.key === '/') {
        e.preventDefault();
        openSearch('');
        return;
      }

      if (e.key === 'Escape') {
        if (closeTopModal()) return;
        closeDropdowns();
      }
    });
  }

  function initActionButtons() {
    document.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-app-action]');
      if (!actionEl) return;
      const action = actionEl.dataset.appAction;
      closeDropdowns();
      performAction(action);
    });
  }

  function performAction(action) {
    const actions = {
      search: () => openSearch(''),
      palette: openCommandPalette,
      theme: toggleTheme,
      'open-all': openAllWindows,
      'minimize-all': minimizeAllWindows,
      'reset-layout': resetLayout,
      print: () => window.print(),
      'copy-summary': copyProfileSummary
    };
    actions[action]?.();
  }

  function iconizeProgramManager() {
    const shell = $('#shell');
    const pmIcon = $('#pmDesktopIcon');
    if (shell) shell.style.display = 'none';
    if (pmIcon) pmIcon.hidden = false;
    closeDropdowns();
    toast('Program Manager minimized to desktop.');
  }

  function restoreProgramManager() {
    const shell = $('#shell');
    const pmIcon = $('#pmDesktopIcon');
    if (shell) shell.style.display = 'flex';
    if (pmIcon) pmIcon.hidden = true;
    closeDropdowns();
    toast('Program Manager restored.');
  }

  function openWindow(id) {
    const win = getWindow(id);
    if (!win) return;
    win.hidden = false;
    win.style.display = 'flex';
    openWindows.add(id);
    bringToFront(win);
    renderTaskStrip();
    closeDropdowns();
    saveState();
  }

  function hideWindow(id) {
    const win = getWindow(id);
    if (!win) return;
    win.style.display = 'none';
    renderTaskStrip();
    saveState();
  }

  function closeWindow(id) {
    const win = getWindow(id);
    if (!win) return;
    win.hidden = true;
    win.style.display = 'none';
    win.classList.remove('is-maximized');
    openWindows.delete(id);
    renderTaskStrip();
    saveState();
  }

  function toggleWindow(id) {
    const win = getWindow(id);
    if (!win) return;

    if (win.hidden) {
      openWindow(id);
      return;
    }

    if (win.style.display === 'none') {
      win.style.display = 'flex';
      bringToFront(win);
    } else {
      const currentZ = Number.parseInt(win.style.zIndex || '0', 10);
      if (currentZ >= zIndex) hideWindow(id);
      else bringToFront(win);
    }

    renderTaskStrip();
    saveState();
  }

  function toggleMaximize(id) {
    const win = getWindow(id);
    if (!win) return;
    win.classList.toggle('is-maximized');
    bringToFront(win);
    saveState();
  }

  function openAllWindows() {
    WINDOW_IDS.forEach(openWindow);
    toast('All resume windows opened.');
  }

  function minimizeAllWindows() {
    WINDOW_IDS.forEach(id => {
      const win = getWindow(id);
      if (win && !win.hidden) win.style.display = 'none';
    });
    renderTaskStrip();
    saveState();
    toast('All open windows minimized.');
  }

  function resetLayout() {
    localStorage.removeItem(STORAGE_KEY);
    state = { theme: 'classic', windows: {}, openWindows: [], selectedRole: 'entergy' };
    applyTheme('classic');
    WINDOW_IDS.forEach(id => {
      const win = getWindow(id);
      if (!win) return;
      win.setAttribute('style', initialStyles.get(id) || '');
      win.hidden = true;
      win.style.display = 'none';
      win.classList.remove('is-maximized');
      openWindows.delete(id);
    });
    renderTaskStrip();
    toast('Layout reset to defaults.');
  }

  function bringToFront(win) {
    zIndex += 1;
    win.style.zIndex = String(zIndex);
  }

  function renderTaskStrip() {
    const strip = $('#taskStrip');
    if (!strip) return;
    strip.innerHTML = '';

    openWindows.forEach(id => {
      const win = getWindow(id);
      if (!win) return;
      const btn = document.createElement('button');
      const visible = win.style.display !== 'none' && !win.hidden;
      btn.className = `task-btn${visible ? ' active' : ''}`;
      btn.type = 'button';
      btn.title = `${visible ? 'Minimize' : 'Restore'} ${getWindowTitle(win)}`;
      btn.innerHTML = `<span class="task-title">${escapeHtml(getWindowTitle(win))}</span><span class="task-state">${visible ? 'ON' : 'MIN'}</span>`;
      btn.addEventListener('click', () => toggleWindow(id));
      strip.appendChild(btn);
    });
  }

  function showRole(roleId, options = {}) {
    $$('.listItem[data-role]').forEach(el => {
      el.classList.toggle('isSelected', el.dataset.role === roleId);
    });

    $$('.role-content').forEach(el => { el.hidden = true; });

    const panel = document.getElementById(`role-${roleId}`);
    if (panel) panel.hidden = false;

    state.selectedRole = roleId;
    if (!options.silent) saveState();
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }

  function closeTopModal() {
    const openModals = $$('.modalLayer:not([hidden])');
    const top = openModals.at(-1);
    if (!top) return false;
    closeModal(top.id);
    return true;
  }

  function closeDropdowns() {
    $$('.dropdown').forEach(d => d.classList.remove('show'));
  }

  function toggleTheme() {
    const current = THEMES.includes(state.theme) ? state.theme : 'classic';
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    applyTheme(next);
    saveState();
    toast(`Theme: ${capitalize(next)}.`);
  }

  function applyTheme(theme) {
    state.theme = THEMES.includes(theme) ? theme : 'classic';
    document.body.dataset.theme = state.theme;
  }

  function updateNetworkBars() {
    $$('.net-bar').forEach(bar => {
      bar.style.height = `${Math.floor(Math.random() * 80) + 10}%`;
    });
  }

  function updateClock() {
    const now = new Date();
    const time = $('#clockTime');
    const date = $('#clockDate');
    if (time) time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (date) date.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function copyProfileSummary() {
    const summary = [
      'Waseem Sayyedahmad',
      'Computer Information Systems student at the University of Houston with a Business Administration minor and 3.70 GPA.',
      'Experience: Compliance & Systems Support Analyst Intern at Entergy, IT RPA Analyst Intern at Oceaneering, and IT HelpDesk/Desktop Support at UH NSMIT.',
      'Strengths: enterprise administration, automation, dashboards, identity/access support, cloud/platform tools, ITSM, scripting, networking, and user-centered systems support.',
      'Projects: UiPath item description/file download automation and NSMIT 3D Printing Inventory App.',
      'Contact: waseem.sayyedahmad@gmail.com | linkedin.com/in/waseemsayyedahmad | github.com/Waseem3216/Projects'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    toast('Profile summary copied to clipboard.');
  }

  function toast(message) {
    const region = $('#toastRegion');
    if (!region) return;
    const note = document.createElement('div');
    note.className = 'toast';
    note.textContent = message;
    region.appendChild(note);
    window.setTimeout(() => {
      note.style.opacity = '0';
      note.style.transition = 'opacity .25s ease';
      window.setTimeout(() => note.remove(), 260);
    }, 2400);
  }

  function getWindow(id) {
    return document.getElementById(`win-${id}`);
  }

  function titleForId(id) {
    const win = getWindow(id);
    return win ? getWindowTitle(win) : capitalize(id);
  }

  function getWindowTitle(win) {
    return normalizeText($('.titlebar__left', win)?.textContent || win.id.replace('win-', ''));
  }

  function scoreItem(content, terms) {
    return terms.reduce((score, term) => {
      if (!content.includes(term)) return score;
      const exactMatches = content.split(term).length - 1;
      return score + exactMatches + (content.startsWith(term) ? 2 : 0);
    }, 0);
  }

  function makeSnippet(content, query) {
    const text = normalizeText(content);
    const q = normalizeText(query).toLowerCase();
    if (!q) return text.slice(0, 180) + (text.length > 180 ? '...' : '');

    const firstTerm = q.split(/\s+/).find(Boolean) || q;
    const index = text.toLowerCase().indexOf(firstTerm);
    if (index < 0) return text.slice(0, 180) + (text.length > 180 ? '...' : '');
    const start = Math.max(0, index - 70);
    const end = Math.min(text.length, index + 160);
    return `${start > 0 ? '...' : ''}${text.slice(start, end)}${end < text.length ? '...' : ''}`;
  }

  function highlightText(text, query) {
    const safe = escapeHtml(text);
    const terms = normalizeText(query).split(/\s+/).filter(Boolean).map(escapeRegExp);
    if (!terms.length) return safe;
    const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
    return safe.replace(pattern, '<mark>$1</mark>');
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[char]));
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function capitalize(value) {
    return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
  }

  // Expose only the functions required by inline HTML handlers.
  window.openWindow = openWindow;
  window.hideWindow = hideWindow;
  window.closeWindow = closeWindow;
  window.toggleWindow = toggleWindow;
  window.showRole = showRole;
  window.restoreProgramManager = restoreProgramManager;
})();
