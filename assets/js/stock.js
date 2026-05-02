// STOCK.JS

const COINS = [
    { id: "apple", symbol: "AAPL", exchange: "NASDAQ", tvSymbol: "AAPL" },
    { id: "microsoft", symbol: "MSFT", exchange: "NASDAQ", tvSymbol: "MSFT" },
    { id: "amazon", symbol: "AMZN", exchange: "NASDAQ", tvSymbol: "AMZN" },
    { id: "alphabet", symbol: "GOOGL", exchange: "NASDAQ", tvSymbol: "GOOGL" },
    { id: "meta", symbol: "META", exchange: "NASDAQ", tvSymbol: "META" },
    { id: "nvidia", symbol: "NVDA", exchange: "NASDAQ", tvSymbol: "NVDA" },
    { id: "tesla", symbol: "TSLA", exchange: "NASDAQ", tvSymbol: "TSLA" },
    { id: "netflix", symbol: "NFLX", exchange: "NASDAQ", tvSymbol: "NFLX" },
    { id: "intel", symbol: "INTC", exchange: "NASDAQ", tvSymbol: "INTC" },
    { id: "cisco", symbol: "CSCO", exchange: "NASDAQ", tvSymbol: "CSCO" },
    { id: "oracle", symbol: "ORCL", exchange: "NYSE", tvSymbol: "ORCL" },
    { id: "amd", symbol: "AMD", exchange: "NASDAQ", tvSymbol: "AMD" },
    { id: "adp", symbol: "ADP", exchange: "NASDAQ", tvSymbol: "ADP" },
    { id: "paypal", symbol: "PYPL", exchange: "NASDAQ", tvSymbol: "PYPL" },
    { id: "zoom", symbol: "ZM", exchange: "NASDAQ", tvSymbol: "ZM" },
    { id: "qualcomm", symbol: "QCOM", exchange: "NASDAQ", tvSymbol: "QCOM" },
    { id: "salesforce", symbol: "CRM", exchange: "NYSE", tvSymbol: "CRM" },
    { id: "shopify", symbol: "SHOP", exchange: "NASDAQ", tvSymbol: "SHOP" },
    { id: "starbucks", symbol: "SBUX", exchange: "NASDAQ", tvSymbol: "SBUX" },
    { id: "jpmorgan", symbol: "JPM", exchange: "NYSE", tvSymbol: "JPM" },
    { id: "wellsfargo", symbol: "WFC", exchange: "NYSE", tvSymbol: "WFC" },
    { id: "goldmansachs", symbol: "GS", exchange: "NYSE", tvSymbol: "GS" },
    { id: "morganstanley", symbol: "MS", exchange: "NYSE", tvSymbol: "MS" },
    { id: "coinbase", symbol: "COIN", exchange: "NASDAQ", tvSymbol: "COIN" },
    { id: "berkshire", symbol: "BRK.B", exchange: "NYSE", tvSymbol: "BRK.B" },
    { id: "chevron", symbol: "CVX", exchange: "NYSE", tvSymbol: "CVX" },
    { id: "lvmh", symbol: "LVMHF", exchange: "OTC", tvSymbol: "LVMHF" },
    { id: "engie", symbol: "ENGI", exchange: "GETTEX", tvSymbol: "GZF" },
    { id: "bmw", symbol: "BMW", exchange: "XETR", tvSymbol: "BMW" },
    { id: "bankofnovascotia", symbol: "BNS", exchange: "NYSE", tvSymbol: "BNS" },
    { id: "gsk", symbol: "GSK", exchange: "AQUISUK", tvSymbol: "GSKL" },
    { id: "verizon", symbol: "VZ", exchange: "NYSE", tvSymbol: "VZ" },
    { id: "pepsico", symbol: "PEP", exchange: "NASDAQ", tvSymbol: "PEP" },
    { id: "cocacola", symbol: "KO", exchange: "NYSE", tvSymbol: "KO" },
    { id: "nike", symbol: "NKE", exchange: "NYSE", tvSymbol: "NKE" },
    { id: "hsbc", symbol: "HSBA", exchange: "AQUISUK", tvSymbol: "HSBAL" },
    { id: "barclays", symbol: "BARC", exchange: "AQUISUK", tvSymbol: "BARCL" },
    { id: "unilever", symbol: "ULVR", exchange: "TURQUOISE", tvSymbol: "ULVRL" },
    { id: "volkswagen", symbol: "VOW3", exchange: "XETR", tvSymbol: "VOW3" },
    { id: "bhp", symbol: "BHP", exchange: "ASX", tvSymbol: "BHP" },
    { id: "rio", symbol: "RIO", exchange: "ASX", tvSymbol: "RIO" },
    { id: "csl", symbol: "CSL", exchange: "ASX", tvSymbol: "CSL" },
    { id: "tencent", symbol: "TCEHY", exchange: "OTC", tvSymbol: "TCEHY" }
];

const LOGOS = {
    "AAPL": "apple.com",
    "MSFT": "microsoft.com",
    "AMZN": "amazon.com",
    "GOOGL": "abc.xyz",
    "META": "meta.com",
    "NVDA": "nvidia.com",
    "TSLA": "tesla.com",
    "NFLX": "netflix.com",
    "INTC": "intel.com",
    "CSCO": "cisco.com",
    "ORCL": "oracle.com",
    "AMD": "amd.com",
    "ADP": "adp.com",
    "PYPL": "paypal.com",
    "ZM": "zoom.us",
    "QCOM": "qualcomm.com",
    "CRM": "salesforce.com",
    "SHOP": "shopify.com",
    "SBUX": "starbucks.com",
    "JPM": "jpmorganchase.com",
    "WFC": "wellsfargo.com",
    "GS": "goldmansachs.com",
    "MS": "morganstanley.com",
    "COIN": "coinbase.com",
    "BRK.B": "berkshirehathaway.com",
    "CVX": "chevron.com",
    "LVMHF": "lvmh.com",
    "ENGI": "engie.com",
    "BMW": "bmw.com",
    "BNS": "scotiabank.com",
    "GSK": "gsk.com",
    "VZ": "verizon.com",
    "PEP": "pepsico.com",
    "KO": "coca-cola.com",
    "NKE": "nike.com",
    "HSBA": "hsbc.com",
    "BARC": "barclays.com",
    "ULVR": "unilever.com",
    "VOW3": "volkswagen.com",
    "BHP": "bhp.com",
    "RIO": "riotinto.com",
    "CSL": "csl.com.au",
    "TCEHY": "tencent.com"
};

const SHEET_JSON_URL = "https://script.google.com/macros/s/AKfycbzFSZ5wcm91t5l8KOWd0GpeAg7q2FUljJijZrNwRxRJxnUUsRMbNv_8lGdBtkDpbb8/exec";
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

// ======== SORT BY PRICE ========
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

// ========= FETCH PRICES ==========
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

// ========== HELPERS ===========
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