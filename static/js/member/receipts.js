const tableBody = document.getElementById("receiptTableBody");
const searchInput = document.getElementById("receiptSearch");
const paymentTypeFilter = document.getElementById("paymentTypeFilter");
const refreshButton = document.getElementById("refreshReceipts");

const totalReceipts = document.getElementById("totalReceipts");
const totalPaid = document.getElementById("totalPaid");
const latestPayment = document.getElementById("latestPayment");

let receipts = [];


function formatAmount(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
        return "KES 0.00";
    }

    return `KES ${value.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


function renderReceipts() {

    const search = searchInput.value.trim().toLowerCase();
    const type = paymentTypeFilter.value;

    const filtered = receipts.filter(receipt => {

        const receiptNumber =
            String(receipt.receipt_number || "").toLowerCase();

        const paymentType =
            String(receipt.payment_type || "");

        const matchesSearch =
            !search ||
            receiptNumber.includes(search) ||
            paymentType.toLowerCase().includes(search);

        const matchesType =
            !type ||
            paymentType === type;

        return matchesSearch && matchesType;
    });


    tableBody.innerHTML = "";


    if (filtered.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">

                    <div class="empty-state">

                        <div class="empty-icon">
                            🧾
                        </div>

                        <h3>No receipts found</h3>

                        <p>
                            There are no receipts matching your search.
                        </p>

                    </div>

                </td>
            </tr>
        `;

        return;
    }


    filtered.forEach(receipt => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${receipt.receipt_number || "—"}</td>
            <td>${receipt.payment_date || "—"}</td>
            <td>${receipt.payment_type || "—"}</td>
            <td>${formatAmount(receipt.amount)}</td>
            <td>${receipt.status || "Issued"}</td>
            <td>
                <button
                    type="button"
                    class="view-receipt"
                    data-receipt="${receipt.receipt_number || ""}"
                >
                    View
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });


    document.querySelectorAll(".view-receipt").forEach(button => {

        button.addEventListener("click", () => {

            const receiptNumber =
                button.dataset.receipt;

            window.location.href =
                `/member/receipt/${encodeURIComponent(receiptNumber)}`;
        });
    });
}


function updateSummary() {

    totalReceipts.textContent = receipts.length;

    const total = receipts.reduce(
        (sum, receipt) =>
            sum + (Number(receipt.amount) || 0),
        0
    );

    totalPaid.textContent = formatAmount(total);

    if (receipts.length > 0) {
        latestPayment.textContent =
            receipts[0].payment_date || "—";
    } else {
        latestPayment.textContent = "—";
    }
}


async function loadReceipts() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="6">

                <div class="empty-state">

                    <div class="empty-icon">
                        ⏳
                    </div>

                    <h3>Loading receipts...</h3>

                    <p>
                        Please wait while we retrieve your payment records.
                    </p>

                </div>

            </td>
        </tr>
    `;


    try {

        const response =
            await fetch("/api/member/receipts");

        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load receipts."
            );
        }


        receipts =
            Array.isArray(data.receipts)
                ? data.receipts
                : [];


        updateSummary();
        renderReceipts();

    } catch (error) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">

                    <div class="empty-state">

                        <div class="empty-icon">
                            ⚠
                        </div>

                        <h3>Unable to load receipts</h3>

                        <p>
                            ${error.message}
                        </p>

                    </div>

                </td>
            </tr>
        `;
    }
}


searchInput.addEventListener(
    "input",
    renderReceipts
);


paymentTypeFilter.addEventListener(
    "change",
    renderReceipts
);


refreshButton.addEventListener(
    "click",
    loadReceipts
);


loadReceipts();
