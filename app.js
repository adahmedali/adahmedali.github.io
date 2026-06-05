'use strict';

/* ── Motivational quotes ──────────────────────────────────── */
const QUOTES = [
  { text: "Nous sommes ce que nous faisons de manière répétée. L'excellence est donc une habitude, non un acte isolé.", author: "Aristote" },
  { text: "La discipline est le pont entre les objectifs et les accomplissements.", author: "Jim Rohn" },
  { text: "Un voyage de mille lieues commence toujours par un premier pas.", author: "Lao Tseu" },
  { text: "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas. C'est parce que nous n'osons pas qu'elles sont difficiles.", author: "Sénèque" },
  { text: "La plus grande gloire n'est pas de ne jamais tomber, mais de se relever à chaque chute.", author: "Nelson Mandela" },
  { text: "Le seul moyen de faire du bon travail est d'aimer ce que vous faites.", author: "Steve Jobs" },
  { text: "L'avenir appartient à ceux qui croient à la beauté de leurs rêves.", author: "Eleanor Roosevelt" },
  { text: "Commence là où tu es, utilise ce que tu as, fais ce que tu peux.", author: "Arthur Ashe" },
  { text: "La force ne vient pas des capacités physiques. Elle vient d'une volonté indomptable.", author: "Mahatma Gandhi" },
  { text: "Prends soin de ton corps. C'est le seul endroit où tu auras toujours à vivre.", author: "Jim Rohn" },
  { text: "Les habitudes sont les intérêts composés de l'amélioration de soi.", author: "James Clear — Atomic Habits" },
  { text: "Un 1% d'amélioration chaque jour mène à des résultats 37 fois meilleurs en un an.", author: "James Clear — Atomic Habits" },
  { text: "Le corps atteint ce que l'esprit croit.", author: "Napoleon Hill" },
  { text: "Ce que tu fais chaque jour importe plus que ce que tu fais de temps en temps.", author: "Gretchen Rubin" },
  { text: "La santé n'est pas tout, mais sans la santé, tout n'est rien.", author: "Arthur Schopenhauer" },
  { text: "Votre avenir est créé par ce que vous faites aujourd'hui, pas demain.", author: "Robert Kiyosaki" },
  { text: "La motivation te fait démarrer. La discipline te fait continuer.", author: "Jim Ryun" },
  { text: "Le succès n'est pas final, l'échec n'est pas fatal. C'est le courage de continuer qui compte.", author: "Winston Churchill" },
  { text: "Le meilleur moment pour agir était hier. Le deuxième meilleur moment, c'est maintenant.", author: "Proverbe chinois" },
  { text: "Tout d'abord, tu formes tes habitudes. Ensuite, tes habitudes te forment.", author: "John Dryden" },
  { text: "Ne cherche pas à être meilleur que les autres. Cherche à être meilleur que tu ne l'étais hier.", author: "Jigoro Kano" },
  { text: "Tu n'as pas à être parfait pour commencer. Mais il faut commencer pour être parfait.", author: "Zig Ziglar" },
  { text: "La constance bat le talent quand le talent n'est pas constant.", author: "Tim Notke" },
  { text: "Le changement est difficile au début, chaotique au milieu, magnifique à la fin.", author: "Robin Sharma" },
  { text: "Fais de chaque jour ton chef-d'œuvre.", author: "John Wooden" },
  { text: "L'identité émerge de l'habitude. Chaque action est un vote pour la personne que tu veux devenir.", author: "James Clear — Atomic Habits" },
  { text: "La santé est le premier devoir de la vie.", author: "Oscar Wilde" },
  { text: "Ce n'est pas la montagne que nous conquérons, mais nous-mêmes.", author: "Sir Edmund Hillary" },
];

/* ── Emojis & Colors ──────────────────────────────────────── */
const EMOJIS = ['🧘','🏃','📚','💪','🥗','💧','🎯','✍️','🌿','😴','🎨','🎵','🧠','🦷','🚴','🏋️','🌅','🍎','🧘‍♀️','⚡','🔥','✨','🎉','💡'];
const COLORS = ['#7c6af7','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#a3e635','#fb7185'];

/* ── Utilities ────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

function last30Days() {
  return Array.from({ length: 30 }, (_, i) => daysAgo(29 - i));
}

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
}

function frenchDate(ds) {
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function frenchDay(ds) {
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short' });
}

/* ── State & Persistence ──────────────────────────────────── */
let state = { habits: [], theme: 'dark' };

function load() {
  try {
    const raw = localStorage.getItem('habitflow_v2');
    if (raw) state = JSON.parse(raw);
  } catch (_) {}
  if (!Array.isArray(state.habits)) state.habits = [];
  state.habits.forEach(h => {
    if (!h.id)                             h.id = uid();
    if (!Array.isArray(h.completions))     h.completions = [];
    if (!h.color)                          h.color = COLORS[0];
    if (!h.emoji)                          h.emoji = '⚡';
    if (!h.freq)                           h.freq = 7;
    if (!Array.isArray(h.subtasks))        h.subtasks = [];
    if (typeof h.subtaskCompletions !== 'object' || !h.subtaskCompletions)
                                           h.subtaskCompletions = {};
  });
}

function save() {
  localStorage.setItem('habitflow_v2', JSON.stringify(state));
}

/* ── Habit helpers ────────────────────────────────────────── */
function isDone(habit, date) {
  if (!habit.subtasks?.length) return habit.completions.includes(date);
  const done = habit.subtaskCompletions?.[date] ?? [];
  return habit.subtasks.every(st => done.includes(st.id));
}

function toggle(habit, date) {
  if (!habit.subtasks?.length) {
    const i = habit.completions.indexOf(date);
    if (i >= 0) habit.completions.splice(i, 1);
    else habit.completions.push(date);
  } else {
    if (!habit.subtaskCompletions) habit.subtaskCompletions = {};
    if (isDone(habit, date)) {
      delete habit.subtaskCompletions[date];
      const i = habit.completions.indexOf(date);
      if (i >= 0) habit.completions.splice(i, 1);
    } else {
      habit.subtaskCompletions[date] = habit.subtasks.map(st => st.id);
      if (!habit.completions.includes(date)) habit.completions.push(date);
    }
  }
  save();
}

function toggleSubtask(habit, date, subtaskId) {
  if (!habit.subtaskCompletions) habit.subtaskCompletions = {};
  if (!habit.subtaskCompletions[date]) habit.subtaskCompletions[date] = [];
  const idx = habit.subtaskCompletions[date].indexOf(subtaskId);
  if (idx >= 0) habit.subtaskCompletions[date].splice(idx, 1);
  else          habit.subtaskCompletions[date].push(subtaskId);
  // keep main completions in sync
  const allDone = habit.subtasks.every(st => habit.subtaskCompletions[date].includes(st.id));
  const ci = habit.completions.indexOf(date);
  if (allDone && ci < 0) habit.completions.push(date);
  if (!allDone && ci >= 0) habit.completions.splice(ci, 1);
  save();
}

function streak(habit) {
  let count = 0, d = new Date();
  if (!isDone(habit, dateStr(d))) d.setDate(d.getDate() - 1);
  while (isDone(habit, dateStr(d))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}

function bestStreak(habit) {
  if (!habit.completions.length) return 0;
  const sorted = [...habit.completions].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i] + 'T12:00:00') - new Date(sorted[i-1] + 'T12:00:00')) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); } else cur = 1;
  }
  return best;
}

function completionRate(habit, days) {
  const dates = last7Days().slice(-days);
  if (!dates.length) return 0;
  return Math.round(dates.filter(d => isDone(habit, d)).length / dates.length * 100);
}

function totalCompletions() {
  return state.habits.reduce((s, h) => s + h.completions.length, 0);
}

function globalStreak() {
  if (!state.habits.length) return 0;
  let count = 0, d = new Date();
  const check = ds => state.habits.every(h => isDone(h, ds));
  if (!check(dateStr(d))) d.setDate(d.getDate() - 1);
  while (check(dateStr(d))) { count++; d.setDate(d.getDate() - 1); if (count > 365) break; }
  return count;
}

function todayPct() {
  if (!state.habits.length) return 0;
  return Math.round(state.habits.filter(h => isDone(h, today())).length / state.habits.length * 100);
}

/* ── Ring ─────────────────────────────────────────────────── */
function updateRing() {
  const pct = todayPct();
  const fg = $('ringFg');
  if (fg) {
    fg.style.strokeDashoffset = 150.8 - (pct / 100) * 150.8;
    fg.style.stroke = pct >= 100 ? '#22c55e' : '#7c6af7';
  }
  const lbl = $('ringLabel');
  if (lbl) lbl.textContent = pct + '%';
}

/* ── Today View ───────────────────────────────────────────── */
let draggedId = null;

function renderSubtaskList(habit, date) {
  const doneSts = habit.subtaskCompletions?.[date] ?? [];
  return `<div class="subtask-list">${
    habit.subtasks.map(st => {
      const done = doneSts.includes(st.id);
      return `<div class="subtask-item${done ? ' done' : ''}" data-st-id="${st.id}">
        <span class="subtask-check"></span>
        <span class="subtask-label">${st.label}</span>
      </div>`;
    }).join('')
  }</div>`;
}

function renderToday() {
  const todayStr = today();
  $('todayDate').textContent = frenchDate(todayStr);
  const h = new Date().getHours();
  $('todayTitle').textContent = h < 6 ? 'Bonne nuit 🌙' : h < 12 ? 'Bonjour 👋' : h < 18 ? 'Bon après-midi ☀️' : 'Bonne soirée 🌆';

  updateRing();

  const gs = globalStreak();
  const sb = $('streakBanner');
  if (gs >= 2) {
    sb.classList.add('visible');
    sb.innerHTML = `🔥 Série en cours : <span>${gs} jours</span> consécutifs avec toutes les habitudes complétées !`;
  } else {
    sb.classList.remove('visible');
  }

  const list  = $('habitListToday');
  const empty = $('emptyToday');
  list.querySelectorAll('.habit-item').forEach(el => el.remove());

  if (!state.habits.length) {
    empty.style.display = '';
  } else {
    empty.style.display = 'none';
    state.habits.forEach(h => {
      const done        = isDone(h, todayStr);
      const s           = streak(h);
      const hasSub      = h.subtasks?.length > 0;
      const subDone     = hasSub ? (h.subtaskCompletions?.[todayStr] ?? []).length : 0;
      const subTotal    = hasSub ? h.subtasks.length : 0;
      const checkInner  = hasSub
        ? `<span class="sub-progress${done ? ' all-done' : ''}">${subDone}/${subTotal}</span>`
        : (done ? '✓' : '');

      const item = document.createElement('div');
      item.className = 'habit-item' + (done ? ' done' : '');
      item.dataset.id = h.id;
      item.style.setProperty('--habit-color', h.color);

      item.innerHTML = `
        <span class="drag-handle" title="Glisser pour réordonner">⠿</span>
        <span class="habit-emoji">${h.emoji}</span>
        <div class="habit-check">${checkInner}</div>
        <div class="habit-info">
          <div class="habit-name">${h.name}</div>
          ${h.desc ? `<div class="habit-desc">${h.desc}</div>` : ''}
          ${hasSub ? renderSubtaskList(h, todayStr) : ''}
        </div>
        ${s >= 2 ? `<span class="habit-streak-badge">🔥 ${s}j</span>` : ''}
      `;

      /* ── drag-and-drop (initié depuis la poignée seulement) ── */
      const handle = item.querySelector('.drag-handle');
      handle.addEventListener('mousedown', () => { item.draggable = true; });
      handle.addEventListener('mouseup',   () => { item.draggable = false; });

      item.addEventListener('dragstart', e => {
        draggedId = h.id;
        e.dataTransfer.effectAllowed = 'move';
        requestAnimationFrame(() => item.classList.add('dragging'));
      });
      item.addEventListener('dragend', () => {
        item.draggable = false;
        draggedId = null;
        item.classList.remove('dragging');
        list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        if (h.id === draggedId) return;
        list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        item.classList.add('drag-over');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        if (!draggedId || h.id === draggedId) return;
        const fi = state.habits.findIndex(x => x.id === draggedId);
        const ti = state.habits.findIndex(x => x.id === h.id);
        if (fi < 0 || ti < 0) return;
        const [moved] = state.habits.splice(fi, 1);
        state.habits.splice(ti, 0, moved);
        save();
        renderToday();
      });

      /* ── sous-tâches ── */
      item.querySelectorAll('.subtask-item').forEach(stEl => {
        stEl.addEventListener('click', e => {
          e.stopPropagation();
          toggleSubtask(h, todayStr, stEl.dataset.stId);
          renderToday();
          renderQuickStats();
          const stNowDone = (h.subtaskCompletions?.[todayStr] ?? []).includes(stEl.dataset.stId);
          showToast(stNowDone ? '✅ Sous-tâche validée !' : '↩️ Sous-tâche décochée');
        });
      });

      /* ── clic principal ── */
      item.addEventListener('click', e => {
        if (e.target.closest('.subtask-item')) return;
        if (e.target.closest('.drag-handle'))  return;
        toggle(h, todayStr);
        renderToday();
        renderQuickStats();
        showToast(isDone(h, todayStr) ? `✅ "${h.name}" complétée !` : `↩️ "${h.name}" décochée`);
      });

      list.appendChild(item);
    });
  }

  renderQuickStats();
}

function renderQuickStats() {
  const todayStr = today();
  const done  = state.habits.filter(h => isDone(h, todayStr)).length;
  const total = state.habits.length;
  const gs    = globalStreak();
  const best  = state.habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);
  const tc    = totalCompletions();

  $('quickStats').innerHTML = [
    ['☀️', `${done}/${total}`, "Aujourd'hui"],
    ['🔥', gs,   'Série globale'],
    ['🏆', best, 'Meilleure série'],
    ['✅', tc,   'Total coché'],
  ].map(([icon, val, lbl]) => `
    <div class="qs-card">
      <div style="font-size:1.4rem">${icon}</div>
      <div class="qs-value">${val}</div>
      <div class="qs-label">${lbl}</div>
    </div>
  `).join('');
}

/* ── Motivation ───────────────────────────────────────────── */
let quoteIdx = Math.floor(Math.random() * QUOTES.length);

function renderQuote() {
  const q = QUOTES[quoteIdx];
  $('motivationText').textContent   = `« ${q.text} »`;
  $('motivationAuthor').textContent = `— ${q.author}`;
}

$('refreshQuote').addEventListener('click', () => {
  let next;
  do { next = Math.floor(Math.random() * QUOTES.length); }
  while (next === quoteIdx && QUOTES.length > 1);
  quoteIdx = next;
  renderQuote();
});

/* ── Dashboard ────────────────────────────────────────────── */
let chartWeek, chartDoughnut, chartMonth;

function renderDashboard() {
  renderStatsGrid();
  renderCharts();
  renderRanking();
}

function renderStatsGrid() {
  const days7    = last7Days();
  const todayStr = today();
  const doneToday = state.habits.filter(h => isDone(h, todayStr)).length;
  const totalH   = state.habits.length;
  const gs       = globalStreak();
  const bestS    = state.habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);
  const tc       = totalCompletions();
  const pct7     = totalH
    ? Math.round(days7.reduce((s, d) => s + state.habits.filter(h => isDone(h, d)).length, 0) / (7 * totalH) * 100)
    : 0;

  $('statsGrid').innerHTML = [
    { icon: '☀️', color: 'rgba(124,106,247,.15)', val: `${doneToday}/${totalH}`, label: "Habitudes aujourd'hui", sub: todayPct() + '% complétées' },
    { icon: '🔥', color: 'rgba(245,158,11,.15)',  val: gs,      label: 'Série globale (jours)', sub: gs >= 7 ? '🏆 Impressionnant !' : 'Continue comme ça !' },
    { icon: '🏆', color: 'rgba(34,197,94,.15)',   val: bestS,   label: 'Meilleure série', sub: 'Tous temps' },
    { icon: '📊', color: 'rgba(59,130,246,.15)',  val: pct7+'%',label: 'Taux 7 jours', sub: `${tc} complétions totales` },
  ].map(c => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${c.color}">${c.icon}</div>
      <div class="stat-info">
        <div class="stat-value">${c.val}</div>
        <div class="stat-label">${c.label}</div>
        <div class="stat-sub">${c.sub}</div>
      </div>
    </div>
  `).join('');
}

function chartColors() {
  const isDark = state.theme === 'dark';
  return {
    grid: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
    text: isDark ? '#8892b0' : '#6b7280',
  };
}

function renderCharts() {
  const { grid, text } = chartColors();
  const days7  = last7Days();
  const days30 = last30Days();

  const weekData   = days7.map(d => state.habits.length ? Math.round(state.habits.filter(h => isDone(h, d)).length / state.habits.length * 100) : 0);
  const weekLabels = days7.map(d => frenchDay(d));

  if (chartWeek) chartWeek.destroy();
  chartWeek = new Chart($('chartWeek'), {
    type: 'bar',
    data: {
      labels: weekLabels,
      datasets: [{ label: 'Complétion %', data: weekData,
        backgroundColor: weekData.map(v => v >= 100 ? '#22c55e' : v >= 50 ? '#7c6af7' : '#5e4bd8'),
        borderRadius: 8, borderSkipped: false }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, grid: { color: grid }, ticks: { color: text, callback: v => v + '%' } },
        x: { grid: { display: false }, ticks: { color: text } },
      },
    },
  });

  if (chartDoughnut) chartDoughnut.destroy();
  if (state.habits.length) {
    chartDoughnut = new Chart($('chartDoughnut'), {
      type: 'doughnut',
      data: {
        labels: state.habits.map(h => h.emoji + ' ' + h.name),
        datasets: [{ data: state.habits.map(h => h.completions.length || 0),
          backgroundColor: state.habits.map(h => h.color), borderWidth: 0, hoverOffset: 8 }],
      },
      options: {
        responsive: true, cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { color: text, font: { size: 11 }, padding: 12 } } },
      },
    });
  }

  const monthData   = days30.map(d => state.habits.length ? Math.round(state.habits.filter(h => isDone(h, d)).length / state.habits.length * 100) : 0);
  const monthLabels = days30.map((d, i) => { const dd = new Date(d + 'T12:00:00'); return i % 5 === 0 ? dd.getDate() + '/' + (dd.getMonth() + 1) : ''; });

  if (chartMonth) chartMonth.destroy();
  chartMonth = new Chart($('chartMonth'), {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{ label: 'Complétion %', data: monthData,
        borderColor: '#7c6af7', backgroundColor: 'rgba(124,106,247,.12)',
        fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: '#7c6af7' }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, grid: { color: grid }, ticks: { color: text, callback: v => v + '%' } },
        x: { grid: { display: false }, ticks: { color: text } },
      },
    },
  });
}

function renderRanking() {
  const list = $('rankingList');
  if (!state.habits.length) {
    list.innerHTML = '<p style="color:var(--text2);font-size:.9rem">Aucune habitude enregistrée.</p>';
    return;
  }
  const ranked  = [...state.habits].map(h => ({ h, rate: completionRate(h, 30) })).sort((a, b) => b.rate - a.rate);
  const medals  = ['🥇', '🥈', '🥉'];
  list.innerHTML = ranked.map(({ h, rate }, i) => `
    <div class="rank-item">
      <span class="rank-pos">${medals[i] || (i + 1)}</span>
      <span class="rank-emoji">${h.emoji}</span>
      <div class="rank-info"><div class="rank-name">${h.name}</div></div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${rate}%;background:${h.color}"></div></div>
      <span class="rank-pct">${rate}%</span>
    </div>
  `).join('');
}

/* ── Calendar ─────────────────────────────────────────────── */
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function renderCalendar() { updateCalLabel(); buildCalGrid(); }

function updateCalLabel() {
  $('calMonthLabel').textContent = new Date(calYear, calMonth, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function buildCalGrid() {
  const grid = $('calendarGrid');
  grid.innerHTML = '';

  const wdRow = document.createElement('div');
  wdRow.className = 'cal-weekdays';
  ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].forEach(w => {
    const el = document.createElement('div');
    el.className = 'cal-wd';
    el.textContent = w;
    wdRow.appendChild(el);
  });
  grid.appendChild(wdRow);

  const daysEl = document.createElement('div');
  daysEl.className = 'cal-days';

  let offset = new Date(calYear, calMonth, 1).getDay() - 1;
  if (offset < 0) offset = 6;
  for (let i = 0; i < offset; i++) {
    const e = document.createElement('div'); e.className = 'cal-day empty'; daysEl.appendChild(e);
  }

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = today();

  for (let day = 1; day <= daysInMonth; day++) {
    const ds    = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const total = state.habits.length;
    const done  = total ? state.habits.filter(h => isDone(h, ds)).length : 0;
    const ratio = total ? done / total : 0;

    let hClass = 'h0';
    if (total > 0) {
      if (ratio > .85) hClass = 'h4';
      else if (ratio > .6)  hClass = 'h3';
      else if (ratio > .35) hClass = 'h2';
      else if (done > 0)    hClass = 'h1';
    }

    const el = document.createElement('div');
    el.className = `cal-day ${hClass}${ds === todayStr ? ' today' : ''}`;
    el.innerHTML = `<span>${day}</span>`;
    if (done > 0) {
      const dots = document.createElement('div');
      dots.className = 'dot-row';
      for (let d = 0; d < Math.min(done, 4); d++) {
        const dot = document.createElement('span'); dot.className = 'cal-dot'; dots.appendChild(dot);
      }
      el.appendChild(dots);
    }
    el.addEventListener('click', () => showCalDetail(ds));
    daysEl.appendChild(el);
  }
  grid.appendChild(daysEl);
}

function showCalDetail(ds) {
  const detail  = $('calDetail');
  const total   = state.habits.length;
  const done    = state.habits.filter(h => isDone(h, ds)).length;
  const pct     = total > 0 ? Math.round(done / total * 100) : 0;

  const habitRow = h => {
    const habitDone = isDone(h, ds);
    const hasSub    = h.subtasks?.length > 0;
    const doneSts   = h.subtaskCompletions?.[ds] ?? [];
    const subHtml   = hasSub ? `
      <div class="cal-detail-subtasks">
        ${h.subtasks.map(st => {
          const stDone = doneSts.includes(st.id);
          return `<span class="cal-detail-sub ${stDone ? 'done' : ''}">${stDone ? '✓' : '✗'} ${st.label}</span>`;
        }).join('')}
      </div>` : '';

    return `
      <div class="cal-detail-habit ${habitDone ? 'done' : 'missed'}">
        <div class="cal-detail-habit-row">
          <span class="cal-detail-badge" style="background:${h.color}22;color:${h.color}">${h.emoji}</span>
          <span class="cal-detail-hname">${h.name}</span>
          <span class="cal-detail-tick">${habitDone ? '✓' : '✗'}</span>
        </div>
        ${subHtml}
      </div>`;
  };

  detail.innerHTML = total === 0
    ? '<p class="cal-detail-placeholder">Aucune habitude définie.</p>'
    : `
      <div class="cal-detail-head">
        <h3>${frenchDate(ds)}</h3>
        <div class="cal-detail-bar-wrap">
          <div class="cal-detail-bar" style="width:${pct}%"></div>
        </div>
        <span class="cal-detail-score">${done}/${total} — ${pct}%</span>
      </div>
      <div class="cal-detail-grid">
        ${state.habits.map(habitRow).join('')}
      </div>`;
}

$('calPrev').addEventListener('click', () => {
  if (--calMonth < 0) { calMonth = 11; calYear--; } renderCalendar();
});
$('calNext').addEventListener('click', () => {
  if (++calMonth > 11) { calMonth = 0; calYear++; } renderCalendar();
});

/* ── Manage View ──────────────────────────────────────────── */
function renderManage() {
  const list = $('manageList');
  if (!state.habits.length) {
    list.innerHTML = '<div class="empty-state">🌱 Aucune habitude. Ajoutes-en une !</div>';
    return;
  }
  list.innerHTML = '';
  state.habits.forEach(h => {
    const item = document.createElement('div');
    item.className = 'manage-item';
    item.style.setProperty('--habit-color', h.color);
    const subInfo = h.subtasks?.length ? ` · ${h.subtasks.length} sous-tâche${h.subtasks.length > 1 ? 's' : ''}` : '';
    item.innerHTML = `
      <span style="font-size:1.4rem">${h.emoji}</span>
      <div class="manage-info">
        <div class="manage-name">${h.name}</div>
        <div class="manage-meta">${h.completions.length} complétions · ${h.freq}j/semaine · Série: ${streak(h)}j${subInfo}</div>
      </div>
      <div class="manage-actions">
        <button class="btn-edit"   data-id="${h.id}">Modifier</button>
        <button class="btn-delete" data-id="${h.id}">Supprimer</button>
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('.btn-edit').forEach(btn =>
    btn.addEventListener('click', () => openEdit(btn.dataset.id)));
  list.querySelectorAll('.btn-delete').forEach(btn =>
    btn.addEventListener('click', () => deleteHabit(btn.dataset.id)));
}

function deleteHabit(id) {
  if (!confirm('Supprimer cette habitude et toutes ses données ?')) return;
  state.habits = state.habits.filter(h => h.id !== id);
  save(); renderAll();
  showToast('🗑️ Habitude supprimée');
}

/* ── Modal ────────────────────────────────────────────────── */
let editId = null, selectedEmoji = EMOJIS[0], selectedColor = COLORS[0];

function buildEmojiPicker() {
  const picker = $('emojiPicker');
  picker.innerHTML = EMOJIS.map(e =>
    `<div class="emoji-option${e === selectedEmoji ? ' selected' : ''}" data-emoji="${e}">${e}</div>`
  ).join('');
  picker.querySelectorAll('.emoji-option').forEach(el =>
    el.addEventListener('click', () => {
      selectedEmoji = el.dataset.emoji;
      picker.querySelectorAll('.emoji-option').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
    }));
}

function buildColorPicker() {
  const picker = $('colorPicker');
  picker.innerHTML = COLORS.map(c =>
    `<div class="color-option${c === selectedColor ? ' selected' : ''}" data-color="${c}" style="background:${c}"></div>`
  ).join('');
  picker.querySelectorAll('.color-option').forEach(el =>
    el.addEventListener('click', () => {
      selectedColor = el.dataset.color;
      picker.querySelectorAll('.color-option').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
    }));
}

function addSubtaskField(stId, label) {
  const fields = $('subtaskFields');
  const field  = document.createElement('div');
  field.className   = 'subtask-field';
  field.dataset.stId = stId || uid();
  field.innerHTML = `
    <input type="text" class="subtask-input" value="${label || ''}" placeholder="Ex : Petit-déjeuner, Déjeuner…" maxlength="50">
    <button type="button" class="btn-remove-subtask" title="Supprimer">✕</button>
  `;
  field.querySelector('.btn-remove-subtask').addEventListener('click', () => field.remove());
  fields.appendChild(field);
  return field;
}

$('btnAddSubtask').addEventListener('click', () => {
  addSubtaskField(uid(), '').querySelector('input').focus();
});

function openModal(id) {
  editId = id || null;
  const habit = id ? state.habits.find(h => h.id === id) : null;

  $('modalTitle').textContent = habit ? "Modifier l'habitude" : 'Nouvelle habitude';
  $('habitName').value        = habit ? habit.name : '';
  $('habitDesc').value        = habit ? (habit.desc || '') : '';
  $('habitFreq').value        = habit ? habit.freq : 7;
  updateFreqLabel();

  selectedEmoji = habit ? habit.emoji : EMOJIS[0];
  selectedColor = habit ? habit.color : COLORS[0];

  buildEmojiPicker();
  buildColorPicker();

  // Build subtask fields
  $('subtaskFields').innerHTML = '';
  (habit?.subtasks ?? []).forEach(st => addSubtaskField(st.id, st.label));

  $('modalBackdrop').classList.add('open');
  $('habitName').focus();
}

function openEdit(id) { openModal(id); }

function closeModal() {
  $('modalBackdrop').classList.remove('open');
  editId = null;
}

function updateFreqLabel() {
  const v = +$('habitFreq').value;
  $('freqLabel').textContent = v === 7 ? '7 jours / semaine (quotidien)' : `${v} jour${v > 1 ? 's' : ''} / semaine`;
}

$('habitFreq').addEventListener('input', updateFreqLabel);

$('modalSave').addEventListener('click', () => {
  const name = $('habitName').value.trim();
  if (!name) { showToast("⚠️ Donne un nom à l'habitude !"); return; }

  const newSubtasks = [...document.querySelectorAll('#subtaskFields .subtask-field')]
    .map(f => ({ id: f.dataset.stId, label: f.querySelector('.subtask-input').value.trim() }))
    .filter(st => st.label.length > 0);

  if (editId) {
    const h = state.habits.find(h => h.id === editId);
    if (h) {
      h.name  = name;
      h.emoji = selectedEmoji;
      h.color = selectedColor;
      h.desc  = $('habitDesc').value.trim();
      h.freq  = +$('habitFreq').value;

      const validIds = new Set(newSubtasks.map(st => st.id));
      if (h.subtaskCompletions) {
        Object.keys(h.subtaskCompletions).forEach(date => {
          h.subtaskCompletions[date] = h.subtaskCompletions[date].filter(id => validIds.has(id));
          if (newSubtasks.length > 0) {
            const allDone = newSubtasks.every(st => h.subtaskCompletions[date].includes(st.id));
            const ci = h.completions.indexOf(date);
            if (allDone  && ci < 0) h.completions.push(date);
            if (!allDone && ci >= 0) h.completions.splice(ci, 1);
          }
        });
      }
      h.subtasks = newSubtasks;
    }
    showToast('✏️ Habitude modifiée !');
  } else {
    state.habits.push({
      id: uid(), name,
      emoji: selectedEmoji, color: selectedColor,
      desc: $('habitDesc').value.trim(),
      freq: +$('habitFreq').value,
      createdAt: today(),
      completions: [], subtasks: newSubtasks, subtaskCompletions: {},
    });
    showToast('🎉 Habitude ajoutée !');
  }
  save(); closeModal(); renderAll();
});

$('modalCancel').addEventListener('click', closeModal);
$('modalClose').addEventListener('click', closeModal);
$('modalBackdrop').addEventListener('click', e => { if (e.target === $('modalBackdrop')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
$('openAddHabit').addEventListener('click',  () => openModal(null));
$('openAddHabit2').addEventListener('click', () => openModal(null));

/* ── Navigation ───────────────────────────────────────────── */
const VIEWS = ['today', 'dashboard', 'calendar', 'habits'];

function switchView(name) {
  VIEWS.forEach(v => {
    document.querySelector(`[data-view="${v}"]`)?.classList.toggle('active', v === name);
    $('view-' + v)?.classList.toggle('active', v === name);
  });
  if (name === 'today')     renderToday();
  if (name === 'dashboard') renderDashboard();
  if (name === 'calendar')  renderCalendar();
  if (name === 'habits')    renderManage();
  $('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-btn').forEach(btn =>
  btn.addEventListener('click', () => switchView(btn.dataset.view)));

$('hamburger').addEventListener('click', () => $('sidebar').classList.toggle('open'));

/* ── Theme ────────────────────────────────────────────────── */
function applyTheme() {
  document.body.classList.toggle('dark',  state.theme === 'dark');
  document.body.classList.toggle('light', state.theme === 'light');
  $('themeToggle').textContent = state.theme === 'dark' ? '🌙' : '☀️';
}

$('themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  save(); applyTheme();
  if (document.querySelector('.view.active')?.id === 'view-dashboard') renderDashboard();
});

/* ── Toast ────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── Render all ───────────────────────────────────────────── */
function renderAll() {
  const active = document.querySelector('.view.active');
  if (!active) return;
  const name = active.id.replace('view-', '');
  if (name === 'today')     renderToday();
  if (name === 'dashboard') renderDashboard();
  if (name === 'calendar')  renderCalendar();
  if (name === 'habits')    renderManage();
}

/* ── Demo data ────────────────────────────────────────────── */
function seedDemo() {
  if (state.habits.length) return;
  const st1 = uid(), st2 = uid(), st3 = uid();
  const demoHabits = [
    { name: 'Méditation',        emoji: '🧘', color: '#7c6af7', desc: '10 minutes de calme', freq: 7, subtasks: [] },
    { name: 'Sport / Exercice',  emoji: '💪', color: '#22c55e', desc: '30 min minimum',       freq: 5, subtasks: [] },
    { name: 'Lecture',           emoji: '📚', color: '#3b82f6', desc: '20 pages par jour',    freq: 7, subtasks: [] },
    { name: "Boire 2L d'eau",    emoji: '💧', color: '#06b6d4', desc: '',                      freq: 7, subtasks: [] },
    { name: 'Alimentation saine',emoji: '🥗', color: '#a3e635', desc: 'Les 3 repas du jour',  freq: 5,
      subtasks: [{ id: st1, label: 'Petit-déjeuner sain' }, { id: st2, label: 'Déjeuner équilibré' }, { id: st3, label: 'Dîner léger' }] },
  ];
  const now = new Date();
  demoHabits.forEach((d, i) => {
    const completions = [], subtaskCompletions = {};
    for (let j = 30; j >= 0; j--) {
      if (Math.random() < [.9,.75,.85,.95,.65][i]) {
        const ds = dateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - j));
        completions.push(ds);
        if (d.subtasks.length) subtaskCompletions[ds] = d.subtasks.map(st => st.id);
      }
    }
    state.habits.push({
      id: uid(), ...d,
      createdAt: dateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      completions, subtaskCompletions,
    });
  });
  save();
}

/* ── Init ─────────────────────────────────────────────────── */
load();
seedDemo();
applyTheme();
renderQuote();
renderToday();
