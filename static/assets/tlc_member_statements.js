"use strict";

const state = {
    register: null,
    statement: null,
};


const elements = {
    memberSelect:
        document.getElementById("memberSelect"),

    yearSelect:
        document.getElementById("yearSelect"),

    monthSelect:
        document.getElementById("monthSelect"),

    loadButton:
        document.getElementById("loadButton"),

    printButton:
        document.getElementById("printButton"),

    statementArea:
        document.getElementById("statementArea"),
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


function populateMembers(report) {

    const members =
        Array.isArray(report.members)
            ? report.members
            : [];

    elements.memberSelect.innerHTML =
        `<option value="">Select a member</option>`;

    members.forEach(member => {

        const option =
            document.createElement("option");

        option.value =
            member.member_id;

        option.textContent =
            `${member.member_id} — ${member.full_name}`;

        elements.memberSelect.appendChild(
            option
        );
    });
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
                /^\d{4}-\d{2}-\d{2}$/.test(
                    date
                )
            ) {
                years.add(
                    date.slice(0, 4)
                );
            }
        }
    }

    const currentYear =
        String(
            new Date().getFullYear()
        );

    years.add(currentYear);

    const sortedYears =
        Array.from(years).sort(
            (a, b) =>
                Number(b) - Number(a)
        );

    elements.yearSelect.innerHTML =
        `<option value="">All years</option>`;

    sortedYears.forEach(year => {

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
        `<option value="">All months</option>`;

    months.forEach(
        (month, index) => {

            const option =
                document.createElement("option");

            option.value =
                String(index + 1).padStart(
                    2,
                    "0"
                );

            option.textContent =
                month;

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


function showMessage(
    title,
    message
) {

    elements.statementArea.innerHTML = `
        <section class="welcome-panel">

            <div class="welcome-icon">
                TLC
            </div>

            <h2>
                ${escapeHtml(title)}
            </h2>

            <p>
                ${escapeHtml(message)}
            </p>

        </section>
    `;
}



function renderStatement(statement) {

    const coverage = statement.coverage || {};

    const coverageWeeks = Array.isArray(coverage.weeks)
        ? coverage.weeks
        : [];

    const coverageAdminBlock = coverageWeeks.length
        ? `
        <section class="coverage-admin-block">

            <div class="coverage-admin-heading">

                <div>
                    <span class="coverage-admin-kicker">
                        CONTRIBUTION COVERAGE
                    </span>

                    <h3>Weeks Catered For</h3>
                </div>

                <strong>
                    ${coverage.week_count || coverageWeeks.length} WEEKS
                </strong>

            </div>

            <div class="coverage-admin-summary">

                <span>MONTHLY COVERAGE</span>

                <strong>
                    KSh ${Number(
                        coverage.amount || 0
                    ).toLocaleString("en-KE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </strong>

                <small>
                    ${coverage.month || ""}
                </small>

            </div>

            <div class="coverage-admin-note">
                Already Paid — these weeks were funded by earlier
                payment(s). They are not counted again as new cash
                received in the selected month.
            </div>

            <div class="coverage-admin-list">

                ${coverageWeeks.map((week) => `

                    <article class="coverage-admin-row">

                        <div class="coverage-admin-week">

                            <span>
                                WEEK ${week["Coverage Week #"] ?? ""}
                            </span>

                            <strong>
                                ${week["Coverage Week Start"] || ""}
                            </strong>

                            <small>
                                Ends ${week["Coverage Week End"] || ""}
                            </small>

                        </div>

                        <div class="coverage-admin-source">

                            <span>
                                Payment received
                            </span>

                            <strong>
                                ${week["Payment Date"] || ""}
                            </strong>

                            <small>
                                ${week["Receipt Number"]
                                    || week["Contribution ID"]
                                    || ""}
                            </small>

                        </div>

                        <div class="coverage-admin-amount">

                            KSh ${Number(
                                week["Allocated Amount"] || 0
                            ).toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}

                        </div>

                    </article>

                `).join("")}

            </div>

        </section>
        `
        : "";



    const member =
        statement.member;

    const transactions =
        Array.isArray(
            member.transactions
        )
            ? member.transactions
            : [];

    const period =
        statement.period?.label ||
        "All Recorded Transactions";


    let transactionRows = "";

    if (!transactions.length) {

        transactionRows = `
            <tr>
                <td
                    colspan="5"
                    class="statement-empty"
                >
                    No transactions recorded
                    for this member in the
                    selected period.
                </td>
            </tr>
        `;

    } else {

        transactionRows =
            transactions.map(
                transaction => `
                    <tr>

                        <td>
                            ${escapeHtml(
                                formatDate(
                                    transaction.date
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                formatTime(
                                    transaction.time
                                )
                            )}
                        </td>

                        <td class="type">
                            ${escapeHtml(
                                transaction.payment_type ||
                                "—"
                            )}
                        </td>

                        <td class="amount">
                            ${formatMoney(
                                transaction.amount
                            )}
                        </td>

                        <td class="receipt">
                            ${escapeHtml(
                                transaction.receipt_number ||
                                "—"
                            )}
                        </td>

                    </tr>
                `
            ).join("");
    }


    elements.statementArea.innerHTML = `

        <section class="statement-sheet">

            <div class="statement-title">

                <div class="kicker">
                    OFFICIAL TLC MEMBER STATEMENT
                </div>

                <h2>
                    Contribution Statement
                </h2>

                <p>
                    Official financial activity recorded
                    in the TLC contribution register.
                </p>

            </div>


            <div class="member-identity">

                <div>

                    <div class="identity-name">
                        ${escapeHtml(
                            member.full_name
                        )}
                    </div>

                    <div class="identity-id">
                        ${escapeHtml(
                            member.member_id
                        )}
                    </div>

                </div>


                <div class="identity-period">
                    ${escapeHtml(period)}
                </div>

            </div>


            <div class="statement-summary">

                <div class="statement-summary-item">
                    <span>
                        Registration Fees
                    </span>

                    <strong>
                        ${formatMoney(
                            member.registration_fees
                        )}
                    </strong>
                </div>


                <div class="statement-summary-item">
                    <span>
                        Weekly Contributions
                    </span>

                    <strong>
                        ${formatMoney(
                            member.weekly_contributions
                        )}
                    </strong>
                </div>


                <div class="statement-summary-item">
                    <span>
                        Total Contributions
                    </span>

                    <strong>
                        ${formatMoney(
                            member.total_contributions
                        )}
                    </strong>
                </div>


                <div class="statement-summary-item">
                    <span>
                        Fines
                    </span>

                    <strong>
                        ${formatMoney(
                            member.fines
                        )}
                    </strong>
                </div>


                <div class="statement-summary-item">
                    <span>
                        Transactions
                    </span>

                    <strong>
                        ${Number(
                            member.transaction_count || 0
                        )}
                    </strong>
                </div>

            </div>


            ${coverageAdminBlock}

<div class="statement-table-wrap">

                <table class="statement-table">

                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Payment Type</th>
                            <th>Amount</th>
                            <th>Receipt Reference</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${transactionRows}
                    </tbody>

                </table>

            </div>


            <section class="statement-authority">

                <div class="statement-seals">

                    <div class="statement-seal">

                        <img
                            src="/static/assets/tlc_official_stamp.jpeg"
                            alt="The Legacy Circle Official Seal"
                        >

                        <span>
                            OFFICIAL TLC SEAL
                        </span>

                    </div>


                    <div class="statement-seal">

                        <img
                            src="/static/assets/tlc_treasury_seal.jpeg"
                            alt="The Legacy Circle Treasury Seal"
                        >

                        <span>
                            GROUP TREASURY SEAL
                        </span>

                    </div>

                </div>


                <div class="statement-signature">

                    <span class="authority-label">
                        OFFICIAL RECEIPT AUTHORITY
                    </span>

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

                    <div class="line"></div>

                    <span class="caption">
                        Authorized Treasurer
                    </span>

                </div>

            </section>

        </section>
    `;
}


async function loadRegisterSource() {

    try {

        const response =
            await fetch(
                "/api/tlc/financial-register",
                {
                    credentials: "same-origin",
                    cache: "no-store",
                }
            );

        if (!response.ok) {
            throw new Error(
                "Unable to load TLC members."
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
                "Unable to load TLC members."
            );
        }

        state.register =
            data.report;

        populateMembers(
            data.report
        );

        populateYears(
            data.report
        );

        populateMonths();

        updateMonthState();

    } catch (error) {

        console.error(
            "TLC member statements:",
            error
        );

        showMessage(
            "Unable to load members",
            error.message
        );
    }
}


async function loadStatement() {

    const memberId =
        elements.memberSelect.value;

    const year =
        elements.yearSelect.value;

    const month =
        elements.monthSelect.value;


    if (!memberId) {

        showMessage(
            "Select a Member",
            "Choose a TLC member before viewing a statement."
        );

        return;
    }


    elements.loadButton.disabled = true;

    elements.loadButton.textContent =
        "Loading...";


    try {

        const params =
            new URLSearchParams();

        params.set(
            "member_id",
            memberId
        );

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


        const response =
            await fetch(
                `/api/tlc/member-statement?${params.toString()}`,
                {
                    credentials: "same-origin",
                    cache: "no-store",
                }
            );


        if (response.status === 403) {

            throw new Error(
                "Access denied."
            );
        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.statement
        ) {

            throw new Error(
                data.message ||
                "Unable to load the member statement."
            );
        }


        state.statement =
            data.statement;

        renderStatement(
            data.statement
        );

    } catch (error) {

        console.error(
            "TLC member statement:",
            error
        );

        showMessage(
            "Statement unavailable",
            error.message
        );

    } finally {

        elements.loadButton.disabled =
            false;

        elements.loadButton.textContent =
            "View Statement";
    }
}


elements.yearSelect.addEventListener(
    "change",
    updateMonthState
);


elements.loadButton.addEventListener(
    "click",
    loadStatement
);


elements.printButton.addEventListener(
    "click",
    () => {

        if (!state.statement) {

            showMessage(
                "No Statement Loaded",
                "View a member statement before printing."
            );

            return;
        }

        window.print();
    }
);


loadRegisterSource();
