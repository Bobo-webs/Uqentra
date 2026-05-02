// ADMIN-SEARCH.JS
function ensureSearchEmptyRow(tbody) {
    let emptyRow = tbody.querySelector('.admin-search-empty');

    if (!emptyRow) {
        emptyRow = document.createElement('tr');
        emptyRow.className = 'admin-search-empty';
        emptyRow.innerHTML = `<td colspan="100%">No results found</td>`;
        tbody.appendChild(emptyRow);
    }

    return emptyRow;
}

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('adminSearchBtn');
    const searchInput = document.getElementById('adminSearchInput');
    const table = document.querySelector('.admin-users-table');

    if (!searchBtn || !searchInput || !table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    let emptyRow = ensureSearchEmptyRow(tbody);

    searchBtn.addEventListener('click', () => {
        searchInput.classList.toggle('show');
        if (searchInput.classList.contains('show')) {
            searchInput.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchBtn.contains(e.target)) {
            searchInput.classList.remove('show');
        }
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const rows = tbody.querySelectorAll('tr:not(.admin-search-empty)');

        let matchesFound = 0;

        rows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            const dataValues = Object.values(row.dataset).join(' ').toLowerCase();

            const isMatch =
                rowText.includes(query) ||
                dataValues.includes(query);

            row.classList.toggle('hidden', !isMatch);

            if (isMatch) matchesFound++;
        });

        emptyRow.classList.toggle(
            'show',
            matchesFound === 0 && query !== ''
        );
    });

    const observer = new MutationObserver(() => {
        emptyRow = ensureSearchEmptyRow(tbody);
    });

    observer.observe(tbody, { childList: true });
});