// FOREX.JS

const FOREX_SHEET_URL = "https://script.google.com/macros/s/AKfycbwtb0kfguBHYRrEmtwZkQ5pt23w7ZdH13ouJtF8wDQFMH6uicBdwL36-MGLflvItAc/exec";

const COINS = [
    { id: "audcad", symbol: "AUDCAD", finnhub: "OANDA:AUD_CAD", tvSymbol: "AUDCAD" },
    { id: "audchf", symbol: "AUDCHF", finnhub: "OANDA:AUD_CHF", tvSymbol: "AUDCHF" },
    { id: "audnzd", symbol: "AUDNZD", finnhub: "OANDA:AUD_NZD", tvSymbol: "AUDNZD" },
    { id: "audusd", symbol: "AUDUSD", finnhub: "OANDA:AUD_USD", tvSymbol: "AUDUSD" },
    { id: "eurusd", symbol: "EURUSD", finnhub: "OANDA:EUR_USD", tvSymbol: "EURUSD" },
    { id: "euraud", symbol: "EURAUD", finnhub: "OANDA:EUR_AUD", tvSymbol: "EURAUD" },
    { id: "eurcad", symbol: "EURCAD", finnhub: "OANDA:EUR_CAD", tvSymbol: "EURCAD" },
    { id: "eurchf", symbol: "EURCHF", finnhub: "OANDA:EUR_CHF", tvSymbol: "EURCHF" },
    { id: "eurgbp", symbol: "EURGBP", finnhub: "OANDA:EUR_GBP", tvSymbol: "EURGBP" },
    { id: "eurnzd", symbol: "EURNZD", finnhub: "OANDA:EUR_NZD", tvSymbol: "EURNZD" },
    { id: "gbpaud", symbol: "GBPAUD", finnhub: "OANDA:GBP_AUD", tvSymbol: "GBPAUD" },
    { id: "gbpcad", symbol: "GBPCAD", finnhub: "OANDA:GBP_CAD", tvSymbol: "GBPCAD" },
    { id: "gbpchf", symbol: "GBPCHF", finnhub: "OANDA:GBP_CHF", tvSymbol: "GBPCHF" },
    { id: "gbpnzd", symbol: "GBPNZD", finnhub: "OANDA:GBP_NZD", tvSymbol: "GBPNZD" },
    { id: "gbpusd", symbol: "GBPUSD", finnhub: "OANDA:GBP_USD", tvSymbol: "GBPUSD" },
    { id: "nzdcad", symbol: "NZDCAD", finnhub: "OANDA:NZD_CAD", tvSymbol: "NZDCAD" },
    { id: "nzdchf", symbol: "NZDCHF", finnhub: "OANDA:NZD_CHF", tvSymbol: "NZDCHF" },
    { id: "nzdusd", symbol: "NZDUSD", finnhub: "OANDA:NZD_USD", tvSymbol: "NZDUSD" },
    { id: "usdcad", symbol: "USDCAD", finnhub: "OANDA:USD_CAD", tvSymbol: "USDCAD" },
    { id: "usdchf", symbol: "USDCHF", finnhub: "OANDA:USD_CHF", tvSymbol: "USDCHF" },
];

const LOGO_OVERRIDES = {
    "AUDNZD": "AUDNZD-new",
    "AUDCAD": "AUDCAD-new"
};

window.COINS = COINS;

window.latestPrices = {};
const $ = id => document.getElementById(id);

// ========= BUILD LIST ==========
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

function buildList() {
    const listRoot = $('crypto-list');
    if (!listRoot) return;
    listRoot.innerHTML = '';
    COINS.forEach(c => {
        const r = mkRowSkeleton(c.id);
        r.addEventListener('click', () => openModalForCoin(c));
        listRoot.appendChild(r);
    });
}

// ========= SEARCH FILTER ========
let allRows = [];

function setupSearch() {
    const searchInput = $('searchAsset');
    const container = $('crypto-list');
    if (!searchInput || !container) return;

    allRows = Array.from(container.querySelectorAll('.cv-row'));

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (query === '') {
            allRows.forEach(row => row.style.display = '');
            sortListByLivePrices();
            return;
        }
        allRows.forEach(row => {
            const coin = COINS.find(c => c.id === row.dataset.coinId);
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

// ======== SORT BY PRICE ========
function sortListByLivePrices() {
    const list = $('crypto-list');
    if (!list) return;
    const rows = Array.from(list.querySelectorAll('.cv-row'));
    rows.sort((a, b) => {
        const coinA = COINS.find(c => c.id === a.dataset.coinId);
        const coinB = COINS.find(c => c.id === b.dataset.coinId);
        const priceA = window.latestPrices[coinA?.symbol] || 0;
        const priceB = window.latestPrices[coinB?.symbol] || 0;
        return priceB - priceA;
    });
    list.innerHTML = '';
    rows.forEach(r => list.appendChild(r));
    allRows = rows;
}

// ========= FETCH PRICES FROM APPS SCRIPT ==========
async function fetchForexPrices() {
    try {
        const res = await fetch(FOREX_SHEET_URL);
        const rows = await res.json();

        console.log("[Forex] Raw response:", rows);

        rows.forEach(row => {
            const s = row.Symbol?.toString().trim().toUpperCase();
            if (!s) return;

            const coin = COINS.find(c => c.symbol === s);
            if (!coin) return;

            const p = Number(row.Price);
            const h = Number(row.High);
            const l = Number(row.Low);
            const ch = Number(row.ChangePct);

            window.latestPrices[s] = p;

            const priceEl = $(`price-${coin.id}`);
            const timeEl = $(`time-${coin.id}`);
            const pillEl = $(`pill-${coin.id}`);
            const hlEl = $(`hl-${coin.id}`);
            const symEl = $(`sym-${coin.id}`);
            const logoEl = $(`logo-${coin.id}`);

            if (priceEl) priceEl.textContent = formatPrice(p);
            if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
            if (symEl) symEl.textContent = s;

            if (pillEl) {
                pillEl.textContent = (ch >= 0 ? "+" : "") + ch.toFixed(2) + "%";
                pillEl.className = 'cv-pill ' + (ch >= 0 ? 'cv-green' : 'cv-red');
            }

            if (hlEl) hlEl.textContent = `H:${formatSmall(h)} L:${formatSmall(l)}`;

            if (logoEl && !logoEl.dataset.loaded) {
                logoEl.dataset.loaded = "1";
                const slug = LOGO_OVERRIDES[s] || s;
                logoEl.src = `https://www.amarkets.com/wp-content/uploads/2022/03/${slug}.png`;
                logoEl.onerror = () => logoEl.src = '/assets/images/logo-placeholder.png';
            }
        });

        sortListByLivePrices();

    } catch (e) {
        console.error("[Forex] Fetch error:", e);
    }
}

// ========== HELPERS ===========
function formatPrice(v) {
    if (!v || isNaN(v)) return "-";
    return Number(v).toFixed(5);
}

function formatSmall(v) {
    if (!v || isNaN(v)) return "-";
    return Number(v).toFixed(5);
}

// =========== TRADINGVIEW CHART MODAL ===========
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

    const box = document.querySelector('.cv-modal-box');
    if (box) {
        let existing = box.querySelector('.tv-modal-header');
        if (!existing) {
            const header = document.createElement('div');
            header.className = 'tv-modal-header';
            header.style.cssText = 'font-weight:700;font-size:18px;margin-bottom:8px;';
            header.textContent = coin.symbol.toUpperCase();
            box.insertBefore(header, box.firstChild);
        } else {
            existing.textContent = coin.symbol.toUpperCase();
        }
    }

    new TradingView.widget({
        autosize: true,
        symbol: "FX:" + coin.tvSymbol.toUpperCase(),
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

// ========= INIT =========
function init() {
    buildList();
    setupSearch();
    fetchForexPrices();
    setInterval(fetchForexPrices, 5000);
}

init();