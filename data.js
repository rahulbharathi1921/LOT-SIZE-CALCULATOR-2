const BROKER_PRESETS = {
  generic: { name: 'Generic', leverage: 100, lotStep: 0.01, pipValueEURUSD: 10, notes: 'Standard retail broker' },
  ftmo: { name: 'FTMO', leverage: 100, lotStep: 0.01, pipValueEURUSD: 10, notes: 'FTMO Challenge accounts' },
  goat: { name: 'Goat Funded Trader', leverage: 100, lotStep: 0.01, pipValueEURUSD: 10, notes: 'Goat Funded Trader' },
  icmarkets: { name: 'IC Markets', leverage: 500, lotStep: 0.01, pipValueEURUSD: 10, notes: 'IC Markets Raw Spread' },
  exness: { name: 'Exness', leverage: 200, lotStep: 0.01, pipValueEURUSD: 10, notes: 'Exness Standard' },
  custom: { name: 'Custom', leverage: 100, lotStep: 0.01, pipValueEURUSD: 10, notes: 'User-defined' }
};

const PROP_FIRMS = {
  ftmo: { name: 'FTMO', dailyLoss: 5, maxLoss: 10, profitTarget: 10 },
  myforexfunds: { name: 'MyForexFunds', dailyLoss: 4, maxLoss: 8, profitTarget: 8 },
  fundednext: { name: 'FundedNext', dailyLoss: 5, maxLoss: 10, profitTarget: 10 },
  the5ers: { name: 'The5ers', dailyLoss: 3, maxLoss: 4, profitTarget: 8 },
  goat: { name: 'Goat Funded Trader', dailyLoss: 4, maxLoss: 8, profitTarget: 8 },
  custom: { name: 'Custom', dailyLoss: 5, maxLoss: 10, profitTarget: 10 }
};

const ASSETS = {
  EURUSD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  GBPUSD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  AUDUSD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  NZDUSD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  USDCAD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  USDCHF: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  EURGBP: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  EURCHF: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  GBPAUD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  GBPCAD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  GBPCHF: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  EURAUD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  EURNZD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  AUDCAD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  AUDCHF: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  NZDCAD: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },
  NZDCHF: { type:'forex', contractSize:100000, pipSize:0.0001, tickSize:0.00001, pipValuePerLot:10, lotStep:0.01, leverage:100 },

  USDJPY: { type:'forex', contractSize:100000, pipSize:0.01, tickSize:0.001, pipValuePerLot:0, lotStep:0.01, leverage:100 },
  EURJPY: { type:'forex', contractSize:100000, pipSize:0.01, tickSize:0.001, pipValuePerLot:0, lotStep:0.01, leverage:100 },
  GBPJPY: { type:'forex', contractSize:100000, pipSize:0.01, tickSize:0.001, pipValuePerLot:0, lotStep:0.01, leverage:100 },
  NZDJPY: { type:'forex', contractSize:100000, pipSize:0.01, tickSize:0.001, pipValuePerLot:0, lotStep:0.01, leverage:100 },
  AUDJPY: { type:'forex', contractSize:100000, pipSize:0.01, tickSize:0.001, pipValuePerLot:0, lotStep:0.01, leverage:100 },
  CHFJPY: { type:'forex', contractSize:100000, pipSize:0.01, tickSize:0.001, pipValuePerLot:0, lotStep:0.01, leverage:100 },
  CADJPY: { type:'forex', contractSize:100000, pipSize:0.01, tickSize:0.001, pipValuePerLot:0, lotStep:0.01, leverage:100 },

  XAUUSD: { type:'metal', contractSize:100, pipSize:0.01, tickSize:0.01, pipValuePerLot:1, lotStep:0.01, leverage:100 },
  XAGUSD: { type:'metal', contractSize:5000, pipSize:0.001, tickSize:0.001, pipValuePerLot:5, lotStep:0.01, leverage:100 },
  XPTUSD: { type:'metal', contractSize:100, pipSize:0.01, tickSize:0.01, pipValuePerLot:1, lotStep:0.01, leverage:100 },
  XPDUSD: { type:'metal', contractSize:100, pipSize:0.01, tickSize:0.01, pipValuePerLot:1, lotStep:0.01, leverage:100 },

  BTCUSD: { type:'crypto', contractSize:1, pipSize:0.01, tickSize:0.01, pipValuePerLot:0.01, lotStep:0.001, leverage:100 },
  ETHUSD: { type:'crypto', contractSize:1, pipSize:0.01, tickSize:0.01, pipValuePerLot:0.01, lotStep:0.001, leverage:100 },
  SOLUSD: { type:'crypto', contractSize:1, pipSize:0.01, tickSize:0.01, pipValuePerLot:0.01, lotStep:0.001, leverage:100 },
  XRPUSD: { type:'crypto', contractSize:1, pipSize:0.001, tickSize:0.001, pipValuePerLot:0.001, lotStep:0.001, leverage:100 },

  TECH100: { type:'index', contractSize:10, pipSize:0.1, tickSize:0.1, pipValuePerLot:1, lotStep:0.01, leverage:100 },
  DJ30: { type:'index', contractSize:10, pipSize:0.1, tickSize:0.1, pipValuePerLot:1, lotStep:0.01, leverage:100 },
  US500: { type:'index', contractSize:10, pipSize:0.1, tickSize:0.1, pipValuePerLot:1, lotStep:0.01, leverage:100 },
  GER40: { type:'index', contractSize:10, pipSize:0.1, tickSize:0.1, pipValuePerLot:1, lotStep:0.01, leverage:100 },
  UK100: { type:'index', contractSize:10, pipSize:0.1, tickSize:0.1, pipValuePerLot:1, lotStep:0.01, leverage:100 }
};

const ASSET_LISTS = {
  forex: ['EURUSD','GBPUSD','AUDUSD','NZDUSD','USDCAD','USDCHF','EURGBP','EURCHF','GBPAUD','GBPCAD','GBPCHF','EURAUD','EURNZD','AUDCAD','AUDCHF','NZDCAD','NZDCHF','USDJPY','EURJPY','GBPJPY','NZDJPY','AUDJPY','CHFJPY','CADJPY'],
  metal: ['XAUUSD','XAGUSD','XPTUSD','XPDUSD'],
  crypto: ['BTCUSD','ETHUSD','SOLUSD','XRPUSD'],
  index: ['TECH100','DJ30','US500','GER40','UK100']
};

const SYMBOL_META = {
  EURUSD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Euro vs US Dollar' },
  GBPUSD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Pound vs US Dollar' },
  AUDUSD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Australian Dollar vs US Dollar' },
  NZDUSD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'New Zealand Dollar vs US Dollar' },
  USDCAD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'US Dollar vs Canadian Dollar' },
  USDCHF: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'US Dollar vs Swiss Franc' },
  EURGBP: { minLot:0.01, maxLot:100, marginCurrency:'GBP', profitCurrency:'GBP', description:'Euro vs Pound' },
  EURCHF: { minLot:0.01, maxLot:100, marginCurrency:'CHF', profitCurrency:'CHF', description:'Euro vs Swiss Franc' },
  GBPAUD: { minLot:0.01, maxLot:100, marginCurrency:'AUD', profitCurrency:'AUD', description:'Pound vs Australian Dollar' },
  GBPCAD: { minLot:0.01, maxLot:100, marginCurrency:'CAD', profitCurrency:'CAD', description:'Pound vs Canadian Dollar' },
  GBPCHF: { minLot:0.01, maxLot:100, marginCurrency:'CHF', profitCurrency:'CHF', description:'Pound vs Swiss Franc' },
  EURAUD: { minLot:0.01, maxLot:100, marginCurrency:'AUD', profitCurrency:'AUD', description:'Euro vs Australian Dollar' },
  EURNZD: { minLot:0.01, maxLot:100, marginCurrency:'NZD', profitCurrency:'NZD', description:'Euro vs New Zealand Dollar' },
  AUDCAD: { minLot:0.01, maxLot:100, marginCurrency:'CAD', profitCurrency:'CAD', description:'Australian Dollar vs Canadian Dollar' },
  AUDCHF: { minLot:0.01, maxLot:100, marginCurrency:'CHF', profitCurrency:'CHF', description:'Australian Dollar vs Swiss Franc' },
  NZDCAD: { minLot:0.01, maxLot:100, marginCurrency:'CAD', profitCurrency:'CAD', description:'NZ Dollar vs Canadian Dollar' },
  NZDCHF: { minLot:0.01, maxLot:100, marginCurrency:'CHF', profitCurrency:'CHF', description:'NZ Dollar vs Swiss Franc' },
  USDJPY: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'JPY', description:'US Dollar vs Japanese Yen' },
  EURJPY: { minLot:0.01, maxLot:100, marginCurrency:'JPY', profitCurrency:'JPY', description:'Euro vs Japanese Yen' },
  GBPJPY: { minLot:0.01, maxLot:100, marginCurrency:'JPY', profitCurrency:'JPY', description:'Pound vs Japanese Yen' },
  NZDJPY: { minLot:0.01, maxLot:100, marginCurrency:'JPY', profitCurrency:'JPY', description:'NZ Dollar vs Japanese Yen' },
  AUDJPY: { minLot:0.01, maxLot:100, marginCurrency:'JPY', profitCurrency:'JPY', description:'Australian Dollar vs Japanese Yen' },
  CHFJPY: { minLot:0.01, maxLot:100, marginCurrency:'JPY', profitCurrency:'JPY', description:'Swiss Franc vs Japanese Yen' },
  CADJPY: { minLot:0.01, maxLot:100, marginCurrency:'JPY', profitCurrency:'JPY', description:'Canadian Dollar vs Japanese Yen' },
  XAUUSD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Gold vs US Dollar' },
  XAGUSD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Silver vs US Dollar' },
  XPTUSD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Platinum vs US Dollar' },
  XPDUSD: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Palladium vs US Dollar' },
  BTCUSD: { minLot:0.001, maxLot:1000, marginCurrency:'USD', profitCurrency:'USD', description:'Bitcoin vs US Dollar' },
  ETHUSD: { minLot:0.001, maxLot:1000, marginCurrency:'USD', profitCurrency:'USD', description:'Ethereum vs US Dollar' },
  SOLUSD: { minLot:0.001, maxLot:1000, marginCurrency:'USD', profitCurrency:'USD', description:'Solana vs US Dollar' },
  XRPUSD: { minLot:0.001, maxLot:1000, marginCurrency:'USD', profitCurrency:'USD', description:'Ripple vs US Dollar' },
  TECH100: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Tech 100 Index' },
  DJ30: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'Dow Jones 30 Index' },
  US500: { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'S&P 500 Index' },
  GER40: { minLot:0.01, maxLot:100, marginCurrency:'EUR', profitCurrency:'EUR', description:'DAX 40 Index' },
  UK100: { minLot:0.01, maxLot:100, marginCurrency:'GBP', profitCurrency:'GBP', description:'FTSE 100 Index' }
};

function getMeta(symbol) {
  return SYMBOL_META[symbol] || { minLot:0.01, maxLot:100, marginCurrency:'USD', profitCurrency:'USD', description:'' };
}

function getEffectivePipValue(symbol, price) {
  const asset = ASSETS[symbol];
  if (!asset) return 10;
  if (asset.pipValuePerLot !== 0) return asset.pipValuePerLot;
  if (price === 0) return 0;
  return (asset.pipSize * asset.contractSize) / price;
}

function getDisplayPrecision(symbol) {
  const asset = ASSETS[symbol];
  if (!asset) return 5;
  return asset.pipSize <= 0.0001 ? 5 : asset.pipSize <= 0.01 ? 3 : 2;
}

function getPipDisplay(pipSize) {
  if (pipSize >= 0.01) return pipSize;
  return pipSize;
}
