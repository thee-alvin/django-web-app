let allContributions = [];
let selectedContribution = null;


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatCurrency(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "KES 0.00";
    }

    return "KES " + amount.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function statusClass(status) {
    const value = String(status || "").toLowerCase();

    if (
        value.includes("cancel") ||
        value.includes("reject") ||
        value.includes("fail")
    ) {
        return "status-cancelled";
    }

    if (
        value.includes("pending") ||
        value.includes("processing") ||
        value.includes("queued")
    ) {
        return "status-pending";
    }

    if (
        value.includes("paid") ||
        value.includes("issued")
    ) {
        return "status-paid";
    }

    return "status-recorded";
}


function updateSummary(summary) {

    document.getElementById("totalAmount").textContent =
        formatCurrency(summary.total || 0);

    document.getElementById("thisMonth").textContent =
        formatCurrency(summary.this_month || 0);

    document.getElementById("paymentCount").textContent =
        String(summary.count || 0);

    document.getElementById("latestPayment").textContent =
        summary.latest
            ? formatCurrency(summary.latest.amount || 0)
            : "—";
}


function getFilteredContributions() {

    let records = [...allContributions];

    const search =
        document
            .getElementById("contributionSearch")
            .value
            .trim()
            .toLowerCase();

    const period =
        document
            .getElementById("periodFilter")
            .value;

    const status =
        document
            .getElementById("statusFilter")
            .value;

    records = records.filter(item => {

        const searchable = [
            item.payment_type,
            item.description,
            item.transaction_reference,
            item.receipt_number,
            item.contribution_id,
            item.payment_method
        ]
            .join(" ")
            .toLowerCase();

        if (
            search &&
            !searchable.includes(search)
        ) {
            return false;
        }

        const paymentDate =
            String(item.payment_date || "");

        const now = new Date();

        if (period === "month") {

            const month =
                now.getFullYear() +
                "-" +
                String(
                    now.getMonth() + 1
                ).padStart(2, "0");

            if (!paymentDate.startsWith(month)) {
                return false;
            }
        }

        if (period === "year") {

            const year =
                String(now.getFullYear());

            if (!paymentDate.startsWith(year)) {
                return false;
            }
        }

        if (status !== "all") {

            const itemStatus =
                String(
                    item.status || ""
                ).toUpperCase();

            if (!itemStatus.includes(status)) {
                return false;
            }
        }

        return true;
    });


    const sort =
        document.getElementById("sortFilter")?.value ||
        "newest";

    records.sort((a, b) => {

        const dateA =
            `${a.payment_date || ""} ${a.payment_time || ""}`;

        const dateB =
            `${b.payment_date || ""} ${b.payment_time || ""}`;

        return sort === "oldest"
            ? dateA.localeCompare(dateB)
            : dateB.localeCompare(dateA);
    });

    return records;
}


function renderTable() {

    const tbody =
        document.getElementById(
            "contributionTableBody"
        );

    const records =
        getFilteredContributions();

    tbody.innerHTML = "";


    const countElement =
        document.getElementById(
            "recordCount"
        );

    if (countElement) {

        countElement.textContent =
            `${records.length} record${
                records.length === 1
                    ? ""
                    : "s"
            }`;
    }


    if (records.length === 0) {

        document
            .getElementById("tableWrap")
            .classList.add("hidden");

        document
            .getElementById("filteredEmptyState")
            .classList.remove("hidden");

        return;
    }


    document
        .getElementById("filteredEmptyState")
        .classList.add("hidden");

    document
        .getElementById("tableWrap")
        .classList.remove("hidden");


    records.forEach(item => {

        const row =
            document.createElement("tr");

        const receiptButton =
            item.receipt_number
                ? `
                    <button
                        type="button"
                        class="action-button"
                        data-action="receipt"
                        data-id="${escapeHtml(
                            item.contribution_id
                        )}"
                    >
                        Receipt
                    </button>
                  `
                : `
                    <span
                        style="
                            color:#8894a7;
                            font-size:12px;
                        "
                    >
                        No receipt
                    </span>
                  `;


        row.innerHTML = `
            <td>
                ${escapeHtml(
                    item.payment_date || "—"
                )}
            </td>

            <td>
                <strong>
                    ${escapeHtml(
                        item.payment_type ||
                        "Contribution"
                    )}
                </strong>

                <br>

                <small>
                    ${escapeHtml(
                        item.description || ""
                    )}
                </small>
            </td>

            <td class="amount-cell">
                ${formatCurrency(item.amount)}
            </td>

            <td>
                ${escapeHtml(
                    item.payment_method || "—"
                )}
            </td>

            <td class="reference">
                ${escapeHtml(
                    item.transaction_reference ||
                    "—"
                )}
            </td>

            <td>
                <span
                    class="
                        status-badge
                        ${statusClass(item.status)}
                    "
                >
                    ${escapeHtml(
                        item.status ||
                        "UNKNOWN"
                    )}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="action-button secondary"
                    data-action="details"
                    data-id="${escapeHtml(
                        item.contribution_id
                    )}"
                >
                    Details
                </button>

                ${receiptButton}

            </td>
        `;

        tbody.appendChild(row);
    });
}


function getContributionById(id) {

    return allContributions.find(
        item =>
            String(item.contribution_id || "") ===
            String(id || "")
    );
}


function openDetails(item) {

    if (!item) {
        return;
    }

    selectedContribution = item;


    document.getElementById(
        "detailContributionId"
    ).textContent =
        item.contribution_id || "—";


    document.getElementById(
        "detailDate"
    ).textContent =
        item.payment_date || "—";


    document.getElementById(
        "detailTime"
    ).textContent =
        item.payment_time || "—";


    document.getElementById(
        "detailType"
    ).textContent =
        item.payment_type || "—";


    document.getElementById(
        "detailDescription"
    ).textContent =
        item.description || "—";


    document.getElementById(
        "detailAmount"
    ).textContent =
        formatCurrency(item.amount);


    document.getElementById(
        "detailMethod"
    ).textContent =
        item.payment_method || "—";


    document.getElementById(
        "detailReference"
    ).textContent =
        item.transaction_reference || "—";


    document.getElementById(
        "detailStatus"
    ).textContent =
        item.status || "—";


    document.getElementById(
        "detailReceipt"
    ).textContent =
        item.receipt_number ||
        "Not yet available";


    const receiptAction =
        document.getElementById(
            "detailReceiptButton"
        );


    if (item.receipt_number) {

        receiptAction.classList.remove(
            "hidden"
        );

        receiptAction.textContent =
            "View Official Receipt";

    } else {

        receiptAction.classList.add(
            "hidden"
        );
    }


    document
        .getElementById("detailsOverlay")
        .classList.remove("hidden");
}


function closeDetails() {

    document
        .getElementById("detailsOverlay")
        .classList.add("hidden");

    selectedContribution = null;
}


function openReceipt(item) {

    if (
        !item ||
        !item.receipt_number
    ) {
        return;
    }


    const receiptNumber =
        String(item.receipt_number)
            .trim();


    window.location.href =
        "/member/receipt/" +
        receiptNumber
            .split("/")
            .map(
                part =>
                    encodeURIComponent(part)
            )
            .join("/");
}


async function loadContributions() {

    document
        .getElementById("loadingState")
        .classList.remove("hidden");

    document
        .getElementById("mainContent")
        .classList.add("hidden");

    document
        .getElementById("errorState")
        .classList.add("hidden");


    try {

        const response =
            await fetch(
                "/api/member/contributions",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to load contributions."
            );
        }


        allContributions =
            Array.isArray(
                data.contributions
            )
                ? data.contributions
                : [];


        document.getElementById(
            "memberId"
        ).textContent =
            "Member ID: " +
            (data.member_id || "—");


        updateSummary(
            data.summary || {}
        );

        renderTable();


        document
            .getElementById("loadingState")
            .classList.add("hidden");

        document
            .getElementById("mainContent")
            .classList.remove("hidden");


        const updatedElement =
            document.getElementById(
                "lastUpdated"
            );


        if (updatedElement) {

            updatedElement.textContent =
                "Last updated: " +
                new Date().toLocaleTimeString(
                    "en-KE",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );
        }


        if (allContributions.length === 0) {

            document
                .getElementById("noRecordsState")
                .classList.remove("hidden");

            document
                .getElementById("tableArea")
                .classList.add("hidden");

        } else {

            document
                .getElementById("noRecordsState")
                .classList.add("hidden");

            document
                .getElementById("tableArea")
                .classList.remove("hidden");
        }


    } catch (error) {

        console.error(
            "Contribution loading error:",
            error
        );


        document
            .getElementById("loadingState")
            .classList.add("hidden");

        document
            .getElementById("errorState")
            .classList.remove("hidden");
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById("contributionSearch")
            .addEventListener(
                "input",
                renderTable
            );


        document
            .getElementById("periodFilter")
            .addEventListener(
                "change",
                renderTable
            );


        document
            .getElementById("statusFilter")
            .addEventListener(
                "change",
                renderTable
            );


        document
            .getElementById("sortFilter")
            .addEventListener(
                "change",
                renderTable
            );


        document
            .getElementById("refreshContributions")
            .addEventListener(
                "click",
                loadContributions
            );


        document
            .getElementById(
                "contributionTableBody"
            )
            .addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-action]"
                        );

                    if (!button) {
                        return;
                    }


                    const id =
                        button.dataset.id;


                    const item =
                        getContributionById(id);


                    if (!item) {
                        return;
                    }


                    if (
                        button.dataset.action ===
                        "details"
                    ) {
                        openDetails(item);
                    }


                    if (
                        button.dataset.action ===
                        "receipt"
                    ) {
                        openReceipt(item);
                    }
                }
            );


        document
            .getElementById("closeDetails")
            .addEventListener(
                "click",
                closeDetails
            );


        document
            .getElementById("detailsOverlay")
            .addEventListener(
                "click",
                event => {

                    if (
                        event.target.id ===
                        "detailsOverlay"
                    ) {
                        closeDetails();
                    }
                }
            );


        document
            .getElementById(
                "detailReceiptButton"
            )
            .addEventListener(
                "click",
                () => {
                    openReceipt(
                        selectedContribution
                    );
                }
            );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    selectedContribution
                ) {
                    closeDetails();
                }
            }
        );


        loadContributions();
    }
);
