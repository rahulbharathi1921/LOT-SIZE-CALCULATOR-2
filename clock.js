const TraderClock = {
  SESSIONS: {
    tokyo:  { open: 0, close: 9,  name: 'Tokyo',    tz: 'Asia/Tokyo' },
    london: { open: 8, close: 17, name: 'London',   tz: 'Europe/London' },
    ny:     { open: 13, close: 22, name: 'New York', tz: 'America/New_York' }
  },

  WATCHLIST: [
    { symbol: 'EURUSD', contract: 100000, pipSize: 0.0001 },
    { symbol: 'GBPUSD', contract: 100000, pipSize: 0.0001 },
    { symbol: 'USDJPY', contract: 100000, pipSize: 0.01 },
    { symbol: 'XAUUSD', contract: 100, pipSize: 0.01 },
    { symbol: 'GBPJPY', contract: 100000, pipSize: 0.01 }
  ],

  EVENTS: [
    { name: 'NFP (Non-Farm Payrolls)', day: 5, impact: 'high', getDate: (y,m) => {
      const d = new Date(y, m, 1); d.setDate(1);
      while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
      return d;
    }},
    { name: 'FOMC Rate Decision', day: null, impact: 'high', getDate: (y,m) => new Date(y, m, Math.random() > 0.5 ? 20 : 21) },
    { name: 'CPI (US Inflation)', day: null, impact: 'high', getDate: (y,m) => new Date(y, m, [10,12,12,10,11,11,11,10,11,10,10,12][m] || 10) },
    { name: 'BOE Rate Decision', day: null, impact: 'high', getDate: (y,m) => new Date(y, m, [2,5,3,8,6,10,7,1,5,4,7,3][m] || 5) },
    { name: 'ECB Rate Decision', day: null, impact: 'high', getDate: (y,m) => new Date(y, m, [14,11,10,13,12,10,8,9,6,11,11,10][m] || 10) }
  ],

  _alertedSessions: {},
  _initialTick: true,

  now() { return new Date(); },

  utcHours(d) {
    return d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  },

  isDST(tz) {
    const d = new Date();
    const jan = new Date(d.getFullYear(), 0, 1);
    const jul = new Date(d.getFullYear(), 6, 1);
    const opts = { timeZone: tz, day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
    const janH = parseInt(jan.toLocaleString('en-US', opts).match(/(\d+):/)[1], 10);
    const julH = parseInt(jul.toLocaleString('en-US', opts).match(/(\d+):/)[1], 10);
    return julH !== janH;
  },

  londonSessionHours() {
    return this.isDST('Europe/London') ? { open: 7, close: 16 } : { open: 8, close: 17 };
  },

  nySessionHours() {
    return this.isDST('America/New_York') ? { open: 12, close: 21 } : { open: 13, close: 22 };
  },

  isWeekend(d) {
    const day = d.getUTCDay();
    return day === 6 || day === 0;
  },

  sessionStatus(session, hr) {
    if (this.isWeekend(this.now())) return 'closed';
    return hr >= session.open && hr < session.close ? 'open' : 'closed';
  },

  sessionProgress(session, hr) {
    if (hr < session.open) return 0;
    if (hr >= session.close) return 100;
    return ((hr - session.open) / (session.close - session.open)) * 100;
  },

  sessionRemaining(session, hr) {
    if (hr >= session.close) return 0;
    if (hr < session.open) return (session.close - session.open) * 3600;
    return (session.close - hr) * 3600;
  },

  nextSession(sessions, hr) {
    let next = null, minDist = Infinity;
    for (const s of sessions) {
      const dist = hr < s.open ? s.open - hr : (24 - hr) + s.open;
      if (dist < minDist) { minDist = dist; next = s; }
    }
    return next;
  },

  fmtHMS(secs) {
    secs = Math.max(0, Math.floor(secs));
    return `${String(Math.floor(secs / 3600)).padStart(2,'0')}:${String(Math.floor((secs % 3600) / 60)).padStart(2,'0')}:${String(secs % 60).padStart(2,'0')}`;
  },

  fmtDHMS(secs) {
    secs = Math.max(0, Math.floor(secs));
    const d = Math.floor(secs / 86400);
    secs %= 86400;
    return `${d}d ${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m ${secs % 60}s`;
  },

  fmtAMPM(h) {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:00 ${period}`;
  },

  fmtAMPMLong(h, m) {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`;
  },

  playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.12;
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  },

  ucFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); },

  tick() {
    const now = this.now();
    const utcH = this.utcHours(now);
    const isWknd = this.isWeekend(now);

    // Master clocks
    document.getElementById('clock-ist').textContent = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    document.getElementById('clock-utc').textContent = now.toLocaleString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    // Session definitions with DST
    const londonSesh = this.londonSessionHours();
    const nySesh = this.nySessionHours();
    const sessions = [
      { ...this.SESSIONS.tokyo, open: this.SESSIONS.tokyo.open, close: this.SESSIONS.tokyo.close },
      { ...this.SESSIONS.london, open: londonSesh.open, close: londonSesh.close },
      { ...this.SESSIONS.ny,     open: nySesh.open,     close: nySesh.close }
    ];
    const statuses = sessions.map(s => ({ ...s, status: this.sessionStatus(s, utcH), progress: this.sessionProgress(s, utcH), remaining: this.sessionRemaining(s, utcH) }));

    // Weekend open time
    const mondayOpen = new Date(now);
    mondayOpen.setUTCDate(mondayOpen.getUTCDate() + ((1 - mondayOpen.getUTCDay() + 7) % 7 || 7));
    mondayOpen.setUTCHours(0, 0, 0, 0);
    const secsToMonday = (mondayOpen - now) / 1000;

    // ── DST Badges ──
    const londonDST = this.isDST('Europe/London');
    const nyDST = this.isDST('America/New_York');
    document.getElementById('london-dst').textContent = londonDST ? 'BST (+1)' : 'GMT';
    document.getElementById('london-dst').className = 'dst-badge ' + (londonDST ? 'dst-summer' : 'dst-winter');
    document.getElementById('ny-dst').textContent = nyDST ? 'EDT (+1)' : 'EST';
    document.getElementById('ny-dst').className = 'dst-badge ' + (nyDST ? 'dst-summer' : 'dst-winter');
    document.getElementById('tokyo-dst').textContent = 'JST';

    // ── IST references per session card ──
    const tokyoISTopen = new Date(now.getTime() + 5.5 * 3600000);
    const tokyoISTclose = new Date(now.getTime() + (5.5 - 9) * 3600000);
    const londonISTopen = new Date(now.getTime() + (5.5 - londonSesh.open) * 3600000);
    const londonISTclose = new Date(now.getTime() + (5.5 - londonSesh.close) * 3600000);
    const nyISTopen = new Date(now.getTime() + (5.5 - nySesh.open) * 3600000);
    const nyISTclose = new Date(now.getTime() + (5.5 - nySesh.close) * 3600000);

    document.getElementById('tokyo-ist').textContent =
      `${this.fmtAMPMLong(tokyoISTopen.getUTCHours(), tokyoISTopen.getUTCMinutes())} – ${this.fmtAMPMLong(tokyoISTclose.getUTCHours(), tokyoISTclose.getUTCMinutes())} IST`;
    document.getElementById('london-ist').textContent =
      `${this.fmtAMPMLong(londonISTopen.getUTCHours(), londonISTopen.getUTCMinutes())} – ${this.fmtAMPMLong(londonISTclose.getUTCHours(), londonISTclose.getUTCMinutes())} IST`;
    document.getElementById('ny-ist').textContent =
      `${this.fmtAMPMLong(nyISTopen.getUTCHours(), nyISTopen.getUTCMinutes())} – ${this.fmtAMPMLong(nyISTclose.getUTCHours(), nyISTclose.getUTCMinutes())} IST`;

    // ── Update session cards ──
    const cardIds = ['tokyo', 'london', 'ny'];
    const statusMap = ['tokyo-status', 'london-status', 'ny-status'];
    const cdLabelMap = ['tokyo-cd-label', 'london-cd-label', 'ny-cd-label'];
    const cdTimeMap = ['tokyo-cd-time', 'london-cd-time', 'ny-cd-time'];
    const progMap = ['tokyo-progress', 'london-progress', 'ny-progress'];
    const pctMap = ['tokyo-pct', 'london-pct', 'ny-pct'];
    const glowMap = ['session-tokyo', 'session-london', 'session-newyork'];
    const glowColors = ['rgba(96,165,250,0.15)', 'rgba(251,191,36,0.15)', 'rgba(52,211,153,0.15)'];
    const zoneNames = ['Tokyo', 'London', 'New York'];

    cardIds.forEach((_, i) => {
      const s = statuses[i];
      const open = s.status === 'open';
      const notStarted = s.progress === 0 && !open;
      const statusEl = document.getElementById(statusMap[i]);
      const cdLabelEl = document.getElementById(cdLabelMap[i]);
      const cdTimeEl = document.getElementById(cdTimeMap[i]);
      const progEl = document.getElementById(progMap[i]);
      const pctEl = document.getElementById(pctMap[i]);
      const card = document.getElementById(glowMap[i]);

      // Session open alert (skip beep on initial tick for already-open sessions)
      if (open && !this._alertedSessions[zoneNames[i]]) {
        if (!this._initialTick && document.getElementById('alert-toggle').checked) this.playBeep();
        this._alertedSessions[zoneNames[i]] = true;
      }
      if (!open) this._alertedSessions[zoneNames[i]] = false;

      if (isWknd) {
        statusEl.textContent = '● Market Closed'; statusEl.className = 'session-status closed';
        cdLabelEl.textContent = 'WEEKEND → OPENS:'; cdTimeEl.textContent = this.fmtDHMS(secsToMonday);
        progEl.style.width = '0%'; pctEl.textContent = 'Weekend';
        card.style.boxShadow = 'none'; card.classList.remove('open');
      } else if (open) {
        statusEl.textContent = '● Active'; statusEl.className = 'session-status open';
        cdLabelEl.textContent = '◼ CLOSES IN:'; cdTimeEl.textContent = this.fmtHMS(s.remaining);
        progEl.style.width = s.progress + '%'; pctEl.textContent = Math.round(s.progress) + '%';
        card.style.boxShadow = `0 0 24px ${glowColors[i]}, inset 0 0 24px ${glowColors[i]}`;
        card.classList.add('open');
      } else if (notStarted) {
        statusEl.textContent = '● Upcoming'; statusEl.className = 'session-status upcoming';
        cdLabelEl.textContent = '▶ OPENS IN:'; cdTimeEl.textContent = this.fmtHMS(((s.open - utcH + 24) % 24) * 3600);
        progEl.style.width = '0%'; pctEl.textContent = 'Not started';
        card.style.boxShadow = 'none'; card.classList.remove('open');
      } else {
        statusEl.textContent = '● Ended'; statusEl.className = 'session-status closed';
        cdLabelEl.textContent = 'NEXT ' + zoneNames[i] + ':'; cdTimeEl.textContent = this.fmtHMS(((s.open - utcH + 24) % 24) * 3600);
        progEl.style.width = '100%'; pctEl.textContent = 'Ended';
        card.style.boxShadow = 'none'; card.classList.remove('open');
      }
    });

    // Update London/NY hours for DST
    document.getElementById('london-hours').textContent = `${String(londonSesh.open).padStart(2,'0')}:00 – ${String(londonSesh.close).padStart(2,'0')}:00 UTC`;
    document.getElementById('ny-hours').textContent = `${String(nySesh.open).padStart(2,'0')}:00 – ${String(nySesh.close).padStart(2,'0')}:00 UTC`;
    document.getElementById('ref-london-utc').textContent = `${String(londonSesh.open).padStart(2,'0')}:00 – ${String(londonSesh.close).padStart(2,'0')}:00 UTC`;
    document.getElementById('ref-ny-utc').textContent = `${String(nySesh.open).padStart(2,'0')}:00 – ${String(nySesh.close).padStart(2,'0')}:00 UTC`;

    // IST refs
    document.getElementById('ref-london-ist').textContent =
      `${this.fmtAMPMLong(londonISTopen.getUTCHours(), londonISTopen.getUTCMinutes())} – ${this.fmtAMPMLong(londonISTclose.getUTCHours(), londonISTclose.getUTCMinutes())} IST`;
    document.getElementById('ref-ny-ist').textContent =
      `${this.fmtAMPMLong(nyISTopen.getUTCHours(), nyISTopen.getUTCMinutes())} – ${this.fmtAMPMLong(nyISTclose.getUTCHours(), nyISTclose.getUTCMinutes())} IST`;

    // Market Status
    const isLondonOpen = statuses[1].status === 'open';
    const isNYOpen = statuses[2].status === 'open';
    const isTokyoOpen = statuses[0].status === 'open';
    const statusBadge = document.getElementById('clock-market-status');

    if (isWknd) { statusBadge.textContent = 'Market Closed — Weekend'; statusBadge.className = 'status-badge closed'; }
    else if (isLondonOpen && isNYOpen) { statusBadge.textContent = 'London + New York Overlap'; statusBadge.className = 'status-badge active'; }
    else if (isTokyoOpen && isLondonOpen) { statusBadge.textContent = 'Tokyo + London Overlap'; statusBadge.className = 'status-badge active'; }
    else if (isTokyoOpen) { statusBadge.textContent = 'Tokyo Session Active'; statusBadge.className = 'status-badge active'; }
    else if (isLondonOpen) { statusBadge.textContent = 'London Session Active'; statusBadge.className = 'status-badge active'; }
    else if (isNYOpen) { statusBadge.textContent = 'New York Session Active'; statusBadge.className = 'status-badge active'; }
    else { statusBadge.textContent = 'Market Closed'; statusBadge.className = 'status-badge closed'; }

    // Overlap
    const overlapEl = document.getElementById('clock-overlap');
    const volEl = document.getElementById('clock-volatility');
    if (isLondonOpen && isNYOpen) { overlapEl.textContent = '🟢 London + New York Overlap'; volEl.textContent = 'High'; }
    else if (isTokyoOpen && isLondonOpen) { overlapEl.textContent = '🟢 Tokyo + London Overlap'; volEl.textContent = 'High'; }
    else { overlapEl.textContent = '🔴 No Active Overlap'; volEl.textContent = 'Low'; }

    // Next session
    const next = this.nextSession(sessions, utcH);
    const nextEl = document.getElementById('clock-next-name');
    const nextCd = document.getElementById('clock-next-countdown');
    if (isWknd) { nextEl.textContent = 'Monday (00:00 UTC)'; nextCd.textContent = this.fmtDHMS(secsToMonday); }
    else if (next) {
      nextEl.textContent = next.name;
      const secsToOpen = utcH < next.open ? (next.open - utcH) * 3600 : ((24 - utcH) + next.open) * 3600;
      nextCd.textContent = this.fmtHMS(secsToOpen);
    } else { nextEl.textContent = 'None'; nextCd.textContent = '—'; }

    // Quality
    const qEl = document.getElementById('clock-quality');
    const qSub = document.getElementById('clock-quality-sub');
    if (isWknd) { qEl.textContent = '🔴 Market Closed'; qSub.textContent = 'Weekend — no trading'; }
    else if (isLondonOpen && isNYOpen) { qEl.textContent = '🟢 Excellent Trading Conditions'; qSub.textContent = 'High liquidity, tight spreads'; }
    else if (isLondonOpen) { qEl.textContent = '🟡 Good Trading Conditions'; qSub.textContent = 'Moderate liquidity'; }
    else if (isTokyoOpen) { qEl.textContent = '🟡 Moderate Trading Conditions'; qSub.textContent = 'Lower volatility'; }
    else if (isNYOpen) { qEl.textContent = '🟡 Good Trading Conditions'; qSub.textContent = 'Moderate liquidity'; }
    else { qEl.textContent = '🔴 Low Trading Conditions'; qSub.textContent = 'No major session active'; }

    // Weekend countdown
    const weekendEl = document.getElementById('clock-weekend');
    if (isWknd) {
      weekendEl.style.display = 'block';
      const target = new Date(now);
      target.setUTCDate(target.getUTCDate() + ((1 - target.getUTCDay() + 7) % 7 || 7));
      target.setUTCHours(22, 0, 0, 0);
      document.getElementById('clock-weekend-cd').textContent = this.fmtDHMS((target - now) / 1000);
    } else { weekendEl.style.display = 'none'; }

    // Timeline
    this.updateTimeline(utcH, sessions);

    // ── Economic Calendar ──
    this.updateCalendar(now);

    // ── Watchlist ──
    this.updateWatchlist(now);

    this._initialTick = false;
  },

  updateTimeline(utcH) {
    const marker = document.getElementById('tl-now');
    if (marker) marker.style.left = Math.max(2, Math.min(98, (utcH / 24) * 100)) + '%';
  },

  updateCalendar(now) {
    const el = document.getElementById('clock-calendar');
    const today = new Date(now);
    const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
    const todayEvents = [];

    this.EVENTS.forEach(e => {
      const eventDate = e.getDate(y, m);
      if (eventDate.getFullYear() === y && eventDate.getMonth() === m) {
        const diff = Math.round((eventDate - today) / 86400000);
        todayEvents.push({ name: e.name, date: eventDate, daysAway: diff, impact: e.impact });
      }
    });

    todayEvents.sort((a, b) => a.daysAway - b.daysAway);

    if (todayEvents.length === 0) {
      el.innerHTML = '<div class="cal-empty">No high-impact events scheduled this month</div>';
      return;
    }

    let html = '<div class="cal-list">';
    todayEvents.forEach(ev => {
      const impClass = ev.impact === 'high' ? 'cal-high' : 'cal-med';
      const label = ev.daysAway === 0 ? 'Today' : ev.daysAway === 1 ? 'Tomorrow' : `In ${ev.daysAway}d`;
      const dateStr = ev.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      html += `<div class="cal-item ${impClass}">
        <span class="cal-name">${ev.name}</span>
        <span class="cal-date">${dateStr}</span>
        <span class="cal-countdown">${label}</span>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  },

  updateWatchlist(now) {
    const el = document.getElementById('clock-watchlist');
    let html = '';
    this.WATCHLIST.forEach(w => {
      const simPrice = w.symbol === 'XAUUSD' ? 2330 + Math.sin(now.getTime() / 3600000) * 15 :
                       w.symbol === 'USDJPY' ? 149 + Math.sin(now.getTime() / 3600000) * 2 :
                       w.symbol === 'GBPJPY' ? 189 + Math.sin(now.getTime() / 3600000) * 3 :
                       w.symbol === 'GBPUSD' ? 1.27 + Math.sin(now.getTime() / 3600000) * 0.02 :
                       1.09 + Math.sin(now.getTime() / 3600000) * 0.015;
      const pipVal = getEffectivePipValue(w.symbol, simPrice);
      html += `<div class="wl-item">
        <span class="wl-sym">${w.symbol}</span>
        <span class="wl-price">${simPrice.toFixed(w.pipSize <= 0.0001 ? 5 : w.pipSize <= 0.01 ? 3 : 2)}</span>
        <span class="wl-pip">$${pipVal.toFixed(2)}/pip</span>
        <span class="wl-perlot">$${(pipVal * 10).toFixed(2)}/10pip</span>
      </div>`;
    });
    el.innerHTML = html;
  },

  start() {
    this.tick();
    setInterval(() => this.tick(), 1000);

    document.getElementById('alert-toggle').addEventListener('change', function() {
      document.getElementById('alert-label').textContent = this.checked ? 'Sound alerts ON' : 'Sound alerts OFF';
    });
  }
};

document.addEventListener('DOMContentLoaded', function() { TraderClock.start(); });
