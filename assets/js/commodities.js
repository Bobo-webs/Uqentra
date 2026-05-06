// COMMODITIES.JS

const COMMODITIES_SHEET_URL = "https://script.google.com/macros/s/AKfycbx34qOelVPC-UOvvSE69bIH5-nddTRawkAiM_ifnHtlMqfiHzRqxFS96zjTn7I1Dkv15w/exec";

const COINS = [
    // Metals
    { id: "gold", symbol: "GOLD", name: "XAUUSD", tv: "OANDA:XAUUSD" },
    { id: "silver", symbol: "SILVER", name: "XAGUSD", tv: "OANDA:XAGUSD" },
    { id: "platinum", symbol: "PLATINUM", name: "XPTUSD", tv: "OANDA:XPTUSD" },
    { id: "copper", symbol: "COPPER", name: "XCUUSD", tv: "OANDA:XCUUSD" },
    { id: "palladium", symbol: "PALLADIUM", name: "XPDUSD", tv: "OANDA:XPDUSD" },
    // Energy
    { id: "usoil", symbol: "USOIL", name: "USOIL", tv: "TVC:USOIL" },
    { id: "ukoil", symbol: "UKOIL", name: "UKOIL", tv: "TVC:UKOIL" },
    { id: "natgas", symbol: "NATGAS", name: "NATGAS", tv: "OANDA:NATGASUSD" },
    { id: "gasoline", symbol: "GASOLINE", name: "RBOB", tv: "CAPITALCOM:GASOLINE" },
    // Agriculture
    { id: "wheat", symbol: "WHEAT", name: "ZW", tv: "CAPITALCOM:WHEAT" },
    { id: "corn", symbol: "CORN", name: "ZC", tv: "CAPITALCOM:CORN" },
    { id: "soybean", symbol: "SOYBEAN", name: "ZS", tv: "CAPITALCOM:SOYBEAN" },
    { id: "coffee", symbol: "COFFEE", name: "KC", tv: "ACTIVTRADES:COFFEE" },
    { id: "cocoa", symbol: "COCOA", name: "CC", tv: "ACTIVTRADES:COCOA" },
    { id: "sugar", symbol: "SUGAR", name: "SB", tv: "ACTIVTRADES:SUGAR" },
    { id: "cotton", symbol: "COTTON", name: "CT", tv: "ACTIVTRADES:COTTON" },
];

window.COINS = COINS;
window.latestPrices = {};
const $ = id => document.getElementById(id);

// == Commodity logos == //
const LOGOS = {
    "GOLD": "https://www.amarkets.com/wp-content/uploads/2022/03/XAUUSD-trading-instrument.png",
    "SILVER": "https://www.amarkets.com/wp-content/uploads/2022/03/XAGUSD-trading-instrument.png",
    "PLATINUM": "https://www.amarkets.com/wp-content/uploads/2022/03/Platinum-trading-instrument.png",
    "COPPER": "https://www.amarkets.com/wp-content/uploads/2022/03/Copper-trading-instrument.png",
    "PALLADIUM": "https://s3-symbol-logo.tradingview.com/metal/palladium--big.svg",
    "USOIL": "https://s3-symbol-logo.tradingview.com/crude-oil--big.svg",
    "UKOIL": "https://s3-symbol-logo.tradingview.com/crude-oil--big.svg",
    "NATGAS": "https://www.amarkets.com/wp-content/uploads/2022/03/Natural-Gas-trading-instrument.png",
    "GASOLINE": "https://s3-symbol-logo.tradingview.com/gasoline--big.svg",
    "WHEAT": "https://www.amarkets.com/wp-content/uploads/2022/03/Wheat-trading-instrument.png",
    "CORN": "https://www.amarkets.com/wp-content/uploads/2022/03/Corn-trading-instrument.png",
    "SOYBEAN": "https://www.amarkets.com/wp-content/uploads/2022/03/Soybean-trading-instrument.png",
    "COFFEE": "https://www.amarkets.com/wp-content/uploads/2022/03/Coffee-trading-instrument.png",
    "COCOA": "https://www.amarkets.com/wp-content/uploads/2022/03/Cocoa-trading-instrument.png",
    "SUGAR": "https://www.amarkets.com/wp-content/uploads/2022/03/Sugar-trading-instrument.png",
    "COTTON": "https://www.amarkets.com/wp-content/uploads/2022/03/Cotton-trading-instrument.png",
};

// ========= BUILD LIST ==========
function mkRowSkeleton(coin) {
    const row = document.createElement('div');
    row.className = 'cv-row';
    row.dataset.coinId = coin.id;
    row.innerHTML = `
      <div class="cv-left">
        <img class="cv-logo" id="logo-${coin.id}" alt="${coin.name}" src="">
        <div class="cv-symbol-wrap">
          <span class="cv-symbol" id="sym-${coin.id}">${coin.name}</span>
          <span class="cv-time" id="time-${coin.id}">--:--:--</span>
        </div>
      </div>
      <div class="cv-change">
        <span id="pill-${coin.id}" class="cv-pill cv-red">-</span>
      </div>
      <div class="cv-right">
        <div class="cv-price" id="price-${coin.id}">-</div>
        <div class="cv-hl" id="hl-${coin.id}">H:- L:-</div>
      </div>
    `;
    return row;
}

function buildList() {
    const listRoot = $('crypto-list');
    if (!listRoot) return;
    listRoot.innerHTML = '';
    COINS.forEach(c => {
        const r = mkRowSkeleton(c);
        r.addEventListener('click', () => openModalForCoin(c));
        listRoot.appendChild(r);
    });
}

// ========= SEARCH ==========
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
                coin.name.toLowerCase().includes(query) ||
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

// ========= SORT ==========
function sortListByLivePrices() {
    const list = $('crypto-list');
    if (!list) return;
    const rows = Array.from(list.querySelectorAll('.cv-row'));
    rows.sort((a, b) => {
        const coinA = COINS.find(c => c.id === a.dataset.coinId);
        const coinB = COINS.find(c => c.id === b.dataset.coinId);
        return (window.latestPrices[coinB?.symbol] || 0) - (window.latestPrices[coinA?.symbol] || 0);
    });
    list.innerHTML = '';
    rows.forEach(r => list.appendChild(r));
    allRows = rows;
}

// ========= FETCH ==========
async function fetchCommodityPrices() {
    try {
        const res = await fetch(COMMODITIES_SHEET_URL);
        const data = await res.json();

        if (!Array.isArray(data)) {
            console.error("[Commodities] Unexpected response:", data);
            return;
        }

        data.forEach(row => {
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
            const logoEl = $(`logo-${coin.id}`);

            if (priceEl) priceEl.textContent = formatPrice(p);
            if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();

            if (pillEl) {
                pillEl.textContent = (ch >= 0 ? "+" : "") + ch.toFixed(2) + "%";
                pillEl.className = 'cv-pill ' + (ch >= 0 ? 'cv-green' : 'cv-red');
            }

            if (hlEl) hlEl.textContent = `H:${formatPrice(h)} L:${formatPrice(l)}`;

            if (logoEl && !logoEl.dataset.loaded) {
                logoEl.dataset.loaded = "1";
                logoEl.src = LOGOS[s] || '/assets/images/logo-placeholder.png';
                logoEl.onerror = () => logoEl.src = '/assets/images/logo-placeholder.png';
            }
        });

        sortListByLivePrices();

    } catch (e) {
        console.error("[Commodities] Fetch error:", e);
    }
}

// ========= FORMATTERS ==========
function formatPrice(v) {
    if (!v || isNaN(v)) return "-";
    const num = Number(v);
    // Commodities use 2-4 decimal places depending on the asset
    const decimals = num >= 100 ? 2 : num >= 1 ? 4 : 5;
    const [int, dec = ''] = num.toFixed(decimals).split('.');
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? '.' + dec : '');
}

// ========= TRADINGVIEW MODAL ==========
function openModalForCoin(coin) {
    const modal = $('chartModal');
    if (!modal) return;
    modal.style.display = "flex";
    modal.setAttribute('aria-hidden', 'false');
    renderTradingViewChart(coin);
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
            header.textContent = coin.name;
            box.insertBefore(header, box.firstChild);
        } else {
            existing.textContent = coin.name;
        }
    }

    new TradingView.widget({
        autosize: true,
        symbol: coin.tv,
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

// ========= INIT ==========
function init() {
    buildList();
    setupSearch();
    fetchCommodityPrices();
    setInterval(fetchCommodityPrices, 30000);
}

init();