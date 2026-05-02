// CRYPTO.JS

const COINS = [
    { id: "bitcoin", symbol: "BTC", ws: "btcusd" },
    { id: "ethereum", symbol: "ETH", ws: "ethusd" },
    { id: "tether", symbol: "USDT", ws: "usdtusd" },
    { id: "binancecoin", symbol: "BNB", ws: "bnbusd" },
    { id: "bitcoin-cash", symbol: "BCH", ws: "bchusd" },
    { id: "solana", symbol: "SOL", ws: "solusd" },
    { id: "litecoin", symbol: "LTC", ws: "ltcusd" },
    { id: "chainlink", symbol: "LINK", ws: "linkusd" },
    { id: "uniswap", symbol: "UNI", ws: "uniusd" },
    { id: "polkadot", symbol: "DOT", ws: "dotusd" },
    { id: "internet-computer", symbol: "ICP", ws: "icpusd" },
    { id: "near", symbol: "NEAR", ws: "nearusd" },
    { id: "ripple", symbol: "XRP", ws: "xrpusd" },
    { id: "cardano", symbol: "ADA", ws: "adausd" },
    { id: "tron", symbol: "TRX", ws: "trxusd" },
    { id: "axie-infinity", symbol: "AXS", ws: "axsusd" },
    { id: "apecoin", symbol: "APE", ws: "apeusd" },
    { id: "filecoin", symbol: "FIL", ws: "filusd" },
    { id: "sui", symbol: "SUI", ws: "suiusd" },
    { id: "arbitrum", symbol: "ARB", ws: "arbusdt" }
];

// ======= GLOBALS ======== //
window.fallbackPrices = window.fallbackPrices || {};
window.latestPrices = window.latestPrices || {};

const priceCache = {};
const lastSeen = {};

const REST_MIN_MS = 700;
const BACKGROUND_REFRESH_DEBOUNCE = 900;
const SYNC_FRESH_MS = 500;

const $ = id => document.getElementById(id);
const listRoot = $('crypto-list');

// ======== LIST UI ========= //
function mkRowSkeleton(id) {
    const row = document.createElement('div');
    row.className = 'cv-row';
    row.dataset.coinId = id;
    row.innerHTML = `
      <div class="cv-left">
        <img class="cv-logo" id="logo-${id}" alt="${id} logo" src="">
        <div class="cv-symbol-wrap">
          <span class="cv-symbol" id="sym-${id}">-</span>
          <span class="cv-time" id="time-${id}">--:--:--</span>
        </div>
      </div>
      <div class="cv-change">
        <span id="pill-${id}" class="cv-pill cv-red">-</span>
      </div>
      <div class="cv-right">
        <div class="cv-price" id="price-${id}">-</div>
        <div class="cv-hl" id="hl-${id}">H:- L:-</div>
      </div>
    `;
    return row;
}

// ====== SEARCH FILTER ======= //
let allRows = [];

function buildList() {
    if (!listRoot) return;
    listRoot.innerHTML = '';
    allRows = [];

    COINS.forEach((c, i) => {
        const r = mkRowSkeleton(c.id);
        r.addEventListener('click', () => openModalForCoin(c));
        listRoot.appendChild(r);
        allRows.push(r);

        if (i < COINS.length - 1) {
            const gap = document.createElement('div');
            gap.className = 'cv-list-gap';
            listRoot.appendChild(gap);
        }
    });
}

function setupCryptoSearch() {
    const searchInput = $('searchAsset');
    if (!searchInput || !listRoot) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();

        if (query === '') {
            allRows.forEach(row => {
                row.style.display = '';
            });
            return;
        }

        allRows.forEach(row => {
            const coinId = row.dataset.coinId;
            const coin = COINS.find(c => c.id === coinId);
            if (!coin) return;

            const matches =
                coin.symbol.toLowerCase().includes(query) ||
                coin.id.toLowerCase().includes(query);

            row.style.display = matches ? '' : 'none';
        });
    });

    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
    });
}

// ========  COINGECKO INITIAL FETCH  ======= //
async function fetchInitialMarkets() {
    try {
        const ids = COINS.map(c => c.id).join(',');
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('CoinGecko fetch failed ' + res.status);
        const data = await res.json();

        data.forEach(d => {
            const coin = COINS.find(c => c.id === d.id);
            if (!coin) return;

            window.fallbackPrices[coin.symbol.toUpperCase()] = d.current_price;
            window.fallbackPrices[coin.ws.toUpperCase()] = d.current_price;

            const logo = $('logo-' + d.id);
            const sym = $('sym-' + d.id);
            const timeEl = $('time-' + d.id);
            const priceEl = $('price-' + d.id);
            const pill = $('pill-' + d.id);
            const hl = $('hl-' + d.id);

            if (logo) logo.src = d.image || '';
            if (sym) sym.textContent = coin.symbol.toUpperCase();
            if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
            if (priceEl) priceEl.textContent = formatPrice(d.current_price);
            if (hl) hl.textContent = `H:${formatSmall(d.high_24h)} - L:${formatSmall(d.low_24h)}`;

            const pct = Number(d.price_change_percentage_24h);
            if (pill && !Number.isNaN(pct)) {
                pill.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                pill.className = 'cv-pill ' + (pct >= 0 ? 'cv-green' : 'cv-red');
            }
        });
    } catch (err) {
        console.error('fetchInitialMarkets error', err);
    }
}

// =======  BINANCE WEBSOCKET ======== //
let combinedSocket = null;
let combinedReconnectDelay = 1000;
let combinedReconnectTimer = null;
let combinedOpenAttempting = false;
let lastCombinedMessageTs = 0;
const COMBINED_MAX_BACKOFF = 60000;

function makeCombinedStreams(coins) {
    return coins.map(c => `${c.ws}@aggTrade`).join('/');
}

function openCombinedBinanceSocket() {
    if (combinedSocket && combinedSocket.readyState === WebSocket.OPEN) return;
    if (combinedOpenAttempting) return;
    combinedOpenAttempting = true;

    const streams = makeCombinedStreams(COINS);
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
        combinedSocket = new WebSocket(url);

        combinedSocket.onopen = () => {
            combinedOpenAttempting = false;
            combinedReconnectDelay = 1000;
            lastCombinedMessageTs = Date.now();
        };

        combinedSocket.onmessage = (evt) => {
            lastCombinedMessageTs = Date.now();
            try {
                const obj = JSON.parse(evt.data);
                const data = obj && obj.data ? obj.data : obj;
                const price = parseFloat(data.p);
                const tradeTime = Number(data.T) || Date.now();
                const pairU = (data.s || '').toUpperCase();
                const sym = pairU.replace(/USDT$/, '');

                if (!Number.isFinite(price) || !pairU) return;

                window.latestPrices[sym] = price;
                window.latestPrices[pairU] = price;
                lastSeen[sym] = tradeTime;
                lastSeen[pairU] = tradeTime;

                priceCache[pairU] = { price, ts: Date.now() };

                const coinCfg = COINS.find(cc => cc.ws.toUpperCase() === pairU || cc.symbol.toUpperCase() === sym.toUpperCase());
                if (coinCfg) {
                    const priceEl = $('price-' + coinCfg.id);
                    const timeEl = $('time-' + coinCfg.id);
                    if (priceEl) priceEl.textContent = formatPrice(price);
                    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
                }
            } catch (e) { /* ignore */ }
        };

        combinedSocket.onerror = () => { /* silent */ };
        combinedSocket.onclose = () => {
            combinedOpenAttempting = false;
            scheduleCombinedReconnect();
        };

        startCombinedWatchdog();
    } catch (err) {
        combinedOpenAttempting = false;
        scheduleCombinedReconnect();
    }
}

function scheduleCombinedReconnect() {
    if (document.hidden) {
        if (combinedReconnectTimer) return;
        combinedReconnectTimer = setTimeout(() => {
            combinedReconnectTimer = null;
            if (!document.hidden) openCombinedBinanceSocket();
        }, Math.min(combinedReconnectDelay * 2, COMBINED_MAX_BACKOFF));
        combinedReconnectDelay = Math.min(combinedReconnectDelay * 1.8, COMBINED_MAX_BACKOFF);
        return;
    }

    if (combinedReconnectTimer) return;
    const jitter = Math.floor(Math.random() * 300) - 150;
    const delay = Math.min(Math.floor(combinedReconnectDelay) + jitter, COMBINED_MAX_BACKOFF);
    combinedReconnectTimer = setTimeout(() => {
        combinedReconnectTimer = null;
        openCombinedBinanceSocket();
    }, delay);
    combinedReconnectDelay = Math.min(Math.floor(combinedReconnectDelay * 1.8), COMBINED_MAX_BACKOFF);
}

let combinedWatchdogTimer = null;
function startCombinedWatchdog() {
    if (combinedWatchdogTimer) return;
    combinedWatchdogTimer = setInterval(() => {
        const now = Date.now();
        if (combinedSocket && combinedSocket.readyState === WebSocket.OPEN) {
            if (now - lastCombinedMessageTs > 10000) {
                try { combinedSocket.close(); } catch (e) { }
            }
        } else {
            scheduleCombinedReconnect();
        }
    }, 4000);
}

function stopCombinedWatchdog() {
    if (combinedWatchdogTimer) {
        clearInterval(combinedWatchdogTimer);
        combinedWatchdogTimer = null;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopCombinedWatchdog();
    } else {
        startCombinedWatchdog();
        if (!combinedSocket || combinedSocket.readyState !== WebSocket.OPEN) {
            combinedReconnectDelay = Math.min(combinedReconnectDelay, 5000);
            scheduleCombinedReconnect();
        }
    }
});

window.addEventListener('beforeunload', () => {
    try {
        if (combinedSocket) {
            combinedSocket.onclose = null;
            combinedSocket.close();
        }
    } catch (e) { }
    stopCombinedWatchdog();
});

function openWebSockets() {
    openCombinedBinanceSocket();
}

// =======  REST + CACHING ======= //
async function fetchBinancePrice(symbolPair) {
    const key = symbolPair.toUpperCase();
    const cached = priceCache[key];
    const now = Date.now();
    if (cached && (now - cached.ts) < REST_MIN_MS) return cached.price;

    try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${key}`);
        if (!res.ok) throw new Error('binance REST ' + res.status);
        const j = await res.json();
        const price = Number(j.price);
        if (Number.isFinite(price)) {
            priceCache[key] = { price, ts: Date.now() };
            window.latestPrices[key] = price;
            window.latestPrices[key.replace('USDT', '')] = price;
            lastSeen[key] = Date.now();
            return price;
        }
    } catch (err) { }
    return (cached && cached.price) ? cached.price : null;
}

async function getPrice(pair) {
    const pairU = pair.toUpperCase();
    const sym = pairU.replace('USDT', '');

    if (window.latestPrices && window.latestPrices[sym] && (Date.now() - (lastSeen[sym] || 0)) < 5000) {
        return window.latestPrices[sym];
    }
    if (window.latestPrices && window.latestPrices[pairU] && (Date.now() - (lastSeen[pairU] || 0)) < 5000) {
        return window.latestPrices[pairU];
    }

    if (window.fallbackPrices && window.fallbackPrices[sym]) return window.fallbackPrices[sym];
    if (window.fallbackPrices && window.fallbackPrices[pairU]) return window.fallbackPrices[pairU];

    return await fetchBinancePrice(pairU);
}

const bgRefreshTimers = {};
function scheduleBackgroundRefresh(pairU) {
    const key = pairU.toUpperCase();
    if (bgRefreshTimers[key]) return;
    bgRefreshTimers[key] = setTimeout(() => {
        fetchBinancePrice(key).catch(() => { });
        clearTimeout(bgRefreshTimers[key]);
        bgRefreshTimers[key] = null;
    }, BACKGROUND_REFRESH_DEBOUNCE);
}

function getLatestPriceSync(pair) {
    const pairU = pair.toUpperCase();
    const sym = pairU.replace('USDT', '');

    const seenSym = lastSeen[sym] || 0;
    const seenPair = lastSeen[pairU] || 0;
    const now = Date.now();

    if (window.latestPrices && window.latestPrices[sym] && (now - seenSym) < SYNC_FRESH_MS) {
        return window.latestPrices[sym];
    }
    if (window.latestPrices && window.latestPrices[pairU] && (now - seenPair) < SYNC_FRESH_MS) {
        return window.latestPrices[pairU];
    }

    const cached = priceCache[pairU];
    if (cached && (now - cached.ts) < 30000) {
        return cached.price;
    }

    if (window.fallbackPrices && window.fallbackPrices[sym]) {
        return window.fallbackPrices[sym];
    }

    scheduleBackgroundRefresh(pairU);
    return null;
}

// ======== TRADINGVIEW CHART MODAL ========= //
function openModalForCoin(coinCfg) {
    const modal = $('chartModal');
    if (!modal) return;
    modal.style.display = "flex";
    modal.setAttribute('aria-hidden', 'false');
    renderTradingViewChart(coinCfg);
}

function renderTradingViewChart(coin) {
    const container = $('tvChart');
    if (!container) return;
    container.innerHTML = '';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    header.innerHTML = `<div style="font-weight:700;font-size:18px">${coin.symbol.toUpperCase()}</div>`;

    const box = document.querySelector('.cv-modal-box');
    if (box) {
        let existing = box.querySelector('.tv-modal-header');
        if (!existing) {
            header.className = 'tv-modal-header';
            box.insertBefore(header, box.firstChild);
        } else {
            existing.textContent = coin.symbol.toUpperCase();
        }
    }

    new TradingView.widget({
        autosize: true,
        symbol: "BINANCE:" + coin.ws.toUpperCase(),
        interval: "15",
        container_id: "tvChart",
        theme: "light",
        style: "1",
        locale: "en",
        toolbar_bg: "#fff",
        hide_top_toolbar: false,
        save_image: false,
    });
}

const closeModalBtn = $('closeModal');
if (closeModalBtn) {
    closeModalBtn.onclick = () => {
        const m = $('chartModal');
        if (m) m.style.display = 'none';
        const tv = $('tvChart');
        if (tv) tv.innerHTML = '';
        const hdr = document.querySelector('.tv-modal-header');
        if (hdr) hdr.remove();
    };
}

// ==========  HELPERS  ========== //
function formatPrice(v) {
    if (v === null || v === undefined || isNaN(Number(v))) return "-";
    const num = Number(v);
    const fixed = num.toFixed(2);
    const [int, dec] = fixed.split('.');
    const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const cleanDec = dec.replace(/0+$/, '');
    return cleanDec ? `${withCommas}.${cleanDec}` : withCommas;
}

function formatSmall(v) {
    if (v === null || v === undefined || isNaN(Number(v))) return "-";
    return Number(v).toFixed(2).replace(/\.?0+$/, '');
}

// ==========  INIT  ========== //
async function init() {
    buildList();
    setupCryptoSearch();
    await fetchInitialMarkets();
    openWebSockets();

    setInterval(fetchInitialMarkets, 10 * 1000);
}
init();