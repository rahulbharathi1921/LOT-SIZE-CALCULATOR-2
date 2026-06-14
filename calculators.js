const Calc = {
  riskAmount(account, riskPercent) {
    return account * (riskPercent / 100);
  },

  slDistance(entry, sl) {
    return Math.abs(entry - sl);
  },

  pipDistance(slDist, pipSize) {
    if (pipSize === 0) return 0;
    return slDist / pipSize;
  },

  riskPerLot(slDist, pipSize, pipValuePerLot) {
    if (pipSize === 0) return 0;
    const pips = slDist / pipSize;
    return pips * pipValuePerLot;
  },

  lotSize(riskAmount, slDist, pipSize, pipValuePerLot) {
    const riskPerLot = this.riskPerLot(slDist, pipSize, pipValuePerLot);
    if (riskPerLot === 0) return 0;
    return riskAmount / riskPerLot;
  },

  roundLot(lot, step) {
    if (step === 0) return lot;
    return Math.floor(lot / step) * step;
  },

  pnl(entry, exit, lot, contractSize, direction = 'buy') {
    let priceDiff;
    if (direction === 'buy') {
      priceDiff = exit - entry;
    } else if (direction === 'sell') {
      priceDiff = entry - exit;
    } else {
      priceDiff = exit - entry;
    }
    return priceDiff * contractSize * lot;
  },

  riskReward(entry, sl, tp, direction = 'buy') {
    let risk, reward;
    if (direction === 'buy') {
      risk = entry - sl;
      reward = tp - entry;
    } else {
      risk = sl - entry;
      reward = entry - tp;
    }
    risk = Math.abs(risk);
    reward = Math.abs(reward);
    if (risk === 0) return 0;
    return reward / risk;
  },

  breakEvenWinRate(rr) {
    if (rr === 0) return 100;
    return (1 / (1 + rr)) * 100;
  },

  margin(lot, contractSize, price, leverage) {
    if (leverage === 0) return 0;
    return (lot * contractSize * price) / leverage;
  },

  exposure(lot, contractSize, price) {
    return lot * contractSize * price;
  },

  pipValue(contractSize, pipSize, price = 1) {
    if (price === 0) return 0;
    return (pipSize * contractSize) / price;
  },

  profitFactor(trades) {
    let grossProfit = 0, grossLoss = 0;
    trades.forEach(t => {
      if (t.pnl > 0) grossProfit += t.pnl;
      else grossLoss += Math.abs(t.pnl);
    });
    if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
    return grossProfit / grossLoss;
  },

  fmt(num, decimals = 2) {
    if (!isFinite(num) || isNaN(num)) return '\u2014';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  fmtUSD(num) {
    if (!isFinite(num) || isNaN(num)) return '\u2014';
    const sign = num < 0 ? '-' : '';
    return sign + '$' + this.fmt(Math.abs(num), 2);
  },

  fmtPct(num) {
    if (!isFinite(num) || isNaN(num)) return '\u2014';
    return this.fmt(num, 2) + '%';
  },

  propFirmStatus(account, currentBalance, dailyLossPct, maxLossPct, profitTargetPct) {
    const maxDailyLoss = account * (dailyLossPct / 100);
    const maxTotalLoss = account * (maxLossPct / 100);
    const dailyFloor = account - maxDailyLoss;
    const totalFloor = account - maxTotalLoss;
    const targetAmount = account * (profitTargetPct / 100);
    const currentPL = currentBalance - account;
    const distToTarget = targetAmount - currentPL;
    const remainingDaily = (currentBalance - dailyFloor);
    const remainingTotal = (currentBalance - totalFloor);

    let status = 'COMPLIANT';
    if (currentBalance <= totalFloor) status = 'BREACH \u2014 Total Loss';
    else if (currentBalance <= dailyFloor) status = 'BREACH \u2014 Daily Loss';
    else if (currentPL >= targetAmount) status = 'TARGET HIT';
    else if (remainingDaily < maxDailyLoss * 0.3) status = 'WARNING \u2014 Daily Limit Near';

    return {
      maxDailyLoss, maxTotalLoss, dailyFloor, totalFloor,
      targetAmount, currentPL, distToTarget, status
    };
  }
};
