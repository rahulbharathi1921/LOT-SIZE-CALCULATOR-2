const UI = {
  populateSymbols(type) {
    const select = document.getElementById('lot-symbol');
    select.innerHTML = '';
    const symbols = ASSET_LISTS[type] || [];
    symbols.forEach(function(sym) {
      const opt = document.createElement('option');
      opt.value = sym;
      opt.textContent = sym;
      select.appendChild(opt);
    });
    this.loadSymbol();
  },

  loadSymbol() {
    const symbol = document.getElementById('lot-symbol').value;
    const asset = ASSETS[symbol];
    if (!asset) return;
    const meta = getMeta(symbol);
    this.setValue('lot-contract', asset.contractSize);
    this.setValue('lot-pip', asset.pipSize);
    this.setValue('lot-tick', asset.tickSize);
    this.setValue('lot-step', asset.lotStep);
    this.setValue('lot-leverage', asset.leverage);
    const price = this.getValue('lot-entry') || 0;
    const pipVal = getEffectivePipValue(symbol, price);
    this.setValue('lot-pip-value', pipVal);
    this.calculateLot();
  },

  loadBroker() {
    const broker = document.getElementById('lot-broker').value;
    const preset = BROKER_PRESETS[broker];
    if (!preset) return;
    this.setValue('lot-leverage', preset.leverage);
    this.setValue('lot-step', preset.lotStep);
    this.calculateLot();
  },

  getValue(id) { return parseFloat(document.getElementById(id).value) || 0; },
  setValue(id, val) { document.getElementById(id).value = val; },
  getSelect(id) { return document.getElementById(id).value; },
  setText(id, text) { document.getElementById(id).textContent = text; },
  setHTML(id, html) { document.getElementById(id).innerHTML = html; },

  calculateLot() {
    try {
      const account = this.getValue('lot-account');
      const riskPct = this.getValue('lot-risk');
      const direction = this.getSelect('lot-direction');
      const entry = this.getValue('lot-entry');
      const sl = this.getValue('lot-sl');
      const tp = this.getValue('lot-tp');
      const contract = this.getValue('lot-contract');
      const pip = this.getValue('lot-pip');
      const step = this.getValue('lot-step') || 0.01;
      const leverage = this.getValue('lot-leverage') || 1;
      const spreadPips = this.getValue('lot-spread');
      const commissionPerLot = this.getValue('lot-commission');
      const symbol = document.getElementById('lot-symbol').value;
      const pipVal = getEffectivePipValue(symbol, entry);
      this.setValue('lot-pip-value', pipVal);

      const dirHint = document.getElementById('dir-hint');
      if (dirHint) dirHint.textContent = direction === 'buy' ? 'SL below entry' : 'SL above entry';

      if (account <= 0 || riskPct <= 0 || entry <= 0 || sl <= 0 || contract <= 0) {
        this.clearResults('lot');
        this.clearHero();
        this.removeValidation('lot');
        return;
      }

      let valid = true;
      if (direction === 'buy' && sl >= entry) {
        this.showFieldError('lot-sl', 'SL must be below entry'); valid = false;
      } else { this.clearFieldError('lot-sl'); }
      if (direction === 'sell' && sl <= entry) {
        this.showFieldError('lot-sl', 'SL must be above entry'); valid = false;
      } else if (direction === 'sell') { this.clearFieldError('lot-sl'); }
      if (tp > 0) {
        if (direction === 'buy' && tp <= entry) { this.showFieldError('lot-tp', 'TP above entry'); valid = false; }
        else if (direction === 'sell' && tp >= entry) { this.showFieldError('lot-tp', 'TP below entry'); valid = false; }
        else { this.clearFieldError('lot-tp'); }
      }
      if (!valid) { this.clearResults('lot'); this.clearHero(); return; }

      const slDist = Calc.slDistance(entry, sl);
      const pipDist = Calc.pipDistance(slDist, pip);
      const effectivePipDist = pipDist + spreadPips;
      const effectiveSlDist = effectivePipDist * pip;
      const rpl = Calc.riskPerLot(effectiveSlDist, pip, pipVal);
      const riskAmt = Calc.riskAmount(account, riskPct);
      const lot = Calc.lotSize(riskAmt, effectiveSlDist, pip, pipVal);
      const rounded = Calc.roundLot(lot, step);
      const grossLoss = Calc.pnl(entry, sl, rounded, contract, direction);
      const grossProfit = tp > 0 ? Calc.pnl(entry, tp, rounded, contract, direction) : 0;
      const rr = tp > 0 ? Calc.riskReward(entry, sl, tp, direction) : 0;
      const marginReq = Calc.margin(rounded, contract, entry, leverage);
      const expo = Calc.exposure(rounded, contract, entry);
      const effLev = marginReq > 0 ? expo / marginReq : 0;
      const commission = commissionPerLot * rounded;
      const spreadCost = spreadPips * pipVal * rounded;

      this.setValue('lot-risk-amount', Calc.fmt(riskAmt, 2));
      const precision = getDisplayPrecision(symbol);

      this.setText('lot-dir-display', direction === 'buy' ? 'Buy (Long)' : 'Sell (Short)');
      this.setText('lot-sl-dist', Calc.fmt(slDist, precision));
      this.setText('lot-pip-dist', Calc.fmt(pipDist, 1) + ' pips');
      this.setText('lot-effective-sl', Calc.fmt(effectivePipDist, 1) + ' pips');
      this.setText('lot-spread-cost', Calc.fmtUSD(spreadCost));
      this.setText('lot-risk-per-lot', Calc.fmtUSD(rpl));
      this.setText('lot-size', Calc.fmt(lot, 4) + ' lot');
      this.setText('lot-rounded', Calc.fmt(rounded, 2) + ' lot');
      this.setText('lot-loss', Calc.fmtUSD(Math.abs(grossLoss)));
      this.setText('lot-commission-cost', Calc.fmtUSD(commission));
      const netLoss = Math.abs(grossLoss) + commission + spreadCost;
      this.setText('lot-total-cost', Calc.fmtUSD(netLoss));
      this.setText('lot-profit', tp > 0 ? Calc.fmtUSD(grossProfit) : '\u2014');
      const netProfit = tp > 0 ? grossProfit - commission - spreadCost : 0;
      this.setText('lot-net-profit', tp > 0 ? Calc.fmtUSD(netProfit) : '\u2014');
      this.setText('lot-rr', tp > 0 ? '1:' + Calc.fmt(rr, 2) : '\u2014');
      this.setText('lot-margin', Calc.fmtUSD(marginReq));
      this.setText('lot-exposure', Calc.fmtUSD(expo));
      this.setText('lot-eff-lev', '1:' + Calc.fmt(effLev, 1));

      // === HERO RESULT CARD ===
      document.getElementById('hero-lot').textContent = rounded > 0 ? Calc.fmt(rounded, 2) : '—';
      document.getElementById('hero-loss').textContent = Calc.fmtUSD(Math.abs(grossLoss));
      document.getElementById('hero-profit').textContent = tp > 0 ? Calc.fmtUSD(grossProfit) : '\u2014';
      document.getElementById('hero-rr').textContent = tp > 0 ? '1:' + Calc.fmt(rr, 2) : '\u2014';

      // === TRADE VISUALIZER ===
      this.updateTradeViz(direction, entry, sl, tp, precision);

      // === MARKET SNAPSHOT ===
      const meta = getMeta(symbol);
      const asset = ASSETS[symbol];
      if (asset) {
        document.getElementById('spec-symbol').textContent = symbol;
        document.getElementById('spec-contract').textContent = Calc.fmt(asset.contractSize, 0);
        document.getElementById('spec-pip').textContent = asset.pipSize;
        document.getElementById('spec-tick').textContent = asset.tickSize;
        document.getElementById('pip-value-display').textContent = Calc.fmtUSD(pipVal);
        document.getElementById('spec-lot-step').textContent = asset.lotStep;
        document.getElementById('spec-margin-ccy').textContent = meta.marginCurrency;
        document.getElementById('spec-leverage').textContent = '1:' + asset.leverage;
      }

      // === RISK GAUGE ===
      this.updateRiskGauge(riskPct);

      // === METRICS ROW ===
      document.getElementById('mtr-balance').textContent = Calc.fmtUSD(account);
      document.getElementById('mtr-risk').textContent = Calc.fmtUSD(riskAmt);
      document.getElementById('mtr-lot').textContent = rounded > 0 ? Calc.fmt(rounded, 2) : '—';
      document.getElementById('mtr-rr').textContent = tp > 0 ? '1:' + Calc.fmt(rr, 2) : '—';

      // === FORMULA BREAKDOWN ===
      this.updateFormulaBreakdown({
        account, riskPct, riskAmt, direction, entry, sl, tp,
        contract, pip, pipVal, symbol, step, leverage,
        slDist, pipDist, effectivePipDist, effectiveSlDist,
        spreadPips, spreadCost, commissionPerLot, commission,
        rpl, lot, rounded, grossLoss, grossProfit, netLoss, netProfit,
        rr, margin: marginReq, expo, meta
      });

      App.updateDashboardAccount(account);
    } catch (err) {
      console.error('Lot calc error:', err);
    }
  },

  updateTradeViz(direction, entry, sl, tp, precision) {
    const viz = document.getElementById('trade-viz');
    if (!viz) return;
    const vizH = viz.offsetHeight || 200;
    const minPrice = direction === 'buy' ? Math.min(sl, entry) : Math.min(tp, entry, sl);
    const maxPrice = direction === 'buy' ? Math.max(tp, entry, sl) : Math.max(sl, entry);
    const range = maxPrice - minPrice || 1;
    const pct = function(price) { return ((price - minPrice) / range) * 100; };

    const tpZone = document.getElementById('viz-tp-zone');
    const slZone = document.getElementById('viz-sl-zone');
    const entryLine = document.getElementById('viz-entry-line');
    const labelTP = document.getElementById('viz-label-tp');
    const labelEntry = document.getElementById('viz-label-entry');
    const labelSL = document.getElementById('viz-label-sl');
    const axisTop = document.getElementById('viz-axis-top');
    const axisMid = document.getElementById('viz-axis-mid');
    const axisBot = document.getElementById('viz-axis-bot');

    if (direction === 'buy') {
      const tpPct = Math.max(0, Math.min(100, pct(tp || entry)));
      const slPct = Math.max(0, Math.min(100, pct(sl)));
      const entryPct = Math.max(0, Math.min(100, pct(entry)));
      tpZone.style.top = '0%';
      tpZone.style.height = Math.max(0, entryPct - 0) + '%';
      slZone.style.top = entryPct + '%';
      slZone.style.height = Math.max(0, 100 - entryPct) + '%';
      entryLine.style.top = entryPct + '%';
      labelTP.textContent = 'TP ' + Calc.fmt(tp, precision);
      labelTP.style.top = '4px';
      labelEntry.textContent = 'Entry ' + Calc.fmt(entry, precision);
      labelEntry.style.top = 'calc(' + entryPct + '% - 10px)';
      labelSL.textContent = 'SL ' + Calc.fmt(sl, precision);
      labelSL.style.top = 'calc(' + Math.max(slPct, entryPct + 5) + '% + 4px)';
    } else {
      const slPct = Math.max(0, Math.min(100, pct(sl)));
      const tpPct = Math.max(0, Math.min(100, pct(tp || entry)));
      const entryPct = Math.max(0, Math.min(100, pct(entry)));
      slZone.style.top = '0%';
      slZone.style.height = Math.max(0, entryPct - 0) + '%';
      tpZone.style.top = entryPct + '%';
      tpZone.style.height = Math.max(0, 100 - entryPct) + '%';
      entryLine.style.top = entryPct + '%';
      labelSL.textContent = 'SL ' + Calc.fmt(sl, precision);
      labelSL.style.top = '4px';
      labelEntry.textContent = 'Entry ' + Calc.fmt(entry, precision);
      labelEntry.style.top = 'calc(' + entryPct + '% - 10px)';
      labelTP.textContent = 'TP ' + Calc.fmt(tp, precision);
      labelTP.style.top = 'calc(' + Math.max(tpPct, entryPct + 5) + '% + 4px)';
    }

    axisTop.textContent = Calc.fmt(maxPrice, precision);
    axisMid.textContent = Calc.fmt((maxPrice + minPrice) / 2, precision);
    axisBot.textContent = Calc.fmt(minPrice, precision);
  },

  updateRiskGauge(riskPct) {
    const pct = Math.min((riskPct / 5) * 100, 100);
    document.getElementById('gauge-fill').style.width = pct + '%';
    const statusEl = document.getElementById('gauge-status');
    if (riskPct <= 1) {
      statusEl.textContent = 'Safe';
      statusEl.style.color = 'var(--green)';
    } else if (riskPct <= 2) {
      statusEl.textContent = 'Moderate';
      statusEl.style.color = 'var(--amber)';
    } else {
      statusEl.textContent = 'Aggressive';
      statusEl.style.color = 'var(--red)';
    }
  },

  clearHero() {
    document.getElementById('hero-lot').textContent = '—';
    document.getElementById('hero-loss').textContent = '—';
    document.getElementById('hero-profit').textContent = '—';
    document.getElementById('hero-rr').textContent = '—';
  },

  updateFormulaBreakdown(d) {
    const el = document.getElementById('formula-breakdown');
    var h = '';
    h += '<div class="fb-step"><span class="fb-label">Account:</span><span class="fb-val">' + Calc.fmtUSD(d.account) + '</span></div>';
    h += '<div class="fb-step"><span class="fb-label">Risk:</span><span class="fb-val">' + d.riskPct + '% = ' + Calc.fmtUSD(d.riskAmt) + '</span></div>';
    h += '<hr class="fb-hr" />';
    h += '<div class="fb-step"><span class="fb-label">Direction:</span><span class="fb-val">' + d.direction.toUpperCase() + '</span></div>';
    h += '<div class="fb-step"><span class="fb-label">Entry / SL / TP:</span><span class="fb-val">' + d.entry + ' / ' + d.sl + (d.tp > 0 ? ' / ' + d.tp : '') + '</span></div>';
    h += '<hr class="fb-hr" />';
    h += '<div class="fb-step"><span class="fb-label">SL Distance:</span><span class="fb-val">' + Calc.fmt(d.slDist, 5) + '</span></div>';
    h += '<div class="fb-step"><span class="fb-label">Pip Distance:</span><span class="fb-val">' + Calc.fmt(d.pipDist, 1) + ' pips</span></div>';
    if (d.spreadPips > 0) {
      h += '<div class="fb-step"><span class="fb-label">Spread:</span><span class="fb-val">+' + d.spreadPips + ' pips (cost: ' + Calc.fmtUSD(d.spreadCost) + ')</span></div>';
      h += '<div class="fb-step highlight"><span class="fb-label">Effective SL:</span><span class="fb-val">' + Calc.fmt(d.effectivePipDist, 1) + ' pips</span></div>';
    }
    h += '<div class="fb-step"><span class="fb-label">Pip Value:</span><span class="fb-val">' + Calc.fmtUSD(d.pipVal) + '</span></div>';
    h += '<div class="fb-step"><span class="fb-label">Risk per 1 Lot:</span><span class="fb-val">' + Calc.fmt(d.effectivePipDist, 1) + ' pips x ' + Calc.fmtUSD(d.pipVal) + ' = ' + Calc.fmtUSD(d.rpl) + '</span></div>';
    h += '<hr class="fb-hr" />';
    h += '<div class="fb-step"><span class="fb-label">Lot Size:</span><span class="fb-val">' + Calc.fmtUSD(d.riskAmt) + ' / ' + Calc.fmtUSD(d.rpl) + ' = ' + Calc.fmt(d.lot, 4) + ' lot</span></div>';
    h += '<div class="fb-step highlight"><span class="fb-label">Rounded Lot:</span><span class="fb-val">' + Calc.fmt(d.rounded, 2) + ' lot</span></div>';
    h += '<hr class="fb-hr" />';
    if (d.commissionPerLot > 0) {
      h += '<div class="fb-step"><span class="fb-label">Commission:</span><span class="fb-val">' + Calc.fmtUSD(d.commissionPerLot) + '/lot = ' + Calc.fmtUSD(d.commission) + '</span></div>';
    }
    h += '<div class="fb-step"><span class="fb-label">Gross Loss:</span><span class="fb-val fbt-loss">' + Calc.fmtUSD(Math.abs(d.grossLoss)) + '</span></div>';
    if (d.commission > 0 || d.spreadPips > 0) {
      h += '<div class="fb-step"><span class="fb-label">+ Spread + Commission:</span><span class="fb-val fbt-loss">+' + Calc.fmtUSD(d.commission + d.spreadCost) + '</span></div>';
      h += '<div class="fb-step highlight"><span class="fb-label">Total Cost:</span><span class="fb-val fbt-loss">' + Calc.fmtUSD(d.netLoss) + '</span></div>';
    }
    if (d.tp > 0) {
      h += '<div class="fb-step"><span class="fb-label">Gross Profit:</span><span class="fb-val fbt-profit">' + Calc.fmtUSD(d.grossProfit) + '</span></div>';
      if (d.commission > 0 || d.spreadPips > 0) {
        h += '<div class="fb-step"><span class="fb-label">- Spread - Commission:</span><span class="fb-val fbt-loss">-' + Calc.fmtUSD(d.commission + d.spreadCost) + '</span></div>';
        h += '<div class="fb-step highlight"><span class="fb-label">Net Profit:</span><span class="fb-val ' + (d.netProfit >= 0 ? 'fbt-profit' : 'fbt-loss') + '">' + Calc.fmtUSD(d.netProfit) + '</span></div>';
      }
      h += '<div class="fb-step"><span class="fb-label">R:R:</span><span class="fb-val">1:' + Calc.fmt(d.rr, 2) + '</span></div>';
    }
    el.innerHTML = h;
  },

  calculatePip() {
    try {
      const contract = this.getValue('pip-contract');
      const pipSize = this.getValue('pip-size');
      const price = this.getValue('pip-price') || 1;
      const lot = this.getValue('pip-lot') || 1;
      const pipVal = (pipSize * contract * lot) / price;
      const tickVal = pipVal / 10;
      this.setText('pip-value', Calc.fmtUSD(pipVal));
      this.setText('tick-value', Calc.fmtUSD(tickVal));
      this.setText('point-value', Calc.fmtUSD(pipVal));
      this.setText('pip-10', Calc.fmtUSD(pipVal * 10));
      this.setText('pip-100', Calc.fmtUSD(pipVal * 100));
    } catch (err) { console.error('Pip calc error:', err); }
  },

  calculateProfit() {
    try {
      const direction = this.getSelect('profit-direction');
      const entry = this.getValue('profit-entry');
      const exit = this.getValue('profit-exit');
      const lot = this.getValue('profit-lot');
      const contract = this.getValue('profit-contract');
      const account = this.getValue('profit-account');
      const profit = Calc.pnl(entry, exit, lot, contract, direction);
      const pct = account > 0 ? (profit / account) * 100 : 0;
      const move = Calc.slDistance(entry, exit);
      const profitEl = document.getElementById('profit-amount');
      profitEl.textContent = Calc.fmtUSD(profit);
      profitEl.className = 'r-val ' + (profit >= 0 ? 'green' : 'red');
      const pctEl = document.getElementById('profit-percent');
      pctEl.textContent = Calc.fmtPct(pct);
      pctEl.className = 'r-val ' + (pct >= 0 ? 'green' : 'red');
      this.setText('profit-move', Calc.fmt(move, 5));
      const estPipSize = entry > 10 ? 0.01 : 0.0001;
      this.setText('profit-pips', Calc.fmt(move / estPipSize, 1) + ' pips');
      this.setText('profit-dir-display', direction === 'buy' ? 'Buy (Long)' : 'Sell (Short)');
    } catch (err) { console.error('Profit calc error:', err); }
  },

  calculateRR() {
    try {
      const direction = this.getSelect('rr-direction');
      const entry = this.getValue('rr-entry');
      const sl = this.getValue('rr-sl');
      const tp = this.getValue('rr-tp');
      if (!entry || !sl || !tp) { this.clearResults('rr'); return; }
      let valid = true;
      if (direction === 'buy') {
        if (sl >= entry) { this.showFieldError('rr-sl', 'SL below entry'); valid = false; } else { this.clearFieldError('rr-sl'); }
        if (tp <= entry) { this.showFieldError('rr-tp', 'TP above entry'); valid = false; } else { this.clearFieldError('rr-tp'); }
      } else {
        if (sl <= entry) { this.showFieldError('rr-sl', 'SL above entry'); valid = false; } else { this.clearFieldError('rr-sl'); }
        if (tp >= entry) { this.showFieldError('rr-tp', 'TP below entry'); valid = false; } else { this.clearFieldError('rr-tp'); }
      }
      if (!valid) { this.clearResults('rr'); return; }
      const rr = Calc.riskReward(entry, sl, tp, direction);
      const winrate = Calc.breakEvenWinRate(rr);
      let risk, reward;
      if (direction === 'buy') { risk = entry - sl; reward = tp - entry; }
      else { risk = sl - entry; reward = entry - tp; }
      let quality = 'Poor';
      if (rr >= 3) quality = 'Excellent';
      else if (rr >= 2) quality = 'Good';
      else if (rr >= 1) quality = 'Fair';
      this.setText('rr-dir-display', direction === 'buy' ? 'Buy (Long)' : 'Sell (Short)');
      this.setText('rr-risk', Calc.fmt(Math.abs(risk), 5));
      this.setText('rr-reward', Calc.fmt(Math.abs(reward), 5));
      this.setText('rr-ratio', '1:' + Calc.fmt(rr, 2));
      this.setText('rr-winrate', Calc.fmtPct(winrate));
      this.setText('rr-quality', quality);
    } catch (err) { console.error('RR calc error:', err); }
  },

  calculateMargin() {
    try {
      const lot = this.getValue('margin-lot');
      const contract = this.getValue('margin-contract');
      const price = this.getValue('margin-price');
      const leverage = this.getValue('margin-leverage') || 1;
      if (!lot || !contract || !price) { this.clearResults('margin'); return; }
      const marginReq = Calc.margin(lot, contract, price, leverage);
      const expo = Calc.exposure(lot, contract, price);
      const effLev = marginReq > 0 ? expo / marginReq : 0;
      const account = this.getValue('margin-account');
      const usagePct = account > 0 ? (marginReq / account) * 100 : 0;
      this.setText('margin-required', Calc.fmtUSD(marginReq));
      this.setText('margin-exposure', Calc.fmtUSD(expo));
      this.setText('margin-effective', '1:' + Calc.fmt(effLev, 0));
      this.setText('margin-percent', Calc.fmtPct(usagePct));
    } catch (err) { console.error('Margin calc error:', err); }
  },

  calculatePropFirm() {
    try {
      const account = this.getValue('prop-account');
      const currentBal = this.getValue('prop-balance');
      const dailyPct = this.getValue('prop-daily');
      const maxPct = this.getValue('prop-max');
      const targetPct = this.getValue('prop-target');
      const result = Calc.propFirmStatus(account, currentBal, dailyPct, maxPct, targetPct);
      this.setText('prop-max-daily', Calc.fmtUSD(result.maxDailyLoss));
      this.setText('prop-max-total', Calc.fmtUSD(result.maxTotalLoss));
      this.setText('prop-daily-floor', Calc.fmtUSD(result.dailyFloor));
      this.setText('prop-total-floor', Calc.fmtUSD(result.totalFloor));
      this.setText('prop-target-amt', Calc.fmtUSD(result.targetAmount));
      const plEl = document.getElementById('prop-current-pl');
      plEl.textContent = Calc.fmtUSD(result.currentPL);
      plEl.className = 'r-val ' + (result.currentPL >= 0 ? 'green' : 'red');
      this.setText('prop-dist-target', Calc.fmtUSD(result.distToTarget));
      this.setText('prop-remaining-daily', Calc.fmtUSD(result.dailyFloor > 0 ? currentBal - result.dailyFloor : 0));
      this.setText('prop-remaining-total', Calc.fmtUSD(result.totalFloor > 0 ? currentBal - result.totalFloor : 0));
      const statusEl = document.getElementById('prop-status');
      statusEl.textContent = result.status;
      if (result.status.includes('BREACH')) statusEl.className = 'r-val status-breach';
      else if (result.status.includes('TARGET')) statusEl.className = 'r-val status-target';
      else if (result.status.includes('WARNING')) statusEl.className = 'r-val status-warning';
      else statusEl.className = 'r-val status-compliant';
    } catch (err) { console.error('PropFirm error:', err); }
  },

  loadPropFirm() {
    const firm = this.getSelect('prop-firm');
    const preset = PROP_FIRMS[firm];
    if (!preset) return;
    this.setValue('prop-daily', preset.dailyLoss);
    this.setValue('prop-max', preset.maxLoss);
    this.setValue('prop-target', preset.profitTarget);
    this.calculatePropFirm();
  },

  calculateDrawdown() {
    try {
      const account = this.getValue('dd-account');
      const riskPct = this.getValue('dd-risk');
      const numLosses = parseInt(document.getElementById('dd-losses').value) || 10;
      if (account <= 0 || riskPct <= 0) { this.setText('dd-output', 'Enter account and risk values.'); return; }
      var h = '<table class="dd-table"><thead><tr><th>Loss #</th><th>Risk Amount</th><th>Balance After</th><th>Drawdown %</th></tr></thead><tbody>';
      var bal = account;
      for (var i = 1; i <= numLosses; i++) {
        var riskAmt = bal * (riskPct / 100);
        bal = bal - riskAmt;
        var ddPct = ((account - bal) / account) * 100;
        if (bal <= 0) { h += '<tr><td>' + i + '</td><td colspan="3" style="color:var(--danger)">Account depleted</td></tr>'; break; }
        h += '<tr><td>' + i + '</td><td>' + Calc.fmtUSD(riskAmt) + '</td><td>' + Calc.fmtUSD(bal) + '</td><td>' + Calc.fmtPct(ddPct) + '</td></tr>';
      }
      h += '</tbody></table>';
      h += '<div class="dd-summary">Start: ' + Calc.fmtUSD(account) + ' | End: ' + Calc.fmtUSD(bal) + ' | Max DD: ' + Calc.fmtPct(((account - bal) / account) * 100) + '</div>';
      this.setHTML('dd-output', h);
    } catch (err) { console.error('Drawdown error:', err); }
  },

  calculateHeatmap() {
    try {
      const account = this.getValue('hm-account') || 10000;
      const levels = [{ pct: 0.25, label: 'Safe' }, { pct: 0.5, label: 'Conservative' }, { pct: 1, label: 'Standard' }, { pct: 2, label: 'Aggressive' }, { pct: 5, label: 'Dangerous' }];
      var h = '<table class="hm-table"><thead><tr><th>Risk %</th><th>Amount</th><th>Label</th><th>Status</th></tr></thead><tbody>';
      levels.forEach(function(l) {
        var amt = account * (l.pct / 100);
        var cls = l.pct <= 0.5 ? 'hm-safe' : l.pct <= 1 ? 'hm-moderate' : l.pct <= 2 ? 'hm-aggressive' : 'hm-danger';
        h += '<tr class="' + cls + '"><td>' + l.pct + '%</td><td>' + Calc.fmtUSD(amt) + '</td><td>' + l.label + '</td><td><span class="hm-dot ' + cls + '"></span></td></tr>';
      });
      h += '</tbody></table>';
      this.setHTML('hm-output', h);
    } catch (err) { console.error('Heatmap error:', err); }
  },

  calculateMultiPosition() {
    try {
      var positions = [];
      for (var i = 1; i <= 5; i++) {
        var val = this.getValue('mp-risk-' + i);
        if (val > 0) positions.push(val);
      }
      if (positions.length === 0) { this.setText('mp-output', 'Enter at least one position risk %.'); return; }
      var total = positions.reduce(function(a, b) { return a + b; }, 0);
      var account = this.getValue('mp-account') || 10000;
      var h = '<table class="mp-table"><thead><tr><th>Position</th><th>Risk %</th><th>Amount</th><th>% of Total</th></tr></thead><tbody>';
      positions.forEach(function(p, i) {
        var amt = account * (p / 100);
        var share = (p / total) * 100;
        h += '<tr><td>' + (i + 1) + '</td><td>' + p + '%</td><td>' + Calc.fmtUSD(amt) + '</td><td>' + Calc.fmt(share, 1) + '%</td></tr>';
      });
      var totalAmt = account * (total / 100);
      h += '</tbody></table>';
      h += '<div class="mp-total"><strong>Total Portfolio Risk:</strong> ' + total + '% (' + Calc.fmtUSD(totalAmt) + ')</div>';
      var status = total <= 2 ? 'Conservative' : total <= 5 ? 'Moderate' : total <= 10 ? 'Aggressive' : 'High Risk';
      h += '<div class="mp-status"><span class="' + (total <= 2 ? 'positive' : total <= 5 ? '' : 'negative') + '">' + status + '</span></div>';
      this.setHTML('mp-output', h);
    } catch (err) { console.error('Multi-position error:', err); }
  },

  showFieldError(fieldId, msg) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.add('input-error');
    const parent = el.closest('.field');
    if (!parent) return;
    let errEl = parent.querySelector('.field-error');
    if (!errEl) { errEl = document.createElement('span'); errEl.className = 'field-error'; parent.appendChild(errEl); }
    errEl.textContent = msg;
  },

  clearFieldError(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.remove('input-error');
    const parent = el.closest('.field');
    if (!parent) return;
    const errEl = parent.querySelector('.field-error');
    if (errEl) errEl.remove();
  },

  removeValidation(tab) {
    document.querySelectorAll('.input-error').forEach(function(el) { el.classList.remove('input-error'); });
    document.querySelectorAll('.field-error').forEach(function(el) { el.remove(); });
  },

  clearResults(tab) {
    const ids = {
      lot: ['lot-dir-display','lot-sl-dist','lot-pip-dist','lot-effective-sl','lot-spread-cost','lot-risk-per-lot','lot-size','lot-rounded','lot-loss','lot-commission-cost','lot-total-cost','lot-profit','lot-net-profit','lot-rr','lot-margin','lot-exposure','lot-eff-lev'],
      pip: ['pip-value','tick-value','point-value','pip-10','pip-100'],
      profit: ['profit-amount','profit-percent','profit-move','profit-pips','profit-dir-display'],
      rr: ['rr-risk','rr-reward','rr-ratio','rr-winrate','rr-quality','rr-dir-display'],
      margin: ['margin-required','margin-exposure','margin-effective','margin-percent']
    };
    (ids[tab] || []).forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.textContent = '\u2014';
    });
  },

  toast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (type ? ' toast-' + type : '');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(function() { t.classList.remove('show'); }, 2500);
  }
};
