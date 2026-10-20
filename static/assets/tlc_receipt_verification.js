"use strict";

const elements = {
    input: document.getElementById("receiptInput"),
    button: document.getElementById("verifyButton"),
    resultArea: document.getElementById("resultArea"),
};


const suggestionBox = document.createElement("div");
suggestionBox.id = "receiptSuggestions";
suggestionBox.className = "receipt-suggestions";
suggestionBox.hidden = true;

elements.input.parentElement.appendChild(
    suggestionBox
);

let searchTimer = null;


function hideSuggestions() {
    suggestionBox.hidden = true;
    suggestionBox.innerHTML = "";
}


function renderSuggestions(results) {

    if (!results || !results.length) {
        hideSuggestions();
        return;
    }

    suggestionBox.innerHTML = results.map(item => `
        <button
            type="button"
            class="receipt-suggestion"
            data-receipt="${escapeHtml(item.receipt_number)}"
        >
            <strong>
                ${escapeHtml(item.receipt_number)}
            </strong>

            <span>
                ${escapeHtml(item.full_name || "Unknown Member")}
                • ${escapeHtml(item.payment_type || "Payment")}
                • KSh ${Number(item.amount || 0).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </span>
        </button>
    `).join("");

    suggestionBox.hidden = false;
}


async function searchReceipts(query) {

    if (!query) {
        hideSuggestions();
        return;
    }

    try {

        const params = new URLSearchParams();
        params.set("q", query);

        const response = await fetch(
            `/api/tlc/search-receipts?${params.toString()}`,
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            hideSuggestions();
            return;
        }

        renderSuggestions(data.results);

    } catch (error) {

        console.error(
            "TLC receipt search:",
            error
        );

        hideSuggestions();
    }
}

function formatMoney(value) {
    return (
        "KSh " +
        Number(value || 0).toLocaleString(
            "en-KE",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )
    );
}


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatDate(value) {
    if (!value) {
        return "—";
    }

    const parts = String(value).split("-");

    if (parts.length !== 3) {
        return value;
    }

    return (
        parts[2] +
        " " +
        [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"
        ][Number(parts[1]) - 1] +
        " " +
        parts[0]
    );
}


function formatTime(value) {
    if (!value) {
        return "—";
    }

    const match = String(value).match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (!match) {
        return value;
    }

    let hour = Number(match[1]);

    const minute = match[2];

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    return (
        String(hour).padStart(2, "0") +
        ":" +
        minute +
        " " +
        suffix
    );
}


function showReady() {

    elements.resultArea.innerHTML = `
        <section class="empty-state">

            <div class="empty-icon">
                ✓
            </div>

            <h2>
                Ready for Verification
            </h2>

            <p>
                Enter a TLC receipt reference above.
            </p>

        </section>
    `;
}


function showError(message) {

    elements.resultArea.innerHTML = `
        <section class="result-card">

            <div class="result-banner invalid">

                <div class="result-symbol">
                    !
                </div>

                <div>
                    <strong>
                        Receipt Not Verified
                    </strong>

                    <span>
                        ${escapeHtml(message)}
                    </span>
                </div>

            </div>

        </section>
    `;
}


function renderReceipt(receipt) {

    elements.resultArea.innerHTML = `

        <section class="result-card">

            <div class="result-banner">

                <div class="result-symbol">
                    ✓
                </div>

                <div>
                    <strong>
                        Official TLC Receipt Verified
                    </strong>

                    <span>
                        The receipt reference was found in
                        the official contribution register.
                    </span>
                </div>

            </div>


            <div class="result-body">

                <div class="receipt-number-card">

                    <span class="receipt-label">
                        Official Receipt Reference
                    </span>

                    <strong class="receipt-number">
                        ${escapeHtml(
                            receipt.receipt_number
                        )}
                    </strong>

                </div>


                <div class="detail-grid">

                    <div class="detail-item">
                        <span>
                            Member
                        </span>

                        <strong>
                            ${escapeHtml(
                                receipt.full_name || "—"
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Member ID
                        </span>

                        <strong>
                            ${escapeHtml(
                                receipt.member_id || "—"
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Payment Date
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatDate(
                                    receipt.payment_date
                                )
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Payment Time
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatTime(
                                    receipt.payment_time
                                )
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Payment Type
                        </span>

                        <strong>
                            ${escapeHtml(
                                receipt.payment_type || "—"
                            )}
                        </strong>
                    </div>


                    <div class="detail-item amount-detail">
                        <span>
                            Amount
                        </span>

                        <strong>
                            ${formatMoney(
                                receipt.amount
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Description
                        </span>

                        <strong>
                            ${escapeHtml(
                                receipt.description || "—"
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Payment Method
                        </span>

                        <strong>
                            ${escapeHtml(
                                receipt.payment_method || "—"
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Transaction Reference
                        </span>

                        <strong class="reference">
                            ${escapeHtml(
                                receipt.transaction_reference || "—"
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Contribution ID
                        </span>

                        <strong class="reference">
                            ${escapeHtml(
                                receipt.contribution_id || "—"
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Recorded By
                        </span>

                        <strong>
                            ${escapeHtml(
                                receipt.recorded_by || "—"
                            )}
                        </strong>
                    </div>


                    <div class="detail-item">
                        <span>
                            Record Status
                        </span>

                        <strong>
                            <span class="status-badge">
                                ${escapeHtml(
                                    receipt.status || "—"
                                )}
                            </span>
                        </strong>
                    </div>

                </div>


                <section class="verification-authority">

                    <div class="verification-seals">

                        <div class="verification-seal">

                            <img
                                src="/static/assets/tlc_official_stamp.jpeg"
                                alt="The Legacy Circle Official Seal"
                            >

                            <span>
                                OFFICIAL TLC SEAL
                            </span>

                        </div>


                        <div class="verification-seal">

                            <img
                                src="/static/assets/tlc_treasury_seal.jpeg"
                                alt="The Legacy Circle Treasury Seal"
                            >

                            <span>
                                GROUP TREASURY SEAL
                            </span>

                        </div>

                    </div>


                    <div class="verification-signature">

                        <div class="label">
                            OFFICIAL RECEIPT AUTHORITY
                        </div>

                        <strong>
                            Alvin Owuor
                        </strong>

                        <span class="title">
                            Treasurer
                        </span>

                        <small>
                            The Legacy Circle (TLC)
                        </small>

                        <div class="signature">
                            Alvin Owuor
                        </div>

                        <div class="signature-line"></div>

                        <div class="signature-caption">
                            Authorized Treasurer
                        </div>

                    </div>

                </section>

            </div>

        </section>
    `;
}


async function verifyReceipt() {

    const receiptNumber =
        elements.input.value.trim();

    if (!receiptNumber) {

        showError(
            "Enter a receipt reference first."
        );

        elements.input.focus();

        return;
    }


    elements.button.disabled = true;
    elements.button.textContent =
        "Verifying...";


    try {

        const params =
            new URLSearchParams();

        params.set(
            "receipt",
            receiptNumber
        );


        const response =
            await fetch(
                `/api/tlc/verify-receipt?${params.toString()}`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                }
            );


        const data =
            await response.json();


        if (
            response.status === 403
        ) {

            throw new Error(
                "Access denied."
            );
        }


        if (
            !response.ok ||
            !data.success ||
            !data.receipt
        ) {

            throw new Error(
                data.message ||
                "Receipt could not be verified."
            );
        }


        renderReceipt(
            data.receipt
        );

    } catch (error) {

        console.error(
            "TLC Receipt Verification:",
            error
        );

        showError(
            error.message ||
            "Unable to verify this receipt."
        );

    } finally {

        elements.button.disabled = false;
        elements.button.textContent =
            "Verify Receipt";
    }
}


elements.button.addEventListener(
    "click",
    verifyReceipt
);


elements.input.addEventListener(
    "input",
    () => {

        const query =
            elements.input.value.trim();

        clearTimeout(searchTimer);

        if (!query) {
            hideSuggestions();
            return;
        }

        searchTimer = setTimeout(
            () => searchReceipts(query),
            200
        );
    }
);


elements.input.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            hideSuggestions();
            verifyReceipt();
        }

        if (event.key === "Escape") {
            hideSuggestions();
        }
    }
);


suggestionBox.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".receipt-suggestion"
            );

        if (!button) {
            return;
        }

        elements.input.value =
            button.dataset.receipt || "";

        hideSuggestions();

        verifyReceipt();
    }
);


document.addEventListener(
    "click",
    event => {

        if (
            event.target !== elements.input &&
            !suggestionBox.contains(event.target)
        ) {
            hideSuggestions();
        }
    }
);


showReady();


/* TLC Receipt Autocomplete */

async function loadReceiptOptions() {

    const datalist =
        document.getElementById("receiptOptions");

    if (!datalist) {
        return;
    }

    try {

        const response = await fetch(
            "/api/tlc/receipt-options",
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (
            !response.ok ||
            !data.success ||
            !Array.isArray(data.results)
        ) {
            return;
        }

        datalist.innerHTML =
            data.results.map(item => `
                <option
                    value="${escapeHtml(item.receipt_number)}"
                    label="${escapeHtml(item.full_name || "")}"
                ></option>
            `).join("");

    } catch (error) {

        console.error(
            "TLC Receipt Options:",
            error
        );
    }
}

loadReceiptOptions();


// ============================================================
// TLC_PARTIAL_RECEIPT_SEARCH
// Allows searching with only receipt digits, e.g. 24 or 0024.
// ============================================================

(function () {

    const input =
        document.getElementById("receiptInput");

    const datalist =
        document.getElementById("receiptOptions");

    if (!input || !datalist) {
        return;
    }

    let timer = null;

    input.addEventListener("input", function () {

        const query =
            input.value.trim();

        clearTimeout(timer);

        if (!query) {
            datalist.innerHTML = "";
            return;
        }

        timer = setTimeout(async function () {

            try {

                const params =
                    new URLSearchParams();

                params.set("q", query);

                const response =
                    await fetch(
                        "/api/tlc/search-receipts?" +
                        params.toString(),
                        {
                            method: "GET",
                            credentials: "same-origin",
                            cache: "no-store"
                        }
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success ||
                    !Array.isArray(data.results)
                ) {
                    datalist.innerHTML = "";
                    return;
                }

                datalist.innerHTML =
                    data.results.map(function (item) {

                        return `
                            <option
                                value="${escapeHtml(
                                    item.receipt_number
                                )}"
                                label="${escapeHtml(
                                    item.full_name || ""
                                )}">
                            </option>
                        `;

                    }).join("");

            } catch (error) {

                console.error(
                    "TLC Partial Receipt Search:",
                    error
                );

            }

        }, 150);

    });

})();

