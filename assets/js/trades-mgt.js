// TRADES.MGT.JS

import { auth, db } from "/assets/js/firebase-init.js";
import { ref, get, set, remove, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const tradesBody = document.getElementById('adminTradesBody');
    if (!tradesBody) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) return;

        const usersRef = ref(db, 'users');

        onValue(usersRef, (snapshot) => {
            tradesBody.innerHTML = '';

            let tradesList = [];

            snapshot.forEach(userSnap => {
                const userUid = userSnap.key;
                const userData = userSnap.val() || {};

                const lastname = userData.lastname || 'No data';
                const email = userData.email || 'No data';

                const openOrdersRef = userSnap.child('openOrders');
                if (!openOrdersRef.exists()) return;

                openOrdersRef.forEach(tradeSnap => {
                    const tradeId = tradeSnap.key;
                    const trade = tradeSnap.val() || {};

                    tradesList.push({
                        userUid,
                        tradeId,
                        lastname,
                        email,
                        amount: trade.amount || 0,
                        openedAt: trade.openedAt || 0,
                        expiresAt: trade.expiresAt || 0,
                        closedAt: trade.closedAt || null,
                        market: trade.market || 'No data',
                        status: trade.status || 'open',
                        symbol: trade.symbol || 'No data',
                        timeframe: trade.timeframe || 0,
                        direction: trade.direction || 'No data',
                        outcome: trade.outcome || null
                    });
                });
            });

            if (tradesList.length === 0) {
                tradesBody.innerHTML = '<tr><td colspan="13">No trades found</td></tr>';
                return;
            }

            // Sort newest first
            tradesList.sort((a, b) => b.openedAt - a.openedAt);

            tradesList.forEach(trade => {
                let formattedOpened = 'No data';
                if (trade.openedAt) formattedOpened = new Date(trade.openedAt).toLocaleString();

                let formattedExpires = 'No data';
                if (trade.expiresAt) formattedExpires = new Date(trade.expiresAt).toLocaleString();

                let outcomeHTML = `<span style="color:#888; font-style:italic">Pending</span>`;

                if (trade.outcome !== null && trade.outcome !== undefined) {
                    const value = Number(trade.outcome);

                    if (!isNaN(value)) {
                        const formatted = value > 0 ? `+${value}` : `${value}`;

                        outcomeHTML = value < 0
                            ? `<span style="color:var(--bs-red); font-weight:bold">${formatted}</span>`
                            : `<span style="color:var(--bs-teal); font-weight:bold">${formatted}</span>`;
                    }
                }

                const isOpen = trade.status === 'open';
                const statusText = isOpen ? 'Active' : 'Closed';
                const statusClass = isOpen ? 'status-active' : 'status-closed';

                const row = document.createElement('tr');
                row.dataset.userUid = trade.userUid;
                row.dataset.tradeId = trade.tradeId;

                row.innerHTML = `
                    <td>
                        <div class="admin-actions">
                            <button class="admin-actions-btn edit" data-useruid="${trade.userUid}" data-tradeid="${trade.tradeId}">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="admin-actions-btn delete" data-useruid="${trade.userUid}" data-tradeid="${trade.tradeId}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                    <td>${trade.lastname}</td>
                    <td>${trade.tradeId}</td>
                    <td>
                        <span class="direction ${trade.direction}">${trade.direction.toUpperCase()}</span>
                        <span">$${Number(trade.amount).toFixed(2)}</span>
                    </td>
                    <td>${formattedOpened}</td>
                    <td>${formattedExpires}</td>
                    <td>${trade.market}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${trade.symbol}</td>
                    <td>${trade.timeframe}</td>
                    <td>${outcomeHTML}</td>
                    <td>${trade.email}</td>
                `;
                tradesBody.appendChild(row);
            });
        });
    });

    // EVENT DELEGATION
    document.body.addEventListener('click', async (e) => {
        // DELETE
        const deleteBtn = e.target.closest('.admin-actions-btn.delete');
        if (deleteBtn) {
            const userUid = deleteBtn.dataset.useruid;
            const tradeId = deleteBtn.dataset.tradeid;
            document.getElementById('tradeDeleteOverlay').classList.add('active');
            document.getElementById('tradeDeleteOverlay').dataset.targetUserUid = userUid;
            document.getElementById('tradeDeleteOverlay').dataset.targetTradeId = tradeId;
        }

        if (e.target.id === 'tradeDeleteConfirm') {
            const overlay = document.getElementById('tradeDeleteOverlay');
            const userUid = overlay.dataset.targetUserUid;
            const tradeId = overlay.dataset.targetTradeId;
            overlay.classList.remove('active');

            try {
                showToast("Deleting trade...", "info");
                await remove(ref(db, `users/${userUid}/openOrders/${tradeId}`));
                showToast("Trade deleted", "success");
            } catch (error) {
                showToast("Delete failed", "error");
            }
        }

        if (e.target.id === 'tradeDeleteCancel') {
            document.getElementById('tradeDeleteOverlay').classList.remove('active');
        }

        // EDIT
        const editBtn = e.target.closest('.admin-actions-btn.edit');
        if (editBtn) {
            const userUid = editBtn.dataset.useruid;
            const tradeId = editBtn.dataset.tradeid;
            const overlay = document.getElementById('tradeEditOverlay');
            overlay.classList.add('active');
            overlay.dataset.targetUserUid = userUid;
            overlay.dataset.targetTradeId = tradeId;

            const tradeSnap = await get(ref(db, `users/${userUid}/openOrders/${tradeId}`));
            const trade = tradeSnap.val() || {};

            document.getElementById('tradeAmount').value = trade.amount || 0;
            document.getElementById('tradeMarket').value = trade.market || '';
            document.getElementById('tradeStatus').value = trade.status || 'open';
            document.getElementById('tradeSymbol').value = trade.symbol || '';
            document.getElementById('tradeTimeframe').value = trade.timeframe || 0;
            document.getElementById('tradeDirection').value = trade.direction || 'buy';

            // OUTCOME
            let outcomeValue = Math.abs(trade.outcome || 0).toFixed(2);
            let outcomeSign = 'none';
            if (trade.outcome > 0) outcomeSign = 'profit';
            if (trade.outcome < 0) outcomeSign = 'loss';

            document.getElementById('tradeOutcomeSign').value = outcomeSign;
            document.getElementById('tradeOutcomeValue').value = outcomeValue;

            // Timestamps
            if (trade.openedAt) {
                const date = new Date(trade.openedAt);
                const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                document.getElementById('tradeOpenedAt').value = local.toISOString().slice(0, 16);
            } else {
                document.getElementById('tradeOpenedAt').value = '';
            }
        }

        if (e.target.id === 'closeTradeModal') {
            document.getElementById('tradeEditOverlay').classList.remove('active');
        }
    });

    // EDIT FORM SUBMIT
    document.getElementById('adminTradeForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const overlay = document.getElementById('tradeEditOverlay');
        const userUid = overlay.dataset.targetUserUid;
        const tradeId = overlay.dataset.targetTradeId;

        try {
            showToast("Saving trade changes...", "info");

            const openedStr = document.getElementById('tradeOpenedAt').value;
            const openedAt = openedStr ? new Date(openedStr).getTime() : Date.now();

            // OUTCOME
            const sign = document.getElementById('tradeOutcomeSign').value;
            const value = parseFloat(document.getElementById('tradeOutcomeValue').value) || 0;
            const outcome = sign === 'profit' ? value : sign === 'loss' ? -value : 0;

            const updates = {
                amount: parseFloat(document.getElementById('tradeAmount').value) || 0,
                openedAt: openedAt,
                market: document.getElementById('tradeMarket').value.trim() || null,
                status: document.getElementById('tradeStatus').value,
                symbol: document.getElementById('tradeSymbol').value.trim() || null,
                timeframe: parseInt(document.getElementById('tradeTimeframe').value) || 0,
                direction: document.getElementById('tradeDirection').value,
                outcome: outcome
            };

            await update(ref(db, `users/${userUid}/openOrders/${tradeId}`), updates);

            showToast("Trade updated!", "success");
            overlay.classList.remove('active');

        } catch (error) {
            console.error("Edit failed:", error);
            showToast("Update failed", "error");
        }
    });
});