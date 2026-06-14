const App = {
  trades: [],

  init() {
    this.setupTheme();
    this.setupMobileMenu();
    this.setupTabs();
    this.setupLotCalculator();
    this.setupPipCalculator();
    this.setupProfitCalculator();
    this.setupRRCalculator();
    this.setupMarginCalculator();
    this.setupPropFirm();
    this.setupJournal();
    this.setupDashboard();
    this.setupDrawdown();
    this.setupHeatmap();
    this.setupMultiPosition();
    this.setupKeyboardShortcuts();
    this.loadTradesFromStorage();
    this.loadAccount();
    this.bindAccountSync();
    UI.calculateLot();
    UI.calculatePip();
    UI.calculateHeatmap();
  },

  bindAccountSync() {
    const ids = ['lot-account', 'profit-account', 'margin-account', 'dd-account', 'dash-account-input', 'hm-account', 'mp-account'];
    const self = this;
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function() {
          self.syncAccount(this.value, id);
        });
      }
    });
  },

  syncAccount(val, sourceId) {
    const ids = ['lot-account', 'profit-account', 'margin-account', 'dd-account', 'dash-account-input', 'hm-account', 'mp-account'];
    ids.forEach(id => {
      if (id !== sourceId) {
        const el = document.getElementById(id);
        if (el) el.value = val;
      }
    });
    this.saveAccount(val);
    
    // Refresh calculations
    UI.calculateLot();
    UI.calculateProfit();
    UI.calculateMargin();
    UI.calculateDrawdown();
    UI.calculateHeatmap();
    UI.calculateMultiPosition();
    this.updateDashboard();
  },

  saveAccount(val) { localStorage.setItem('prorisk_account', val); },
  loadAccount() {
    const val = localStorage.getItem('prorisk_account');
    if (val) {
      this.syncAccount(val, null);
    }
  },

  setupTheme() {
    const saved = localStorage.getItem('edge_theme') || 'dark';
    const btn = document.getElementById('theme-toggle');
    document.documentElement.className = saved === 'light' ? 'light-mode' : 'dark-mode';
    btn.textContent = saved === 'light' ? '☀️' : '🌙';
    btn.addEventListener('click', function() {
      const isLight = document.documentElement.className === 'light-mode';
      document.documentElement.className = isLight ? 'dark-mode' : 'light-mode';
      btn.textContent = isLight ? '🌙' : '☀️';
      localStorage.setItem('edge_theme', isLight ? 'dark' : 'light');
    });
  },

  setupMobileMenu() {
    const btn = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('backdrop');
    const navItems = document.querySelectorAll('.nav-item');
    btn.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('visible');
    });
    backdrop.addEventListener('click', function() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('visible');
    });
    navItems.forEach(function(item) {
      item.addEventListener('click', function() {
        if (window.innerWidth < 860) {
          sidebar.classList.remove('open');
          backdrop.classList.remove('visible');
        }
      });
    });
  },

  setupTabs() {
    document.querySelectorAll('.nav-item').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(function(t) { t.classList.remove('active'); });
        document.querySelectorAll('.panel').forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        document.getElementById(this.dataset.tab).classList.add('active');
      });
    });
  },

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey || e.metaKey) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if (e.key === 'Enter') {
          const activeTab = document.querySelector('.panel.active');
          if (activeTab) { const btn = activeTab.querySelector('.btn-primary'); if (btn) btn.click(); }
        }
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        const tabs = document.querySelectorAll('.nav-item');
        const idx = parseInt(e.key) - 1;
        if (idx < tabs.length) tabs[idx].click();
      }
    });
  },

  setupLotCalculator() {
    UI.populateSymbols('forex');

    document.getElementById('lot-asset-type').addEventListener('change', function(e) { UI.populateSymbols(e.target.value); });
    document.getElementById('lot-symbol').addEventListener('change', function() { UI.loadSymbol(); });
    document.getElementById('lot-broker').addEventListener('change', function() { UI.loadBroker(); });
    document.getElementById('lot-direction').addEventListener('change', function() { UI.calculateLot(); });

    var lotInputs = ['lot-account','lot-risk','lot-entry','lot-sl','lot-tp',
                     'lot-contract','lot-pip','lot-tick','lot-pip-value',
                     'lot-step','lot-leverage','lot-spread','lot-commission'];
    lotInputs.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { UI.calculateLot(); });
    });

    document.getElementById('lot-entry').addEventListener('input', function() {
      var symbol = document.getElementById('lot-symbol').value;
      var price = parseFloat(this.value) || 0;
      document.getElementById('lot-pip-value').value = getEffectivePipValue(symbol, price);
      UI.calculateLot();
    });

    document.getElementById('lot-copy').addEventListener('click', function() {
      var text = App.buildLotCopyText();
      navigator.clipboard.writeText(text);
      UI.toast('Copied', 'success');
    });

    document.getElementById('lot-reset').addEventListener('click', function() {
      UI.setValue('lot-account', 10000);
      UI.setValue('lot-risk', 1);
      document.getElementById('lot-direction').value = 'buy';
      UI.setValue('lot-entry', 1.0850);
      UI.setValue('lot-sl', 1.0800);
      UI.setValue('lot-tp', 1.0950);
      UI.setValue('lot-spread', 0);
      UI.setValue('lot-commission', 0);
      UI.calculateLot();
      UI.toast('Reset complete', 'info');
    });

    document.getElementById('lot-save-journal').addEventListener('click', function() { App.saveCurrentTrade(); });

    window.addEventListener('resize', function() { UI.calculateLot(); });
  },

  buildLotCopyText() {
    var lines = [];
    lines.push('EDGE RISK REPORT');
    lines.push('Symbol: ' + document.getElementById('lot-symbol').value);
    lines.push('Direction: ' + document.getElementById('lot-direction').value.toUpperCase());
    lines.push('Account: $' + UI.getValue('lot-account'));
    lines.push('Risk: ' + document.getElementById('lot-risk').value + '% ($' + document.getElementById('lot-risk-amount').value + ')');
    lines.push('Entry: ' + document.getElementById('lot-entry').value);
    lines.push('SL: ' + document.getElementById('lot-sl').value);
    lines.push('TP: ' + (document.getElementById('lot-tp').value || 'N/A'));
    lines.push('Lot Size: ' + document.getElementById('lot-rounded').textContent);
    lines.push('R:R: ' + document.getElementById('lot-rr').textContent);
    lines.push('Loss: ' + document.getElementById('lot-total-cost').textContent);
    lines.push('Profit: ' + document.getElementById('lot-net-profit').textContent);
    lines.push('Margin: ' + document.getElementById('lot-margin').textContent);
    return lines.join('\n');
  },

  setupPipCalculator() {
    var inputs = ['pip-symbol','pip-price','pip-contract','pip-size','pip-lot'];
    inputs.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { UI.calculatePip(); });
    });
    document.getElementById('pip-copy').addEventListener('click', function() {
      navigator.clipboard.writeText('Pip Value: ' + document.getElementById('pip-value').textContent);
      UI.toast('Copied', 'success');
    });
    document.getElementById('pip-reset').addEventListener('click', function() {
      document.getElementById('pip-symbol').value = 'EURUSD';
      UI.setValue('pip-price', 1.0850);
      UI.setValue('pip-contract', 100000);
      UI.setValue('pip-size', 0.0001);
      UI.setValue('pip-lot', 1);
      UI.calculatePip();
    });
  },

  setupProfitCalculator() {
    var inputs = ['profit-direction','profit-entry','profit-exit','profit-lot','profit-contract','profit-account'];
    inputs.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { UI.calculateProfit(); });
    });
    document.getElementById('profit-copy').addEventListener('click', function() {
      navigator.clipboard.writeText('P&L: ' + document.getElementById('profit-amount').textContent);
      UI.toast('Copied', 'success');
    });
    document.getElementById('profit-reset').addEventListener('click', function() {
      document.getElementById('profit-direction').value = 'buy';
      UI.setValue('profit-entry', 1.0850);
      UI.setValue('profit-exit', 1.0900);
      UI.setValue('profit-lot', 0.1);
      UI.setValue('profit-contract', 100000);
      UI.setValue('profit-account', 10000);
      UI.calculateProfit();
    });
  },

  setupRRCalculator() {
    var inputs = ['rr-direction','rr-entry','rr-sl','rr-tp'];
    inputs.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { UI.calculateRR(); });
    });
    document.getElementById('rr-copy').addEventListener('click', function() {
      navigator.clipboard.writeText('R:R = ' + document.getElementById('rr-ratio').textContent);
      UI.toast('Copied', 'success');
    });
    document.getElementById('rr-reset').addEventListener('click', function() {
      document.getElementById('rr-direction').value = 'buy';
      UI.setValue('rr-entry', 1.0850);
      UI.setValue('rr-sl', 1.0800);
      UI.setValue('rr-tp', 1.0950);
      UI.calculateRR();
    });
  },

  setupMarginCalculator() {
    var inputs = ['margin-symbol','margin-lot','margin-contract','margin-price','margin-leverage','margin-account'];
    inputs.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { UI.calculateMargin(); });
    });
    document.getElementById('margin-copy').addEventListener('click', function() {
      navigator.clipboard.writeText('Margin: ' + document.getElementById('margin-required').textContent);
      UI.toast('Copied', 'success');
    });
    document.getElementById('margin-reset').addEventListener('click', function() {
      document.getElementById('margin-symbol').value = 'EURUSD';
      UI.setValue('margin-lot', 0.1);
      UI.setValue('margin-contract', 100000);
      UI.setValue('margin-price', 1.0850);
      UI.setValue('margin-leverage', 100);
      UI.setValue('margin-account', 10000);
      UI.calculateMargin();
    });
  },

  setupPropFirm() {
    document.getElementById('prop-firm').addEventListener('change', function() { UI.loadPropFirm(); });
    var inputs = ['prop-account','prop-balance','prop-daily','prop-max','prop-target'];
    inputs.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { UI.calculatePropFirm(); });
    });
    document.getElementById('prop-reset').addEventListener('click', function() {
      document.getElementById('prop-firm').value = 'ftmo';
      UI.setValue('prop-account', 100000);
      UI.setValue('prop-balance', 100000);
      UI.loadPropFirm();
    });
  },

  setupJournal() {
    document.getElementById('trade-date').valueAsDate = new Date();
    document.getElementById('trade-add').addEventListener('click', function() {
      var trade = {
        id: Date.now(),
        date: document.getElementById('trade-date').value,
        symbol: document.getElementById('trade-symbol').value.toUpperCase(),
        direction: document.getElementById('trade-direction').value,
        entry: UI.getValue('trade-entry'),
        exit: UI.getValue('trade-exit'),
        lot: UI.getValue('trade-lot'),
        pnl: UI.getValue('trade-pnl'),
        notes: document.getElementById('trade-notes').value
      };
      if (!trade.symbol) { UI.toast('Enter a symbol', 'error'); return; }
      App.trades.push(trade);
      App.saveTradesToStorage();
      App.renderJournal();
      App.clearTradeForm();
      UI.toast('Trade added', 'success');
    });

    document.getElementById('journal-export-csv').addEventListener('click', function() { App.exportCSV(); });
    document.getElementById('journal-export-json').addEventListener('click', function() { App.exportJSON(); });
    document.getElementById('journal-import').addEventListener('click', function() { document.getElementById('journal-import-file').click(); });
    document.getElementById('journal-import-file').addEventListener('change', function(e) { App.importJSON(e); });
    document.getElementById('journal-clear').addEventListener('click', function() {
      if (confirm('Delete all trades?')) { App.trades = []; App.saveTradesToStorage(); App.renderJournal(); UI.toast('Cleared', 'info'); }
    });
  },

  clearTradeForm() {
    document.getElementById('trade-symbol').value = '';
    UI.setValue('trade-entry', 0);
    UI.setValue('trade-exit', 0);
    UI.setValue('trade-lot', 0);
    UI.setValue('trade-pnl', 0);
    document.getElementById('trade-notes').value = '';
  },

  saveCurrentTrade() {
    var symbol = document.getElementById('lot-symbol').value;
    if (!symbol) { UI.toast('No trade to save', 'error'); return; }
    var trade = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      symbol: symbol,
      direction: document.getElementById('lot-direction').value === 'buy' ? 'long' : 'short',
      entry: UI.getValue('lot-entry'),
      exit: 0,
      lot: parseFloat(document.getElementById('lot-rounded').textContent) || 0,
      pnl: 0,
      notes: 'From Position Sizing'
    };
    App.trades.push(trade);
    App.saveTradesToStorage();
    App.renderJournal();
    UI.toast('Saved to journal', 'success');
  },

  renderJournal() {
    var tbody = document.getElementById('journal-tbody');
    if (App.trades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No trades recorded</td></tr>';
    } else {
      tbody.innerHTML = App.trades.map(function(t) {
        var dirText = t.direction === 'long' ? 'Long' : 'Short';
        var pnlClass = t.pnl >= 0 ? 'positive' : 'negative';
        return '<tr><td>' + t.date + '</td><td><strong>' + t.symbol + '</strong></td><td>' + dirText + '</td><td class="mono">' + (t.entry || '\u2014') + '</td><td class="mono">' + (t.exit || '\u2014') + '</td><td class="mono">' + (t.lot || '\u2014') + '</td><td class="mono ' + pnlClass + '">' + Calc.fmtUSD(t.pnl) + '</td><td>' + (t.notes || '\u2014') + '</td><td><button class="btn btn-sm btn-danger" onclick="App.deleteTrade(' + t.id + ')">Delete</button></td></tr>';
      }).join('');
    }
    App.updateJournalStats();
  },

  deleteTrade(id) {
    App.trades = App.trades.filter(function(t) { return t.id !== id; });
    App.saveTradesToStorage();
    App.renderJournal();
    UI.toast('Deleted', 'info');
  },

  updateJournalStats() {
    var total = App.trades.length;
    var wins = App.trades.filter(function(t) { return t.pnl > 0; }).length;
    var wr = total > 0 ? (wins / total) * 100 : 0;
    var tpl = App.trades.reduce(function(s, t) { return s + t.pnl; }, 0);
    var pf = Calc.profitFactor(App.trades);
    document.getElementById('journal-total').textContent = total;
    document.getElementById('journal-winrate').textContent = Calc.fmtPct(wr);
    var plEl = document.getElementById('journal-pl');
    plEl.textContent = Calc.fmtUSD(tpl);
    plEl.className = 'sp-val ' + (tpl >= 0 ? 'positive' : 'negative');
    document.getElementById('journal-pf').textContent = isFinite(pf) ? Calc.fmt(pf, 2) : '\u221E';
  },

  exportCSV() {
    if (App.trades.length === 0) { UI.toast('No trades', 'error'); return; }
    var h = 'Date,Symbol,Direction,Entry,Exit,Lot,P/L,Notes';
    var r = App.trades.map(function(t) { return [t.date, t.symbol, t.direction, t.entry||'', t.exit||'', t.lot||'', t.pnl, '"'+(t.notes||'')+'"'].join(','); });
    App.downloadFile([h].concat(r).join('\n'), 'trades.csv', 'text/csv');
    UI.toast('CSV exported', 'success');
  },

  exportJSON() {
    if (App.trades.length === 0) { UI.toast('No trades', 'error'); return; }
    App.downloadFile(JSON.stringify(App.trades, null, 2), 'trades.json', 'application/json');
    UI.toast('JSON exported', 'success');
  },

  importJSON(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) { UI.toast('Invalid format', 'error'); return; }
        App.trades = App.trades.concat(data);
        App.saveTradesToStorage();
        App.renderJournal();
        UI.toast(data.length + ' imported', 'success');
      } catch (err) { UI.toast('Import failed', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  downloadFile(content, filename, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  saveTradesToStorage() { localStorage.setItem('prorisk_trades', JSON.stringify(App.trades)); },
  loadTradesFromStorage() {
    var stored = localStorage.getItem('prorisk_trades');
    if (stored) { App.trades = JSON.parse(stored); App.renderJournal(); }
  },

  setupDrawdown() {
    var ids = ['dd-account', 'dd-risk', 'dd-losses'];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { UI.calculateDrawdown(); });
    });
    document.getElementById('dd-calc').addEventListener('click', function() { UI.calculateDrawdown(); });
  },

  setupHeatmap() {
    document.getElementById('hm-account').addEventListener('input', function() { UI.calculateHeatmap(); });
  },

  setupMultiPosition() {
    var ids = ['mp-account'];
    for (var i = 1; i <= 5; i++) ids.push('mp-risk-' + i);
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { UI.calculateMultiPosition(); });
    });
  },

  setupDashboard() {
    this.updateDashboard();
    ['dash-trade-slider','dash-daily-slider','dash-open-slider'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function() { App.updateDashboard(); });
    });
    document.getElementById('dash-account-input').addEventListener('input', function() { App.updateDashboard(); });
  },

  updateDashboardAccount(account) {
    var el = document.getElementById('dash-account-input');
    if (el && Math.abs(parseFloat(el.value) - account) > 0.01) { el.value = account; }
    this.updateDashboard();
  },

  updateDashboard() {
    var account = UI.getValue('dash-account-input') || 10000;
    var tradePct = UI.getValue('dash-trade-slider') || 2;
    var dailyPct = UI.getValue('dash-daily-slider') || 5;
    var openPct = UI.getValue('dash-open-slider') || 10;
    document.getElementById('dash-account').textContent = Calc.fmtUSD(account);
    document.getElementById('dash-risk').textContent = Calc.fmtUSD(account * tradePct / 100);
    document.getElementById('dash-daily').textContent = Calc.fmtUSD(account * dailyPct / 100) + ' (' + dailyPct + '%)';
    document.getElementById('dash-open').textContent = Calc.fmtUSD(account * openPct / 100);
    document.getElementById('dash-trade-pct').textContent = tradePct + '%';
    document.getElementById('dash-daily-pct').textContent = dailyPct + '%';
    document.getElementById('dash-open-pct').textContent = openPct + '%';
    var barWidth = Math.min((tradePct / 5) * 100, 100);
    document.getElementById('risk-bar').style.width = barWidth + '%';
    var statusEl = document.getElementById('risk-status');
    if (tradePct <= 1) { statusEl.textContent = 'Conservative'; statusEl.style.color = 'var(--green)'; }
    else if (tradePct <= 2) { statusEl.textContent = 'Moderate'; statusEl.style.color = 'var(--amber)'; }
    else { statusEl.textContent = 'Aggressive'; statusEl.style.color = 'var(--red)'; }
  }
};

document.addEventListener('DOMContentLoaded', function() { App.init(); });
