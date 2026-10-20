"use strict";

const state = {
    fullReport: null,
    currentReport: null,
};


const elements = {
    periodLabel:
        document.getElementById("periodLabel"),

    yearFilter:
        document.getElementById("yearFilter"),

    monthFilter:
        document.getElementById("monthFilter"),

    applyFilter:
        document.getElementById("applyFilter"),

    clearFilter:
        document.getElementById("clearFilter"),

    refreshButton:
        document.getElementById("refreshButton"),

    printButton:
        document.getElementById("printButton"),

    registrationFees:
        document.getElementById("registrationFees"),

    weeklyContributions:
        document.getElementById("weeklyContributions"),

    totalContributions:
        document.getElementById("totalContributions"),

    fines:
        document.getElementById("fines"),

    transactions:
        document.getElementById("transactions"),

    totalFunds:
        document.getElementById("totalFunds"),

    memberCount:
        document.getElementById("memberCount"),

    transactionCount:
        document.getElementById("transactionCount"),

    ledgerContainer:
        document.getElementById("ledgerContainer"),

    emptyState:
        document.getElementById("emptyState"),
};


const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];


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

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
        !year ||
        !month ||
        !day
    ) {
        return value;
    }

    return (
        String(day).padStart(2, "0") +
        " " +
        monthNames[month - 1].slice(0, 3) +
        " " +
        year
    );
}


function formatTime(value) {

    if (!value) {
        return "—";
    }

    const match = String(value).match(
        /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );

    if (!match) {
        return value;
    }

    let hour = Number(match[1]);
    const minute = match[2];

    const suffix = hour >= 12
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


function prettifyPaymentType(value) {

    const text = String(
        value || ""
    ).trim();

    if (!text) {
        return "—";
    }

    return text;
}


function showLoading() {

    elements.ledgerContainer.innerHTML = `
        <div class="empty-state">
            Loading the official TLC financial register...
        </div>
    `;

    elements.emptyState.classList.add(
        "hidden"
    );
}


function showError(message) {

    elements.ledgerContainer.innerHTML = `
        <div class="empty-state">
            ${escapeHtml(message)}
        </div>
    `;

    elements.emptyState.classList.add(
        "hidden"
    );
}


function renderSummary(summary) {

    elements.registrationFees.textContent =
        formatMoney(
            summary.registration_fees
        );

    elements.weeklyContributions.textContent =
        formatMoney(
            summary.weekly_contributions
        );

    elements.totalContributions.textContent =
        formatMoney(
            summary.total_contributions
        );

    elements.fines.textContent =
        formatMoney(
            summary.fines
        );

    elements.transactions.textContent =
        Number(
            summary.transactions || 0
        ).toLocaleString("en-KE");

    elements.totalFunds.textContent =
        formatMoney(
            summary.current_balance
        );

    elements.memberCount.textContent =
        Number(
            summary.members || 0
        ).toLocaleString("en-KE") +
        " members";

    elements.transactionCount.textContent =
        Number(
            summary.transactions || 0
        ).toLocaleString("en-KE") +
        " transactions";
}


function renderLedger(report) {

    const members = Array.isArray(
        report.members
    )
        ? report.members
        : [];

    elements.ledgerContainer.innerHTML = "";

    if (!members.length) {

        elements.emptyState.classList.remove(
            "hidden"
        );

        return;
    }

    elements.emptyState.classList.add(
        "hidden"
    );

    members.forEach(
        (member, memberIndex) => {

            const block =
                document.createElement("section");

            block.className =
                "member-block";

            const transactions =
                Array.isArray(
                    member.transactions
                )
                    ? member.transactions
                    : [];

            let transactionMarkup = "";

            if (!transactions.length) {

                transactionMarkup = `
                    <tbody>
                        <tr>
                            <td
                                colspan="5"
                                style="text-align:center;color:#7a8998;padding:25px;"
                            >
                                No transactions recorded
                                for this member in the
                                selected period.
                            </td>
                        </tr>
                    </tbody>
                `;

            } else {

                transactionMarkup = `
                    <tbody>
                        ${transactions.map(
                            transaction => `
                                <tr>

                                    <td class="date-cell">
                                        ${escapeHtml(
                                            formatDate(
                                                transaction.date
                                            )
                                        )}
                                    </td>

                                    <td class="time-cell">
                                        ${escapeHtml(
                                            formatTime(
                                                transaction.time
                                            )
                                        )}
                                    </td>

                                    <td class="type-cell">
                                        ${escapeHtml(
                                            prettifyPaymentType(
                                                transaction.payment_type
                                            )
                                        )}
                                    </td>

                                    <td class="amount-cell">
                                        ${formatMoney(
                                            transaction.amount
                                        )}
                                    </td>

                                    <td class="receipt-cell">
                                        ${escapeHtml(
                                            transaction.receipt_number ||
                                            "—"
                                        )}
                                    </td>

                                </tr>
                            `
                        ).join("")}
                    </tbody>
                `;
            }

            block.innerHTML = `
                <div class="member-header">

                    <div class="member-name-area">

                        <div class="member-number">
                            ${String(
                                memberIndex + 1
                            ).padStart(2, "0")}
                        </div>

                        <div>

                            <div class="member-name">
                                ${escapeHtml(
                                    member.full_name
                                )}
                            </div>

                            <div class="member-id">
                                ${escapeHtml(
                                    member.member_id
                                )}
                            </div>

                        </div>

                    </div>


                    <div class="member-totals">

                        <div class="member-total-box">
                            <span>
                                Transactions
                            </span>

                            <strong>
                                ${Number(
                                    member.transaction_count || 0
                                )}
                            </strong>
                        </div>


                        <div class="member-total-box">
                            <span>
                                Fines
                            </span>

                            <strong>
                                ${formatMoney(
                                    member.fines
                                )}
                            </strong>
                        </div>


                        <div class="member-total-box main">
                            <span>
                                Total Contributions
                            </span>

                            <strong>
                                ${formatMoney(
                                    member.total_contributions
                                )}
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="transaction-table-wrap">

                    <table class="transaction-table">

                        <thead>
                            <tr>
                                <th>
                                    Date
                                </th>

                                <th>
                                    Time
                                </th>

                                <th>
                                    Payment Type
                                </th>

                                <th>
                                    Amount
                                </th>

                                <th>
                                    Receipt Reference
                                </th>
                            </tr>
                        </thead>

                        ${transactionMarkup}

                    </table>

                </div>


                <div class="member-footer">

                    <div class="member-footer-item">
                        <span>
                            Registration Fees
                        </span>

                        <strong>
                            ${formatMoney(
                                member.registration_fees
                            )}
                        </strong>
                    </div>


                    <div class="member-footer-item">
                        <span>
                            Weekly Contributions
                        </span>

                        <strong>
                            ${formatMoney(
                                member.weekly_contributions
                            )}
                        </strong>
                    </div>


                    <div class="member-footer-item">
                        <span>
                            Total Contributions
                        </span>

                        <strong>
                            ${formatMoney(
                                member.total_contributions
                            )}
                        </strong>
                    </div>


                    <div class="member-footer-item">
                        <span>
                            Fines
                        </span>

                        <strong>
                            ${formatMoney(
                                member.fines
                            )}
                        </strong>
                    </div>

                </div>
            `;

            elements.ledgerContainer.appendChild(
                block
            );
        }
    );


    const summary =
        report.summary || {};

    const grandTotal =
        document.createElement("section");

    grandTotal.className =
        "grand-total";

    grandTotal.innerHTML = `
        <div class="grand-total-title">
            TLC GRAND TOTAL
        </div>

        <div class="grand-total-grid">

            <div class="grand-total-item">
                <span>
                    Registration Fees
                </span>

                <strong>
                    ${formatMoney(
                        summary.registration_fees
                    )}
                </strong>
            </div>


            <div class="grand-total-item">
                <span>
                    Weekly Contributions
                </span>

                <strong>
                    ${formatMoney(
                        summary.weekly_contributions
                    )}
                </strong>
            </div>


            <div class="grand-total-item">
                <span>
                    Total Contributions
                </span>

                <strong>
                    ${formatMoney(
                        summary.total_contributions
                    )}
                </strong>
            </div>


            <div class="grand-total-item">
                <span>
                    Fines
                </span>

                <strong>
                    ${formatMoney(
                        summary.fines
                    )}
                </strong>
            </div>


            <div class="grand-total-item">
                <span>
                    Transactions
                </span>

                <strong>
                    ${Number(
                        summary.transactions || 0
                    ).toLocaleString("en-KE")}
                </strong>
            </div>


            <div class="grand-total-item">
                <span>
                    Total Money In
                </span>

                <strong>
                    ${formatMoney(
                        summary.total_money_in
                    )}
                </strong>
            </div>

            <div class="grand-total-item">
                <span>
                    Total Money Out
                </span>

                <strong>
                    ${formatMoney(
                        summary.total_money_out
                    )}
                </strong>
            </div>

            <div class="grand-total-item main">
                <span>
                    Current TLC Balance
                </span>

                <strong>
                    ${formatMoney(
                        summary.current_balance
                    )}
                </strong>
            </div>

        </div>
    `;

    elements.ledgerContainer.appendChild(
        grandTotal
    );
}



function renderMoneyOutStatements(transactions) {

    const records = Array.isArray(transactions)
        ? transactions
        : [];

    const section =
        document.createElement("section");

    section.className = "money-out-register-section";

    section.style.marginTop = "28px";
    section.style.border = "1px solid rgba(255,255,255,.08)";
    section.style.borderRadius = "16px";
    section.style.overflow = "hidden";
    section.style.background = "#0b1828";
    section.style.boxShadow = "0 18px 45px rgba(0,0,0,.18)";

    const total = records.reduce(
        (sum, item) =>
            sum + Number(item.amount || 0),
        0
    );

    const header = document.createElement("div");

    header.style.padding = "18px 20px";
    header.style.borderBottom =
        "1px solid rgba(255,255,255,.08)";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.gap = "15px";
    header.style.flexWrap = "wrap";

    header.innerHTML = `
        <div>
            <div style="
                font-size:18px;
                font-weight:800;
                color:#d4af37;
            ">
                MONEY OUT STATEMENTS
            </div>

            <div style="
                margin-top:4px;
                font-size:11px;
                color:#8ea4ba;
            ">
                Official TLC disbursement statements
                included in this Financial Register
            </div>
        </div>

        <div style="
            padding:10px 14px;
            border-radius:10px;
            background:rgba(34,199,255,.08);
            border:1px solid rgba(34,199,255,.20);
            color:#7ddfff;
            font-weight:800;
            font-size:12px;
        ">
            ${formatMoney(total)} OUT
        </div>
    `;

    section.appendChild(header);

    if (!records.length) {

        const empty = document.createElement("div");

        empty.style.padding = "35px 20px";
        empty.style.textAlign = "center";
        empty.style.color = "#8ea4ba";

        empty.innerHTML = `
            No disbursement statements recorded
            for this reporting period.
        `;

        section.appendChild(empty);

        elements.ledgerContainer.appendChild(
            section
        );

        return;
    }

    const tableWrap =
        document.createElement("div");

    tableWrap.style.overflowX = "auto";

    const table =
        document.createElement("table");

    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.minWidth = "950px";

    table.innerHTML = `
        <thead>
            <tr>
                <th style="padding:12px;text-align:left;">
                    Date
                </th>

                <th style="padding:12px;text-align:left;">
                    Disbursement ID
                </th>

                <th style="padding:12px;text-align:left;">
                    Category
                </th>

                <th style="padding:12px;text-align:left;">
                    Purpose
                </th>

                <th style="padding:12px;text-align:left;">
                    Paid To
                </th>

                <th style="padding:12px;text-align:left;">
                    Payment Method
                </th>

                <th style="padding:12px;text-align:right;">
                    Amount
                </th>

                <th style="padding:12px;text-align:left;">
                    Status
                </th>
            </tr>
        </thead>

        <tbody></tbody>
    `;

    const tbody =
        table.querySelector("tbody");

    records.forEach(item => {

        const row =
            document.createElement("tr");

        row.style.borderTop =
            "1px solid rgba(255,255,255,.06)";

        row.innerHTML = `
            <td style="padding:12px;">
                ${item.date || ""}
            </td>

            <td style="padding:12px;">
                ${item.disbursement_id || ""}
            </td>

            <td style="padding:12px;">
                ${item.category || ""}
            </td>

            <td style="padding:12px;">
                ${item.purpose || ""}
            </td>

            <td style="padding:12px;">
                ${item.paid_to || ""}
            </td>

            <td style="padding:12px;">
                ${item.payment_method || ""}
            </td>

            <td style="
                padding:12px;
                text-align:right;
                font-weight:800;
                color:#ffcf55;
            ">
                ${formatMoney(item.amount)}
            </td>

            <td style="padding:12px;">
                <span style="
                    display:inline-block;
                    padding:5px 8px;
                    border-radius:999px;
                    background:rgba(85,223,160,.10);
                    border:1px solid rgba(85,223,160,.20);
                    color:#72e9ac;
                    font-size:10px;
                    font-weight:800;
                ">
                    ${(item.status || "RECORDED").toUpperCase()}
                </span>
            </td>
        `;

        tbody.appendChild(row);
    });

    tableWrap.appendChild(table);
    section.appendChild(tableWrap);

    const footer =
        document.createElement("div");

    footer.style.padding = "15px 20px";
    footer.style.borderTop =
        "1px solid rgba(255,255,255,.08)";
    footer.style.textAlign = "right";
    footer.style.fontWeight = "900";
    footer.style.color = "#f3f7fb";

    footer.innerHTML =
        `TOTAL MONEY OUT: ${formatMoney(total)}`;

    section.appendChild(footer);

    elements.ledgerContainer.appendChild(
        section
    );
}

function populateYears(report) {

    const years = new Set();

    for (
        const member
        of report.members || []
    ) {

        for (
            const transaction
            of member.transactions || []
        ) {

            const date =
                String(
                    transaction.date || ""
                );

            if (
                date.length >= 4 &&
                /^\d{4}/.test(date)
            ) {
                years.add(
                    date.slice(0, 4)
                );
            }
        }
    }

    const sortedYears =
        Array.from(years).sort(
            (a, b) =>
                Number(b) - Number(a)
        );

    elements.yearFilter.innerHTML =
        `<option value="">All years</option>`;

    sortedYears.forEach(year => {

        const option =
            document.createElement("option");

        option.value = year;
        option.textContent = year;

        elements.yearFilter.appendChild(
            option
        );
    });
}


function populateMonths() {

    elements.monthFilter.innerHTML =
        `<option value="">All months</option>`;

    monthNames.forEach(
        (monthName, index) => {

            const option =
                document.createElement("option");

            option.value =
                String(index + 1)
                    .padStart(2, "0");

            option.textContent =
                monthName;

            elements.monthFilter.appendChild(
                option
            );
        }
    );
}


function updateMonthState() {

    const hasYear =
        Boolean(
            elements.yearFilter.value
        );

    elements.monthFilter.disabled =
        !hasYear;

    if (!hasYear) {
        elements.monthFilter.value = "";
    }
}


async function fetchRegister(
    year = "",
    month = ""
) {

    showLoading();

    elements.applyFilter.disabled = true;

    try {

        const params =
            new URLSearchParams();

        if (year) {
            params.set(
                "year",
                year
            );
        }

        if (month) {
            params.set(
                "month",
                month
            );
        }

        const query =
            params.toString()
                ? `?${params.toString()}`
                : "";

        const response =
            await fetch(
                `/api/tlc/financial-register${query}`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                }
            );

        if (response.status === 403) {

            showError(
                "Access denied. This financial register is private."
            );

            return;
        }

        if (!response.ok) {
            throw new Error(
                "Unable to load the financial register."
            );
        }

        const data =
            await response.json();

        if (
            !data.success ||
            !data.report
        ) {

            throw new Error(
                data.message ||
                "Unable to load the financial register."
            );
        }

        state.currentReport =
            data.report;

        renderSummary(
            data.report.summary || {}
        );

        renderLedger(
            data.report
        );

        elements.periodLabel.textContent =
            data.report.period?.label ||
            "All Recorded Transactions";

    } catch (error) {

        console.error(
            "TLC Financial Register:",
            error
        );

        showError(
            error.message ||
            "Unable to load the financial register."
        );

    } finally {

        elements.applyFilter.disabled =
            false;
    }
}


async function initialLoad() {

    elements.refreshButton.disabled =
        true;

    try {

        const response =
            await fetch(
                "/api/tlc/financial-register",
                {
                    credentials: "same-origin",
                    cache: "no-store",
                }
            );

        if (response.status === 403) {

            showError(
                "Access denied. This financial register is private."
            );

            return;
        }

        if (!response.ok) {
            throw new Error(
                "Unable to load the financial register."
            );
        }

        const data =
            await response.json();

        if (
            !data.success ||
            !data.report
        ) {

            throw new Error(
                data.message ||
                "Unable to load the financial register."
            );
        }

        state.fullReport =
            data.report;

        populateYears(
            data.report
        );

        populateMonths();

        state.currentReport =
            data.report;

        renderSummary(
            data.report.summary || {}
        );

        renderLedger(
            data.report
        );

        elements.periodLabel.textContent =
            data.report.period?.label ||
            "All Recorded Transactions";

    } catch (error) {

        console.error(
            "TLC Financial Register:",
            error
        );

        showError(
            error.message ||
            "Unable to load the financial register."
        );

    } finally {

        elements.refreshButton.disabled =
            false;
    }
}


elements.yearFilter.addEventListener(
    "change",
    updateMonthState
);


elements.applyFilter.addEventListener(
    "click",
    () => {

        fetchRegister(
            elements.yearFilter.value,
            elements.monthFilter.value
        );
    }
);


elements.clearFilter.addEventListener(
    "click",
    () => {

        elements.yearFilter.value = "";
        elements.monthFilter.value = "";

        updateMonthState();

        fetchRegister();
    }
);


elements.refreshButton.addEventListener(
    "click",
    () => {

        fetchRegister(
            elements.yearFilter.value,
            elements.monthFilter.value
        );
    }
);


elements.printButton.addEventListener(
    "click",
    () => {
        window.print();
    }
);


populateMonths();
updateMonthState();
initialLoad();



document.addEventListener("DOMContentLoaded",()=>{
 const b=document.createElement("a");
 b.href="/tlc-disbursements";
 b.textContent="Record Money Out";
 Object.assign(b.style,{
  position:"fixed",right:"22px",bottom:"22px",zIndex:"9999",
  padding:"13px 18px",borderRadius:"12px",
  background:"#d4af37",color:"#07111f",
  textDecoration:"none",fontWeight:"800"
 });
 document.body.appendChild(b);
});


