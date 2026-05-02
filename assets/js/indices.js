// INDICES.JS

const COINS = [
    { id: "sensex", symbol: "SENSEX", exchange: "BSE", tvSymbol: "SENSEX" },
    { id: "nikkei225", symbol: "NI225", exchange: "TVC", tvSymbol: "NI225" },
    { id: "dji", symbol: ".DJI", exchange: "Spreadex", tvSymbol: "DJI" },
    { id: "ixic", symbol: ".IXIC", exchange: "NASDAQ", tvSymbol: "IXIC" },
    { id: "sp500", symbol: ".INX", exchange: "Vantage", tvSymbol: "SP500" },
    { id: "ukx", symbol: "UKX", exchange: "Spreadex", tvSymbol: "FTSE" },
    { id: "mcx", symbol: "MCX", exchange: "VIE", tvSymbol: "MCX" },
    { id: "dax", symbol: "DAX", exchange: "XETR", tvSymbol: "DAX" },
    { id: "mdax", symbol: "MDAX", exchange: "XETR", tvSymbol: "MDAX" },
    { id: "smi", symbol: "SMI", exchange: "SWX", tvSymbol: "SMI" },
    { id: "she399001", symbol: "399001", exchange: "SZSE", tvSymbol: "399001" },
    { id: "hsi", symbol: "HSI", exchange: "HKEX", tvSymbol: "HSI" },
    { id: "xjo", symbol: "XJO", exchange: "ASX", tvSymbol: "XJO" },
    { id: "sx5e", symbol: "SX5E", exchange: "INDEX", tvSymbol: "SX5E" }
];

const LOGOS = {
    "SENSEX": "bseindia.com",
    "NI225": "jpx.co.jp",
    ".DJI": "dowjones.com",
    ".IXIC": "nasdaq.com",
    ".INX": "spglobal.com",
    "UKX": "ftse.com",
    "MCX": "ftse.com",
    "DAX": "deutsche-boerse.com",
    "MDAX": "deutsche-boerse.com",
    "SMI": "six-group.com",
    "399001": "szse.cn",
    "HSI": "hkex.com.hk",
    "XJO": "asx.com.au",
    "SX5E": "stoxx.com"
};

const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbxlCPZ9-5R6GCkmKDi7aMdNNQTVEZ-HqP-AsWiSAfRtdif3LAUZlSkwJwRM60UQ2WU/exec";
window.latestPrices = {};
const $ = id => document.getElementById(id);

// ======== BUILD LIST ========
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

// ========= SEARCH FILTER =========
let allRows = [];

function setupSearch() {
    const searchInput = $('searchAsset');
    const container = $('crypto-list');
    if (!searchInput || !container) return;

    allRows = Array.from(container.querySelectorAll('.cv-row'));

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();

        if (query === '') {
            allRows.forEach(row => {
                row.style.display = '';
            });
            sortListByLivePrices();
            return;
        }

        allRows.forEach(row => {
            const coinId = row.dataset.coinId;
            const coin = COINS.find(c => c.id === coinId);
            if (!coin) return;

            const matches =
                coin.symbol.toLowerCase().includes(query) ||
                coin.id.toLowerCase().includes(query) ||
                coin.exchange.toLowerCase().includes(query);

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

// ========= SORT BY PRICE =========
function sortListByLivePrices() {
    const list = $('crypto-list');
    if (!list) return;

    const rows = Array.from(list.querySelectorAll('.cv-row'));

    rows.sort((a, b) => {
        const coinA = COINS.find(c => c.id === a.dataset.coinId);
        const coinB = COINS.find(c => c.id === b.dataset.coinId);
        const priceA = window.latestPrices[coinA?.symbol?.toUpperCase()] || 0;
        const priceB = window.latestPrices[coinB?.symbol?.toUpperCase()] || 0;
        return priceB - priceA;
    });

    list.innerHTML = '';
    rows.forEach(r => list.appendChild(r));

    allRows = rows;
}

// ========= FETCH PRICES =========
async function fetchSheetPrices() {
    try {
        const res = await fetch(SHEET_JSON_URL);
        const rows = await res.json();

        rows.forEach(row => {
            const sRaw = row.Symbol?.toString().trim().toUpperCase();
            if (!sRaw) return;
            const s = sRaw.includes(":") ? sRaw.split(":")[1] : sRaw;

            const coin = COINS.find(c => c.symbol.toUpperCase() === s);
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
            if (pillEl) {
                pillEl.textContent = (ch >= 0 ? "+" : "") + ch.toFixed(2) + "%";
                pillEl.className = 'cv-pill ' + (ch >= 0 ? 'cv-green' : 'cv-red');
            }
            if (hlEl) hlEl.textContent = `H:${formatSmall(h)} - L:${formatSmall(l)}`;
            if (symEl) symEl.textContent = s;

            if (logoEl && LOGOS[s]) {
                logoEl.src = `https://img.logo.dev/${LOGOS[s]}?token=pk_aatG-vMBRCeF-6M9hQ6SGw`;
                logoEl.onerror = () => logoEl.src = '/assets/images/logo-placeholder.png';
            }
        });

        sortListByLivePrices();

    } catch (e) {
        console.error("Fetch error:", e);
    }
}

// ========= HELPERS ========
function formatPrice(v) {
    if (!v || isNaN(v)) return "-";
    const num = Number(v);
    const [int, dec = ''] = num.toFixed(2).split('.');
    return dec === '00' ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec.replace(/0+$/, '')}`;
}

function formatSmall(v) {
    if (!v || isNaN(v)) return "-";
    return Number(v).toFixed(2).replace(/\.?0+$/, '');
}

// ========== TRADINGVIEW CHART MODAL ==========
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
        symbol: coin.exchange + ":" + coin.tvSymbol.toUpperCase(),
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
    fetchSheetPrices();
    setInterval(fetchSheetPrices, 5000);
}

init();