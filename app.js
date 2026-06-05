'use strict';

/* ── Motivational quotes ──────────────────────────────────── */
const QUOTES = [
  "La discipline est le pont entre les objectifs et les accomplissements.",
  "Chaque jour est une nouvelle chance de devenir meilleur qu'hier.",
  "Les petites actions quotidiennes créent de grands changements.",
  "Tu n'as pas à être parfait. Tu dois juste être constant.",
  "L'excellence n'est pas un acte isolé, c'est une habitude.",
  "La motivation te fait démarrer. L'habitude te fait continuer.",
  "Un jour à la fois. Une habitude à la fois.",
  "Le secret de ta réussite se cache dans ta routine quotidienne.",
  "Sois patient avec toi-même. Les grandes choses prennent du temps.",
  "Chaque fois que tu résistes, tu renforces ta volonté.",
  "Le changement est difficile au début, chaotique au milieu, magnifique à la fin.",
  "Tu es plus fort que tu ne le crois. Prouve-le aujourd'hui.",
  "Les habitudes façonnent ton identité. Choisis-les avec soin.",
  "Commence petit, pense grand, agis maintenant.",
  "La constance bat le talent quand le talent n'est pas constant.",
  "Chaque case cochée est une victoire. Chaque victoire compte.",
  "Ton futur moi te remerciera pour les efforts d'aujourd'hui.",
  "Un 1% d'amélioration chaque jour, c'est 37x mieux en un an.",
  "Ne romps pas la chaîne. Garde la série vivante !",
  "Les habitudes sont les intérêts composés de l'amélioration de soi.",
  "Fais-le même quand tu n'en as pas envie. C'est là que ça compte.",
  "Progresse, n'aspire pas à la perfection.",
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

function frenchDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function frenchDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short' });
}

/* ── State & Persistence ──────────────────────────────────── */
let state = { habits: [], theme: 'dark' };

function load() {
  try {
    const raw = localStorage.getItem('habitflow_v2');
    if (raw) state = JSON.parse(raw);
  } catch (_) {}
  // migrate old format
  if (!Array.isArray(state.habits)) state.habits = [];
  state.habits.forEach(h => {
    if (!h.id) h.id = uid();
    if (!Array.isArray(h.completions)) h.completions = [];
    if (!h.color) h.color = COLORS[0];
    if (!h.emoji) h.emoji = '⚡';
    if (!h.freq) h.freq = 7;
  });
}

function save() {
  localStorage.setItem('habitflow_v2', JSON.stringify(state));
}

/* ── Habit helpers ────────────────────────────────────────── */
function isDone(habit, date) {
  return habit.completions.includes(date);
}

function toggle(habit, date) {
  const i = habit.completions.indexOf(date);
  if (i >= 0) {
    habit.completions.splice(i, 1);
  } else {
    habit.completions.push(date);
  }
  save();
}

function streak(habit) {
  let count = 0;
  let d = new Date();
  // allow today not done yet — start from yesterday if today not done
  if (!isDone(habit, dateStr(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (isDone(habit, dateStr(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function bestStreak(habit) {
  if (!habit.completions.length) return 0;
  const sorted = [...habit.completions].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const curr = new Date(sorted[i] + 'T12:00:00');
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

function completionRate(habit, days) {
  const dates = last7Days().slice(-days);
  if (!dates.length) return 0;
  const done = dates.filter(d => isDone(habit, d)).length;
  return Math.round((done / dates.length) * 100);
}

function totalCompletions() {
  return state.habits.reduce((s, h) => s + h.completions.length, 0);
}

function globalStreak() {
  // days where ALL habits were completed
  let count = 0;
  let d = new Date();
  if (!state.habits.length) return 0;
  const check = (ds) => state.habits.every(h => isDone(h, ds));
  if (!check(dateStr(d))) d.setDate(d.getDate() - 1);
  while (check(dateStr(d))) {
    count++;
    d.setDate(d.getDate() - 1);
    if (count > 365) break;
  }
  return count;
}

/* ── Today completion % ───────────────────────────────────── */
function todayPct() {
  if (!state.habits.length) return 0;
  const done = state.habits.filter(h => isDone(h, today())).length;
  return Math.round((done / state.habits.length) * 100);
}

/* ── Ring update ──────────────────────────────────────────── */
function updateRing() {
  const pct = todayPct();
  const circumference = 150.8;
  const offset = circumference - (pct / 100) * circumference;
  const fg = $('ringFg');
  if (fg) {
    fg.style.strokeDashoffset = offset;
    const hue = pct >= 100 ? '#22c55e' : '#7c6af7';
    fg.style.stroke = hue;
  }
  const lbl = $('ringLabel');
  if (lbl) lbl.textContent = pct + '%';
}

/* ── Today View ───────────────────────────────────────────── */
function renderToday() {
  const todayStr = today();
  $('todayDate').textContent = frenchDate(todayStr);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return 'Bonne nuit 🌙';
    if (h < 12) return 'Bonjour 👋';
    if (h < 18) return 'Bon après-midi ☀️';
    return 'Bonne soirée 🌆';
  };
  $('todayTitle').textContent = greeting();

  updateRing();

  // streak banner
  const gs = globalStreak();
  const sb = $('streakBanner');
  if (gs >= 2) {
    sb.classList.add('visible');
    sb.innerHTML = `🔥 Série en cours : <span>${gs} jours</span> consécutifs avec toutes les habitudes complétées !`;
  } else {
    sb.classList.remove('visible');
  }

  // habit list
  const list = $('habitListToday');
  const empty = $('emptyToday');
  list.querySelectorAll('.habit-item').forEach(el => el.remove());

  if (!state.habits.length) {
    empty.style.display = '';
  } else {
    empty.style.display = 'none';
    state.habits.forEach(h => {
      const done = isDone(h, todayStr);
      const s = streak(h);
      const item = document.createElement('div');
      item.className = 'habit-item' + (done ? ' done' : '');
      item.style.setProperty('--habit-color', h.color);
      item.innerHTML = `
        <span class="habit-emoji">${h.emoji}</span>
        <div class="habit-check">${done ? '✓' : ''}</div>
        <div class="habit-info">
          <div class="habit-name">${h.name}</div>
          ${h.desc ? `<div class="habit-desc">${h.desc}</div>` : ''}
        </div>
        ${s >= 2 ? `<span class="habit-streak-badge">🔥 ${s}j</span>` : ''}
      `;
      item.addEventListener('click', () => {
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
  const qs = $('quickStats');
  const todayStr = today();
  const done = state.habits.filter(h => isDone(h, todayStr)).length;
  const total = state.habits.length;
  const gs = globalStreak();
  const best = state.habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);
  const tc = totalCompletions();

  qs.innerHTML = [
    ['☀️', `${done}/${total}`, "Aujourd'hui"],
    ['🔥', gs, 'Série globale'],
    ['🏆', best, 'Meilleure série'],
    ['✅', tc, 'Total coché'],
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
  $('motivationText').textContent = QUOTES[quoteIdx];
}

$('refreshQuote').addEventListener('click', () => {
  quoteIdx = (quoteIdx + 1) % QUOTES.length;
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
  const days7 = last7Days();
  const todayStr = today();

  const doneToday = state.habits.filter(h => isDone(h, todayStr)).length;
  const totalH = state.habits.length;
  const gs = globalStreak();
  const bestS = state.habits.reduce((m, h) => Math.max(m, bestStreak(h)), 0);
  const tc = totalCompletions();
  const pct7 = state.habits.length
    ? Math.round(days7.reduce((s, d) => s + state.habits.filter(h => isDone(h, d)).length, 0) / (7 * Math.max(totalH, 1)) * 100)
    : 0;

  const cards = [
    { icon: '☀️', color: 'rgba(124,106,247,.15)', val: `${doneToday}/${totalH}`, label: 'Habitudes aujourd\'hui', sub: todayPct() + '% complétées' },
    { icon: '🔥', color: 'rgba(245,158,11,.15)', val: gs, label: 'Série globale (jours)', sub: gs >= 7 ? '🏆 Impressionnant !' : 'Continue comme ça !' },
    { icon: '🏆', color: 'rgba(34,197,94,.15)', val: bestS, label: 'Meilleure série', sub: 'Tous temps' },
    { icon: '📊', color: 'rgba(59,130,246,.15)', val: pct7 + '%', label: 'Taux 7 jours', sub: `${tc} complétions totales` },
  ];

  $('statsGrid').innerHTML = cards.map(c => `
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
  const days7 = last7Days();
  const days30 = last30Days();

  // Week bar chart
  const weekData = days7.map(d =>
    state.habits.length
      ? Math.round(state.habits.filter(h => isDone(h, d)).length / state.habits.length * 100)
      : 0
  );
  const weekLabels = days7.map(d => frenchDay(d));

  if (chartWeek) chartWeek.destroy();
  chartWeek = new Chart($('chartWeek'), {
    type: 'bar',
    data: {
      labels: weekLabels,
      datasets: [{
        label: 'Complétion %',
        data: weekData,
        backgroundColor: weekData.map(v => v >= 100 ? '#22c55e' : v >= 50 ? '#7c6af7' : '#5e4bd8'),
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0, max: 100,
          grid: { color: grid },
          ticks: { color: text, callback: v => v + '%' },
        },
        x: { grid: { display: false }, ticks: { color: text } },
      },
    },
  });

  // Doughnut
  if (chartDoughnut) chartDoughnut.destroy();
  if (state.habits.length) {
    const dData = state.habits.map(h => h.completions.length || 0);
    const dLabels = state.habits.map(h => h.emoji + ' ' + h.name);
    const dColors = state.habits.map(h => h.color);

    chartDoughnut = new Chart($('chartDoughnut'), {
      type: 'doughnut',
      data: {
        labels: dLabels,
        datasets: [{ data: dData, backgroundColor: dColors, borderWidth: 0, hoverOffset: 8 }],
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: text, font: { size: 11 }, padding: 12 },
          },
        },
      },
    });
  }

  // Month line
  const monthData = days30.map(d =>
    state.habits.length
      ? Math.round(state.habits.filter(h => isDone(h, d)).length / state.habits.length * 100)
      : 0
  );
  const monthLabels = days30.map((d, i) => {
    const dd = new Date(d + 'T12:00:00');
    return i % 5 === 0 ? dd.getDate() + '/' + (dd.getMonth() + 1) : '';
  });

  if (chartMonth) chartMonth.destroy();
  chartMonth = new Chart($('chartMonth'), {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{
        label: 'Complétion %',
        data: monthData,
        borderColor: '#7c6af7',
        backgroundColor: 'rgba(124,106,247,.12)',
        fill: true,
        tension: .4,
        pointRadius: 3,
        pointBackgroundColor: '#7c6af7',
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0, max: 100,
          grid: { color: grid },
          ticks: { color: text, callback: v => v + '%' },
        },
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
  const ranked = [...state.habits]
    .map(h => ({ h, rate: completionRate(h, 30) }))
    .sort((a, b) => b.rate - a.rate);

  const medals = ['🥇', '🥈', '🥉'];
  list.innerHTML = ranked.map(({ h, rate }, i) => `
    <div class="rank-item">
      <span class="rank-pos">${medals[i] || (i + 1)}</span>
      <span class="rank-emoji">${h.emoji}</span>
      <div class="rank-info">
        <div class="rank-name">${h.name}</div>
      </div>
      <div class="rank-bar-wrap">
        <div class="rank-bar" style="width:${rate}%;background:${h.color}"></div>
      </div>
      <span class="rank-pct">${rate}%</span>
    </div>
  `).join('');
}

/* ── Calendar ─────────────────────────────────────────────── */
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function renderCalendar() {
  updateCalLabel();
  buildCalGrid();
}

function updateCalLabel() {
  const d = new Date(calYear, calMonth, 1);
  $('calMonthLabel').textContent = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function buildCalGrid() {
  const grid = $('calendarGrid');
  grid.innerHTML = '';

  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const wdRow = document.createElement('div');
  wdRow.className = 'cal-weekdays';
  weekdays.forEach(w => {
    const el = document.createElement('div');
    el.className = 'cal-wd';
    el.textContent = w;
    wdRow.appendChild(el);
  });
  grid.appendChild(wdRow);

  const daysEl = document.createElement('div');
  daysEl.className = 'cal-days';

  const first = new Date(calYear, calMonth, 1);
  // Monday=0 offset
  let offset = first.getDay() - 1;
  if (offset < 0) offset = 6;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = today();

  for (let i = 0; i < offset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    daysEl.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const total = state.habits.length;
    const done = total ? state.habits.filter(h => isDone(h, ds)).length : 0;
    const ratio = total ? done / total : 0;

    let hClass = 'h0';
    if (total > 0) {
      if (ratio > .85) hClass = 'h4';
      else if (ratio > .6) hClass = 'h3';
      else if (ratio > .35) hClass = 'h2';
      else if (done > 0) hClass = 'h1';
    }

    const el = document.createElement('div');
    el.className = `cal-day ${hClass}${ds === todayStr ? ' today' : ''}`;
    el.dataset.date = ds;
    el.innerHTML = `<span>${day}</span>`;
    if (done > 0) {
      const dots = document.createElement('div');
      dots.className = 'dot-row';
      const n = Math.min(done, 4);
      for (let d = 0; d < n; d++) {
        const dot = document.createElement('span');
        dot.className = 'cal-dot';
        dots.appendChild(dot);
      }
      el.appendChild(dots);
    }
    el.addEventListener('click', () => showCalDetail(ds, done, total));
    daysEl.appendChild(el);
  }
  grid.appendChild(daysEl);
}

function showCalDetail(ds, done, total) {
  const detail = $('calDetail');
  const habitesDone = state.habits.filter(h => isDone(h, ds));
  const habitesMissed = state.habits.filter(h => !isDone(h, ds));
  const fDate = frenchDate(ds);

  detail.innerHTML = `
    <h3 style="margin-bottom:12px;font-size:1rem">${fDate}</h3>
    <p style="color:var(--text2);font-size:.85rem;margin-bottom:12px">${done}/${total} habitudes complétées</p>
    ${habitesDone.length ? `
      <div style="margin-bottom:10px">
        ${habitesDone.map(h => `<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 4px 2px 0;padding:4px 10px;border-radius:20px;font-size:.82rem;font-weight:600;background:${h.color}22;color:${h.color}">✓ ${h.emoji} ${h.name}</span>`).join('')}
      </div>
    ` : ''}
    ${habitesMissed.length ? `
      <div>
        ${habitesMissed.map(h => `<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 4px 2px 0;padding:4px 10px;border-radius:20px;font-size:.82rem;font-weight:600;background:var(--bg3);color:var(--text2)">✗ ${h.emoji} ${h.name}</span>`).join('')}
      </div>
    ` : ''}
  `;
}

$('calPrev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});
$('calNext').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
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
    item.innerHTML = `
      <span style="font-size:1.4rem">${h.emoji}</span>
      <div class="manage-info">
        <div class="manage-name">${h.name}</div>
        <div class="manage-meta">${h.completions.length} complétions · ${h.freq}j/semaine · Série: ${streak(h)}j</div>
      </div>
      <div class="manage-actions">
        <button class="btn-edit" data-id="${h.id}">Modifier</button>
        <button class="btn-delete" data-id="${h.id}">Supprimer</button>
      </div>
    `;
    list.querySelector('[data-id="' + h.id + '"].btn-edit')?.remove();
    list.appendChild(item);
  });

  list.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEdit(btn.dataset.id));
  });
  list.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteHabit(btn.dataset.id));
  });
}

function deleteHabit(id) {
  if (!confirm('Supprimer cette habitude et toutes ses données ?')) return;
  state.habits = state.habits.filter(h => h.id !== id);
  save();
  renderAll();
  showToast('🗑️ Habitude supprimée');
}

/* ── Modal ────────────────────────────────────────────────── */
let editId = null;
let selectedEmoji = EMOJIS[0];
let selectedColor = COLORS[0];

function buildEmojiPicker() {
  const picker = $('emojiPicker');
  picker.innerHTML = EMOJIS.map(e =>
    `<div class="emoji-option${e === selectedEmoji ? ' selected' : ''}" data-emoji="${e}">${e}</div>`
  ).join('');
  picker.querySelectorAll('.emoji-option').forEach(el => {
    el.addEventListener('click', () => {
      selectedEmoji = el.dataset.emoji;
      picker.querySelectorAll('.emoji-option').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
}

function buildColorPicker() {
  const picker = $('colorPicker');
  picker.innerHTML = COLORS.map(c =>
    `<div class="color-option${c === selectedColor ? ' selected' : ''}" data-color="${c}" style="background:${c}"></div>`
  ).join('');
  picker.querySelectorAll('.color-option').forEach(el => {
    el.addEventListener('click', () => {
      selectedColor = el.dataset.color;
      picker.querySelectorAll('.color-option').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
}

function openModal(id) {
  editId = id || null;
  const habit = id ? state.habits.find(h => h.id === id) : null;

  $('modalTitle').textContent = habit ? 'Modifier l\'habitude' : 'Nouvelle habitude';
  $('habitName').value = habit ? habit.name : '';
  $('habitDesc').value = habit ? (habit.desc || '') : '';
  $('habitFreq').value = habit ? habit.freq : 7;
  updateFreqLabel();

  selectedEmoji = habit ? habit.emoji : EMOJIS[0];
  selectedColor = habit ? habit.color : COLORS[0];

  buildEmojiPicker();
  buildColorPicker();

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
  if (!name) { showToast('⚠️ Donne un nom à l\'habitude !'); return; }

  if (editId) {
    const h = state.habits.find(h => h.id === editId);
    if (h) {
      h.name = name;
      h.emoji = selectedEmoji;
      h.color = selectedColor;
      h.desc = $('habitDesc').value.trim();
      h.freq = +$('habitFreq').value;
    }
    showToast('✏️ Habitude modifiée !');
  } else {
    state.habits.push({
      id: uid(),
      name,
      emoji: selectedEmoji,
      color: selectedColor,
      desc: $('habitDesc').value.trim(),
      freq: +$('habitFreq').value,
      createdAt: today(),
      completions: [],
    });
    showToast('🎉 Habitude ajoutée !');
  }
  save();
  closeModal();
  renderAll();
});

$('modalCancel').addEventListener('click', closeModal);
$('modalClose').addEventListener('click', closeModal);
$('modalBackdrop').addEventListener('click', e => { if (e.target === $('modalBackdrop')) closeModal(); });

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

$('openAddHabit').addEventListener('click', () => openModal(null));
$('openAddHabit2').addEventListener('click', () => openModal(null));

/* ── Navigation ───────────────────────────────────────────── */
const VIEWS = ['today', 'dashboard', 'calendar', 'habits'];

function switchView(name) {
  VIEWS.forEach(v => {
    const btn = document.querySelector(`[data-view="${v}"]`);
    const sec = $('view-' + v);
    if (btn) btn.classList.toggle('active', v === name);
    if (sec) sec.classList.toggle('active', v === name);
  });
  if (name === 'today') renderToday();
  if (name === 'dashboard') renderDashboard();
  if (name === 'calendar') renderCalendar();
  if (name === 'habits') renderManage();

  // close mobile sidebar
  $('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

/* ── Mobile sidebar ───────────────────────────────────────── */
$('hamburger').addEventListener('click', () => {
  $('sidebar').classList.toggle('open');
});

/* ── Theme ────────────────────────────────────────────────── */
function applyTheme() {
  document.body.classList.toggle('dark', state.theme === 'dark');
  document.body.classList.toggle('light', state.theme === 'light');
  $('themeToggle').textContent = state.theme === 'dark' ? '🌙' : '☀️';
}

$('themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  save();
  applyTheme();
  // re-render charts with new theme colors
  const active = document.querySelector('.view.active');
  if (active && active.id === 'view-dashboard') renderDashboard();
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
  if (name === 'today') renderToday();
  if (name === 'dashboard') renderDashboard();
  if (name === 'calendar') renderCalendar();
  if (name === 'habits') renderManage();
}

/* ── Demo data (first launch) ─────────────────────────────── */
function seedDemo() {
  if (state.habits.length) return;
  const demoHabits = [
    { name: 'Méditation', emoji: '🧘', color: '#7c6af7', desc: '10 minutes de calme', freq: 7 },
    { name: 'Sport / Exercice', emoji: '💪', color: '#22c55e', desc: '30 min minimum', freq: 5 },
    { name: 'Lecture', emoji: '📚', color: '#3b82f6', desc: '20 pages par jour', freq: 7 },
    { name: 'Boire 2L d\'eau', emoji: '💧', color: '#06b6d4', desc: '', freq: 7 },
    { name: 'Alimentation saine', emoji: '🥗', color: '#a3e635', desc: 'Pas de junk food', freq: 5 },
  ];
  const now = new Date();
  demoHabits.forEach((d, i) => {
    const completions = [];
    // add some historical data
    for (let j = 30; j >= 0; j--) {
      const prob = [.9, .75, .85, .95, .65][i];
      if (Math.random() < prob) {
        const date = new Date(now);
        date.setDate(date.getDate() - j);
        completions.push(dateStr(date));
      }
    }
    state.habits.push({ id: uid(), ...d, createdAt: dateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1)), completions });
  });
  save();
}

/* ── Init ─────────────────────────────────────────────────── */
load();
seedDemo();
applyTheme();
renderQuote();
renderToday();
