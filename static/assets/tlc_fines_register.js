"use strict";

const elements = {
    yearSelect: document.getElementById("yearSelect"),
    monthSelect: document.getElementById("monthSelect"),
    applyButton: document.getElementById("applyButton"),
    refreshButton: document.getElementById("refreshButton"),

    periodLabel: document.getElementById("periodLabel"),

    membersWithFines:
        document.getElementById("membersWithFines"),

    fineTransactions:
        document.getElementById("fineTransactions"),

    totalFines:
        document.getElementById("totalFines"),

    recordCount:
        document.getElementById("recordCount"),

    membersArea:
        document.getElementById("membersArea"),

    transactionBody:
        document.getElementById("transactionBody"),
};


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function money(value) {

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


function formatDate(value) {

    if (!value) {
        return "—";
    }

    const parts =
        String(value).split("-");

    if (parts.length !== 3) {
        return value;
    }

    const months = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"
    ];

    const month =
        months[Number(parts[1]) - 1] ||
        parts[1];

    return (
        `${parts[2]} ${month} ${parts[0]}`
    );
}


function populateYears(currentYear) {

    const years = new Set();

    const numericYear =
        Number(currentYear);

    if (
        Number.isInteger(numericYear)
    ) {
        years.add(numericYear);
    }

    years.add(2026);

    const sortedYears =
        Array.from(years)
            .sort((a, b) => b - a);

    elements.yearSelect.innerHTML = `
        <option value="">
            All Years
        </option>
        ${
            sortedYears.map(year => `
                <option value="${year}">
                    ${year}
                </option>
            `).join("")
        }
    `;
}


function renderMemberCards(members) {

    if (!members || !members.length) {

        elements.membersArea.innerHTML = `
            <div class="loading-state">
                No fines were recorded for the selected period.
            </div>
        `;

        return;
    }


    elements.membersArea.innerHTML = `
        <div class="member-grid">

            ${
                members.map(member => `
                    <article class="member-card">

                        <div class="member-top">

                            <div>

                                <p class="member-name">
                                    ${escapeHtml(
                                        member.full_name
                                    )}
                                </p>

                                <span class="member-id">
                                    ${escapeHtml(
                                        member.member_id
                                    )}
                                </span>

                            </div>


                            <div class="member-total">

                                <span>
                                    TOTAL FINES
                                </span>

                                <strong>
                                    ${money(
                                        member.fine_total
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="member-meta">

                            <span>
                                Fine Records:
                                <strong>
                                    ${Number(
                                        member.fine_count || 0
                                    )}
                                </strong>
                            </span>

                        </div>

                    </article>
                `).join("")
            }

        </div>
    `;
}


function renderTransactions(transactions) {

    if (!transactions || !transactions.length) {

        elements.transactionBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-message"
                >
                    No fine transactions found
                    for this period.
                </td>
            </tr>
        `;

        return;
    }


    elements.transactionBody.innerHTML =
        transactions.map(transaction => `

            <tr>

                <td>
                    ${escapeHtml(
                        formatDate(
                            transaction.date
                        )
                    )}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(
                            transaction.full_name ||
                            "—"
                        )}
                    </strong>

                    <br>

                    <small>
                        ${escapeHtml(
                            transaction.member_id ||
                            "—"
                        )}
                    </small>
                </td>

                <td class="receipt-cell">
                    ${escapeHtml(
                        transaction.receipt_number ||
                        "—"
                    )}
                </td>

                <td>
                    ${
                        escapeHtml(
                            transaction.description ||
                            "Fine"
                        )
                    }
                </td>

                <td class="amount-cell">
                    ${money(
                        transaction.amount
                    )}
                </td>

            </tr>

        `).join("");
}


async function loadYears() {

    try {

        const response =
            await fetch(
                "/api/tlc/fines-register",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (
            response.ok &&
            data.success &&
            data.fines
        ) {

            const generatedAt =
                data.fines.generated_at || "";

            const year =
                generatedAt.substring(0, 4);

            populateYears(year);
        }

    } catch (error) {

        console.error(
            "TLC Fines years:",
            error
        );
    }
}


async function loadFines() {

    elements.refreshButton.disabled = true;
    elements.applyButton.disabled = true;

    elements.refreshButton.textContent =
        "↻ Loading...";

    elements.membersArea.innerHTML = `
        <div class="loading-state">
            Loading official fines register…
        </div>
    `;


    try {

        const params =
            new URLSearchParams();

        const year =
            elements.yearSelect.value;

        const month =
            elements.monthSelect.value;

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
            params.toString();


        const response =
            await fetch(
                `/api/tlc/fines-register${
                    query
                        ? "?" + query
                        : ""
                }`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store"
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
            !data.fines
        ) {
            throw new Error(
                data.message ||
                "Unable to load the fines register."
            );
        }


        const fines =
            data.fines;


        const summary =
            fines.summary || {};


        elements.membersWithFines.textContent =
            Number(
                summary.members_with_fines || 0
            ).toLocaleString("en-KE");


        elements.fineTransactions.textContent =
            Number(
                summary.fine_transactions || 0
            ).toLocaleString("en-KE");


        elements.totalFines.textContent =
            money(
                summary.total_fines
            );


        elements.periodLabel.textContent =
            fines.period?.label ||
            "All Recorded Fines";


        elements.recordCount.textContent =
            `${Number(
                summary.fine_transactions || 0
            ).toLocaleString("en-KE")} records`;


        renderMemberCards(
            fines.members || []
        );


        renderTransactions(
            fines.transactions || []
        );


        if (fines.period?.year) {

            const yearValue =
                String(
                    fines.period.year
                );

            const exists =
                Array.from(
                    elements.yearSelect.options
                ).some(
                    option =>
                        option.value === yearValue
                );

            if (!exists) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    yearValue;

                option.textContent =
                    yearValue;

                elements.yearSelect.appendChild(
                    option
                );
            }

            elements.yearSelect.value =
                yearValue;
        }


        if (fines.period?.month) {

            elements.monthSelect.value =
                String(
                    Number(
                        fines.period.month
                    )
                );
        }

    } catch (error) {

        console.error(
            "TLC Fines Register:",
            error
        );


        elements.membersArea.innerHTML = `
            <div class="loading-state">
                ${escapeHtml(
                    error.message ||
                    "Unable to load the fines register."
                )}
            </div>
        `;


        elements.transactionBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-message"
                >
                    ${escapeHtml(
                        error.message ||
                        "Unable to load the fines register."
                    )}
                </td>
            </tr>
        `;
    }


    finally {

        elements.refreshButton.disabled = false;
        elements.applyButton.disabled = false;

        elements.refreshButton.textContent =
            "↻ Refresh";
    }
}


elements.applyButton.addEventListener(
    "click",
    loadFines
);


elements.refreshButton.addEventListener(
    "click",
    loadFines
);


elements.yearSelect.addEventListener(
    "change",
    () => {

        if (!elements.yearSelect.value) {

            elements.monthSelect.value = "";
        }
    }
);


loadYears();
loadFines();
