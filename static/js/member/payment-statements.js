"use strict";

const state = {
    statement: null,
    years: [],
};

const elements = {
    memberName:
        document.getElementById("memberName"),

    memberId:
        document.getElementById("memberId"),

    statementPeriod:
        document.getElementById("statementPeriod"),

    yearSelect:
        document.getElementById("yearSelect"),

    monthSelect:
        document.getElementById("monthSelect"),

    viewStatement:
        document.getElementById("viewStatement"),

    refreshStatement:
        document.getElementById("refreshStatement"),

    printStatement:
        document.getElementById("printStatement"),

    statementArea:
        document.getElementById("statementArea"),

    statementMessage:
        document.getElementById("statementMessage"),
};

const months = [
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


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function money(value) {

    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) {
        return "KSh 0.00";
    }

    return (
        "KSh " +
        amount.toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}


function date(value) {

    if (!value) {
        return "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â";
    }

    const raw =
        String(value)
            .trim()
            .split(" ")[0];

    const parts = raw.split("-");

    if (parts.length !== 3) {
        return value;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!year || !month || !day) {
        return value;
    }

    return (
        String(day).padStart(2, "0") +
        " " +
        months[month - 1].slice(0, 3) +
        " " +
        year
    );
}


function time(value) {

    if (!value) {
        return "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â";
    }

    const match =
        String(value).match(
            /^(\d{1,2}):(\d{2})(?::\d{2})?$/
        );

    if (!match) {
        return value;
    }

    let hour = Number(match[1]);

    const minute = match[2];

    const suffix =
        hour >= 12 ? "PM" : "AM";

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


function showMessage(message, type = "error") {

    elements.statementMessage.textContent =
        message;

    elements.statementMessage.className =
        "statement-message " + type;
}


function clearMessage() {

    elements.statementMessage.textContent = "";

    elements.statementMessage.className =
        "statement-message";
}


function populateYears(transactions) {

    const years = new Set();

    transactions.forEach(transaction => {

        const raw =
            String(
                transaction.date || ""
            ).trim();

        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {

            years.add(
                raw.slice(0, 4)
            );
        }
    });

    const currentYear =
        String(
            new Date().getFullYear()
        );

    years.add(currentYear);

    state.years =
        Array.from(years).sort(
            (a, b) =>
                Number(b) - Number(a)
        );

    elements.yearSelect.innerHTML =
        `
        <option value="">
            All Years
        </option>
        `;

    state.years.forEach(year => {

        const option =
            document.createElement("option");

        option.value = year;
        option.textContent = year;

        elements.yearSelect.appendChild(
            option
        );
    });
}


function populateMonths() {

    elements.monthSelect.innerHTML =
        `
        <option value="">
            All Months
        </option>
        `;

    months.forEach(
        (month, index) => {

            const option =
                document.createElement("option");

            option.value =
                String(index + 1).padStart(
                    2,
                    "0"
                );

            option.textContent = month;

            elements.monthSelect.appendChild(
                option
            );
        }
    );
}


function updateMonthState() {

    const hasYear =
        Boolean(
            elements.yearSelect.value
        );

    elements.monthSelect.disabled =
        !hasYear;

    if (!hasYear) {
        elements.monthSelect.value = "";
    }
}


function isFine(transaction) {

    const type =
        String(
            transaction.payment_type || ""
        ).toLowerCase();

    const description =
        String(
            transaction.description || ""
        ).toLowerCase();

    return (
        type.includes("fine") ||
        type.includes("penalty") ||
        description.includes("fine") ||
        description.includes("penalty")
    );
}


function receiptLink(receiptNumber) {

    if (!receiptNumber) {
        return "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â";
    }

    return `
        <a
            class="receipt-link"
            href="/member/receipt/${encodeURIComponent(receiptNumber)}"
        >
            ${escapeHtml(receiptNumber)}
        </a>
    `;
}


function renderStatement(statement) {

    const member =
        statement.member || {};

    const transactions =
        Array.isArray(member.transactions)
            ? member.transactions
            : [];

    const period =
        statement.period?.label ||
        "All Recorded Transactions";

    const totalPaid =
        Number(member.total_contributions || 0) +
        Number(member.fines || 0);

    const coverage =
        member.coverage || null;

    const coverageWeeks =
        Array.isArray(coverage?.weeks)
            ? coverage.weeks
            : [];

    const coverageAmount =
        Number(coverage?.amount || 0);

    const coverageWeekCount =
        Number(
            coverage?.week_count ||
            coverageWeeks.length ||
            0
        );

    elements.memberName.textContent =
        member.full_name || "TLC Member";

    elements.memberId.textContent =
        member.member_id || "Member ID";

    elements.statementPeriod.textContent =
        period;


    let rows = "";

    if (!transactions.length) {

        rows = `
            <tr>
                <td
                    colspan="7"
                    class="empty-row"
                >
                    No payment transactions were recorded
                    for this period.
                </td>
            </tr>
        `;

    } else {

        rows =
            transactions
                .map(transaction => {

                    const fine =
                        isFine(transaction);

                    return `
                        <tr class="${fine ? "fine-row" : ""}">

                            <td>
                                ${escapeHtml(
                                    date(
                                        transaction.date
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    time(
                                        transaction.time
                                    )
                                )}
                            </td>

                            <td>
                                <span
                                    class="type-badge ${
                                        fine
                                            ? "fine-badge"
                                            : ""
                                    }"
                                >
                                    ${escapeHtml(
                                        transaction.payment_type ||
                                        "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"
                                    )}
                                </span>
                            </td>

                            <td>
                                ${escapeHtml(
                                    transaction.description ||
                                    "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    transaction.payment_method ||
                                    "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"
                                )}
                            </td>

                            <td class="amount">
                                ${money(
                                    transaction.amount
                                )}
                            </td>

                            <td>
                                ${receiptLink(
                                    transaction.receipt_number
                                )}
                            </td>

                        </tr>
                    `;
                })
                .join("");
    }


    const generatedDate =
        String(
            statement.generated_at || ""
        ).split("T")[0];


    elements.statementArea.innerHTML = `

        <article class="statement-sheet">

            <header class="sheet-header">

                <div>

                    <span class="sheet-kicker">
                        OFFICIAL TLC MEMBER STATEMENT
                    </span>

                    <h2>
                        Payment Statement
                    </h2>

                    <p>
                        Official financial activity recorded
                        in the TLC financial register.
                    </p>

                </div>

                <div class="status-badge">
                    <span></span>
                    OFFICIAL RECORD
                </div>

            </header>


            <section class="identity-grid">

                <div>

                    <span>
                        MEMBER
                    </span>

                    <strong>
                        ${escapeHtml(
                            member.full_name ||
                            "TLC Member"
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            member.member_id ||
                            "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"
                        )}
                    </small>

                </div>


                <div>

                    <span>
                        STATEMENT PERIOD
                    </span>

                    <strong>
                        ${escapeHtml(period)}
                    </strong>

                    <small>
                        Generated ${escapeHtml(
                            date(generatedDate)
                        )}
                    </small>

                </div>

            </section>


            <section class="summary-grid">

                <div class="summary-card gold">
                    <span>REGISTRATION FEES</span>
                    <strong>
                        ${money(
                            member.registration_fees
                        )}
                    </strong>
                </div>

                <div class="summary-card blue">
                    <span>WEEKLY CONTRIBUTIONS</span>
                    <strong>
                        ${money(
                            member.weekly_contributions
                        )}
                    </strong>
                </div>

                <div class="summary-card red">
                    <span>FINES</span>
                    <strong>
                        ${money(
                            member.fines
                        )}
                    </strong>
                </div>

                <div class="summary-card teal">
                    <span>TOTAL PAID</span>
                    <strong>
                        ${money(totalPaid)}
                    </strong>
                </div>

                <div class="summary-card green">
                    <span>TRANSACTIONS</span>
                    <strong>
                        ${Number(
                            member.transaction_count ||
                            transactions.length ||
                            0
                        )}
                    </strong>
                </div>

            </section>


            ${
                coverage && coverageWeeks.length
                    ? `
            <section class="coverage-section">

                <div class="section-heading coverage-heading">

                    <div>

                        <span>
                            CONTRIBUTION COVERAGE
                        </span>

                        <h3>
                            Weeks Catered For
                        </h3>

                    </div>

                    <strong>
                        ${coverageWeekCount}
                        WEEK${coverageWeekCount === 1 ? "" : "S"}
                    </strong>

                </div>

                <div class="coverage-summary">

                    <div class="coverage-total-card">

                        <span>
                            MONTHLY COVERAGE
                        </span>

                        <strong>
                            ${money(coverageAmount)}
                        </strong>

                        <small>
                            ${escapeHtml(
                                coverage.month || period
                            )}
                        </small>

                    </div>

                    <div class="coverage-note-card">

                        <span>
                            PAYMENT COVERAGE
                        </span>

                        <strong>
                            Already Paid
                        </strong>

                        <small>
                            These weeks may have been paid
                            for in an earlier month. They are
                            not counted again as new cash
                            received in this month.
                        </small>

                    </div>

                </div>

                <div class="coverage-list">

                    ${coverageWeeks.map(week => `

                        <div class="coverage-row">

                            <div class="coverage-week-number">

                                WEEK
                                ${escapeHtml(
                                    week["Coverage Week #"]
                                )}

                            </div>

                            <div class="coverage-dates">

                                <strong>
                                    ${escapeHtml(
                                        date(
                                            week[
                                                "Coverage Week Start"
                                            ]
                                        )
                                    )}
                                </strong>

                                <span>
                                    Ends
                                    ${escapeHtml(
                                        date(
                                            week[
                                                "Coverage Week End"
                                            ]
                                        )
                                    )}
                                </span>

                            </div>

                            <div class="coverage-source">

                                <span>
                                    Payment received
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        date(
                                            week[
                                                "Payment Date"
                                            ]
                                        )
                                    )}
                                </strong>

                            </div>

                            <div class="coverage-amount">

                                ${money(
                                    week[
                                        "Allocated Amount"
                                    ]
                                )}

                            </div>

                        </div>

                    `).join("")}

                </div>

            </section>
            `
                    : ""
            }


            <section class="transactions">

                <div class="section-heading">

                    <div>

                        <span>
                            YOUR FINANCIAL HISTORY
                        </span>

                        <h3>
                            Payment Transactions
                        </h3>

                    </div>

                    <strong>
                        ${
                            transactions.length
                        }
                        RECORD${
                            transactions.length === 1
                                ? ""
                                : "S"
                        }
                    </strong>

                </div>


                <div class="table-wrap">

                    <table>

                        <thead>

                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Payment Type</th>
                                <th>Description</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Receipt</th>
                            </tr>

                        </thead>

                        <tbody>
                            ${rows}
                        </tbody>

                    </table>

                </div>

            </section>


            <section class="authority">

                <div class="seals">

                    <div>

                        <img
                            src="/static/assets/tlc_official_stamp.jpeg"
                            alt="TLC Official Seal"
                        >

                        <span>
                            OFFICIAL TLC SEAL
                        </span>

                    </div>


                    <i></i>


                    <div>

                        <img
                            src="/static/assets/tlc_treasury_seal.jpeg"
                            alt="TLC Treasury Seal"
                        >

                        <span>
                            GROUP TREASURY SEAL
                        </span>

                    </div>

                </div>


                <div class="signature">

                    <span>
                        STATEMENT AUTHORITY
                    </span>

                    <strong>
                        Alvin Owuor
                    </strong>

                    <b>
                        Treasurer
                    </b>

                    <small>
                        The Legacy Circle (TLC)
                    </small>

                    <em>
                        Alvin Owuor
                    </em>

                    <div class="signature-line"></div>

                    <span>
                        Authorized Treasurer
                    </span>

                </div>

            </section>


            <footer class="sheet-footer">

                <span>
                    Electronically generated TLC member statement.
                </span>

                <strong>
                    Please retain for your records.
                </strong>

            </footer>

        </article>
    `;
}


async function loadStatement() {

    clearMessage();

    elements.viewStatement.disabled = true;

    elements.viewStatement.textContent =
        "Loading...";

    try {

        const params =
            new URLSearchParams();

        const year =
            elements.yearSelect.value;

        const month =
            elements.monthSelect.value;

        if (year) {
            params.set("year", year);
        }

        if (month) {
            params.set("month", month);
        }

        const query =
            params.toString();

        const url =
            query
                ? `/api/member/payment-statement?${query}`
                : "/api/member/payment-statement";


        const response =
            await fetch(
                url,
                {
                    credentials: "same-origin",
                    cache: "no-store",
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.statement
        ) {

            throw new Error(
                data.message ||
                "Unable to load your statement."
            );
        }


        state.statement =
            data.statement;


        const transactions =
            Array.isArray(
                data.statement.member?.transactions
            )
                ? data.statement.member.transactions
                : [];


        if (!state.years.length) {
            populateYears(transactions);
        }


        renderStatement(
            data.statement
        );


    } catch (error) {

        console.error(
            "TLC Payment Statement:",
            error
        );

        elements.statementArea.innerHTML = `

            <div class="error-card">

                <div class="error-icon">
                    !
                </div>

                <h2>
                    Statement Unavailable
                </h2>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "Unable to load your statement."
                    )}
                </p>

            </div>
        `;

        showMessage(
            error.message ||
            "Unable to load your statement.",
            "error"
        );

    } finally {

        elements.viewStatement.disabled = false;

        elements.viewStatement.textContent =
            "View Statement";
    }
}


elements.yearSelect.addEventListener(
    "change",
    updateMonthState
);


elements.viewStatement.addEventListener(
    "click",
    loadStatement
);


elements.refreshStatement.addEventListener(
    "click",
    loadStatement
);


elements.printStatement.addEventListener(
    "click",
    function () {

        if (!state.statement) {

            showMessage(
                "Load your statement before printing.",
                "error"
            );

            return;
        }

        window.print();
    }
);


populateMonths();

loadStatement();
