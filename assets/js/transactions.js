// TRANSACTIONS.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

// ===================================================================
// 1. TRADES HISTORY
// ===================================================================
function loadTradesHistory() {
    const tbody = document.getElementById('trades-tbody');
    if (!tbody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="7">Please log in</td></tr>';
            return;
        }

        const tradesRef = ref(db, `users/${user.uid}/openOrders`);

        onValue(tradesRef, (snapshot) => {
            const trades = [];
            snapshot.forEach(child => {
                const trade = child.val();
                trade.id = child.key;
                trades.push(trade);
            });

            trades.sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0));

            tbody.innerHTML = trades.length === 0
                ? '<tr class="no-data-row"><td colspan="7">No trades yet</td></tr>'
                : '';

            trades.forEach(trade => {
                const date = new Date(trade.openedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                const isOpen = trade.status === 'open';
                const statusText = isOpen ? 'Active' : 'Closed';
                const statusClass = isOpen ? 'status-active' : 'status-closed';

                let outcomeHTML = '';
                if (trade.outcome !== undefined && trade.outcome !== null) {
                    const val = String(trade.outcome).trim();

                    if (val.toLowerCase() === "pending") {
                        outcomeHTML = `<span style="color:var(--bs-gray); font-style:italic">Pending</span>`;
                    }

                    else if (val.startsWith('-') || parseFloat(val) < 0) {
                        outcomeHTML = `<span style="color:var(--bs-red); font-weight:bold">${val}</span>`;
                    }

                    else {
                        outcomeHTML = `<span style="color:var(--bs-teal); font-weight:bold">+${val}</span>`;
                    }
                } else {

                    outcomeHTML = `<span style="color:var(--bs-gray); font-style:italic">Pending</span>`;
                }

                const row = document.createElement('tr');
                row.className = 'trade-row';
                row.innerHTML = `
                    <td><strong>${trade.symbol || 'N/A'}</strong></td>
                    <td><span class="market-tag">${(trade.market || 'crypto').toUpperCase()}</span></td>
                    <td class="trade-type-cell">
                        <span class="direction ${trade.direction}">${trade.direction.toUpperCase()}</span>
                        <span>$${Number(trade.amount).toFixed(2)}</span>
                    </td>
                    <td>${trade.timeframe}s</td>
                    <td>${date}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${outcomeHTML}</td>
                `;
                tbody.appendChild(row);
            });
        });
    });
}

// ===================================================================
// 2. DEPOSITS HISTORY
// ===================================================================
function loadDepositsHistory() {
    const tbody = document.getElementById('deposits-tbody');
    if (!tbody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            tbody.innerHTML = '<tr class="deposits-no-data"><td colspan="7" class="deposits-no-data-text">Please log in</td></tr>';
            return;
        }

        const depositsRef = ref(db, `users/${user.uid}/allDeposits`);

        onValue(depositsRef, (snapshot) => {
            const deposits = [];
            snapshot.forEach(child => {
                const dep = child.val();
                dep.id = child.key;
                deposits.push(dep);
            });

            deposits.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            tbody.innerHTML = deposits.length === 0
                ? '<tr class="deposits-no-data"><td colspan="7" class="deposits-no-data-text">No deposits recorded</td></tr>'
                : '';

            deposits.forEach(dep => {
                const timeStr = dep.timestamp
                    ? new Date(dep.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })
                    : '—';

                const cryptoLower = (dep.crypto || 'generic').toLowerCase();
                const status = (dep.status || 'pending').toLowerCase();
                const txId = dep.id || 'unknown';

                const row = document.createElement('tr');
                row.className = 'deposits-row';
                row.innerHTML = `
                    <td>
                        <div class="deposits-crypto-cell">
                            <img 
                                src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cryptoLower}.png"
                                alt="${dep.crypto}"
                                class="deposits-crypto-icon"
                                onerror="this.onerror=null; this.src='https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/generic.png'">
                            <span>${dep.crypto || '—'}</span>
                        </div>
                    </td>
                    <td>${timeStr}</td>
                    <td>$${Number(dep.amount || 0).toFixed(2)}</td>
                    <td>Crypto</td>
                    <td><span class="deposits-status ${status}">${status}</span></td>
                    <td class="deposits-tx-id">${txId}</td>
                `;
                tbody.appendChild(row);
            });
        });
    });
}


// ===================================================================
// 3. WITHDRAWALS HISTORY
// ===================================================================
function loadWithdrawalsHistory() {
    const tbody = document.getElementById('withdrawals-tbody');
    if (!tbody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="6" class="no-data-text">Please log in</td></tr>';
            return;
        }

        const withdrawalsRef = ref(db, `users/${user.uid}/allWithdrawals`);

        onValue(withdrawalsRef, (snapshot) => {
            const withdrawals = [];
            snapshot.forEach(child => {
                const wd = child.val();
                wd.id = child.key;
                withdrawals.push(wd);
            });

            // Sort newest first
            withdrawals.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            // Clear table
            tbody.innerHTML = withdrawals.length === 0
                ? '<tr class="no-data-row"><td colspan="6">No withdrawals yet</td></tr>'
                : '';

            withdrawals.forEach(wd => {
                const timeStr = wd.timestamp
                    ? new Date(wd.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })
                    : '—';

                const cryptoLower = (wd.crypto || 'generic').toLowerCase();
                const status = (wd.status || 'pending').toLowerCase();
                const shortWallet = wd.walletAddress
                    ? `${wd.walletAddress.slice(0, 8)}...${wd.walletAddress.slice(-6)}`
                    : '—';
                const txId = wd.id || 'unknown';

                const row = document.createElement('tr');
                row.className = 'withdrawals-row';

                row.innerHTML = `
                    <td>
                        <div class="deposits-crypto-cell">
                            <img 
                                src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cryptoLower}.png"
                                alt="${wd.crypto}"
                                class="deposits-crypto-icon"
                                onerror="this.onerror=null; this.src='https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/generic.png'">
                            <span>${wd.crypto || '—'}</span>
                        </div>
                    </td>
                    <td>${timeStr}</td>
                    <td>$${Number(wd.amount || 0).toFixed(2)}</td>
                    <td class="wallet-address">${shortWallet}</td>
                    <td><span class="deposits-status ${status}">${status}</span></td>
                    <td class="deposits-tx-id">${txId}</td>
                `;

                tbody.appendChild(row);
            });
        }, (error) => {
            console.error("Withdrawals load error:", error);
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="6">Error loading withdrawals</td></tr>';
        });
    });
}


// ===================================================================
// START BOTH ON LOGIN
// ===================================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadTradesHistory();
        loadDepositsHistory();
        loadWithdrawalsHistory();
    }
});

console.log("%cHistory Loader FIXED & ACTIVE — Trades + Deposits + withdrawals (No Errors)", "color: #00ff9d; font-weight: bold; font-size: 14px;");