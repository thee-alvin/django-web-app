"use strict";

const elements = {
    refreshButton:
        document.getElementById("refreshButton"),

    cycleTitle:
        document.getElementById("cycleTitle"),

    cycleMessage:
        document.getElementById("cycleMessage"),

    weeklyAmount:
        document.getElementById("weeklyAmount"),

    totalMembers:
        document.getElementById("totalMembers"),

    paidCount:
        document.getElementById("paidCount"),

    partialCount:
        document.getElementById("partialCount"),

    unpaidCount:
        document.getElementById("unpaidCount"),

    expectedAmount:
        document.getElementById("expectedAmount"),

    paidAmount:
        document.getElementById("paidAmount"),

    outstandingAmount:
        document.getElementById("outstandingAmount"),

    collectionRate:
        document.getElementById("collectionRate"),

    progressRate:
        document.getElementById("progressRate"),

    progressBar:
        document.getElementById("progressBar"),

    progressMessage:
        document.getElementById("progressMessage"),

    memberCount:
        document.getElementById("memberCount"),

    membersArea:
        document.getElementById("membersArea"),

    historyArea:
        document.getElementById("historyArea"),
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


function number(value) {
    return Number(
        value || 0
    ).toLocaleString("en-KE");
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

    return (
        `${parts[2]} ${
            months[Number(parts[1]) - 1] ||
            parts[1]
        } ${parts[0]}`
    );
}


function statusClass(status) {

    const normalized =
        String(status || "")
            .trim()
            .toUpperCase();

    if (normalized === "PAID") {
        return "paid";
    }

    if (normalized === "PAID LATE") {
        return "late";
    }

    if (normalized === "PARTIAL") {
        return "partial";
    }

    return "unpaid";
}


function renderMembers(members) {

    if (
        !members ||
        !members.length
    ) {

        elements.membersArea.innerHTML = `
            <div class="loading-state">
                No active TLC members were found.
            </div>
        `;

        return;
    }


    elements.membersArea.innerHTML = `
        <div class="member-grid">

            ${
                members.map(member => {

                    const week =
                        member.current_week || {};

                    const status =
                        week.status || "UNPAID";

                    return `
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

                                <span
                                    class="member-status ${statusClass(status)}"
                                >
                                    ${escapeHtml(status)}
                                </span>

                            </div>


                            <div class="member-details">

                                <div class="member-detail">

                                    <span>
                                        EXPECTED
                                    </span>

                                    <strong>
                                        ${money(
                                            week.expected_amount
                                        )}
                                    </strong>

                                </div>


                                <div class="member-detail">

                                    <span>
                                        PAID
                                    </span>

                                    <strong>
                                        ${money(
                                            week.paid_amount
                                        )}
                                    </strong>

                                </div>


                                <div class="member-detail">

                                    <span>
                                        BALANCE
                                    </span>

                                    <strong>
                                        ${money(
                                            week.balance
                                        )}
                                    </strong>

                                </div>


                                <div class="member-detail">

                                    <span>
                                        TRANSACTIONS
                                    </span>

                                    <strong>
                                        ${number(
                                            week.transaction_count
                                        )}
                                    </strong>

                                </div>


                                <div class="member-detail">

                                    <span>
                                        LAST PAYMENT
                                    </span>

                                    <strong>
                                        ${formatDate(
                                            member.latest_payment_date
                                        )}
                                    </strong>

                                </div>


                                <div class="member-detail">

                                    <span>
                                        WEEKS COVERED
                                    </span>

                                    <strong>
                                        ${number(
                                            member.covered_weeks
                                        )} ${
                                            Number(
                                                member.covered_weeks || 0
                                            ) === 1
                                                ? "week"
                                                : "weeks"
                                        }
                                    </strong>

                                </div>


                                <div class="member-detail">

                                    <span>
                                        FUTURE PREPAID
                                    </span>

                                    <strong>
                                        ${money(
                                            member.future_prepaid_amount
                                        )}
                                    </strong>

                                </div>


                                <div class="member-detail">

                                    <span>
                                        TOTAL WEEKLY PAID
                                    </span>

                                    <strong>
                                        ${money(
                                            member.total_weekly_paid
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </article>
                    `;
                }).join("")
            }

        </div>
    `;
}


function renderHistory(history) {

    if (
        !history ||
        !history.length
    ) {

        elements.historyArea.innerHTML = `
            <div class="loading-state">
                No weekly history available.
            </div>
        `;

        return;
    }


    elements.historyArea.innerHTML =
        history.map(cycle => {

            const rate =
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            cycle.collection_rate || 0
                        )
                    )
                );

            return `
                <article class="history-card-item">

                    <span class="history-date">
                        WEEK OF
                        ${formatDate(
                            cycle.cycle_start
                        )}
                    </span>

                    <strong class="history-amount">
                        ${money(
                            cycle.paid_amount
                        )}
                    </strong>

                    <span class="history-rate">
                        ${rate.toFixed(1)}% collected
                    </span>

                    <div class="history-bar">

                        <div
                            class="history-bar-fill"
                            style="width:${rate}%"
                        ></div>

                    </div>

                </article>
            `;
        }).join("");
}


async function loadMonitoring() {

    elements.refreshButton.disabled = true;

    elements.refreshButton.textContent =
        "↻ Loading...";

    elements.membersArea.innerHTML = `
        <div class="loading-state">
            Loading live contribution monitoring…
        </div>
    `;


    try {

        const response =
            await fetch(
                "/api/tlc/contribution-monitoring?weeks=8",
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
            !data.monitoring
        ) {
            throw new Error(
                data.message ||
                "Unable to load contribution monitoring."
            );
        }


        const monitoring =
            data.monitoring || {};

        const cycle =
            monitoring.current_cycle || {};

        const summary =
            monitoring.summary || {};


        elements.cycleTitle.textContent =
            `TLC WEEK ${cycle.week_number || "—"} — ${
                formatDate(
                    cycle.due_date
                )
            }`;


        elements.cycleMessage.textContent =
            `Next cycle begins ${
                formatDate(
                    cycle.next_due_date
                )
            }. Weekly target is ${
                money(
                    cycle.weekly_amount
                )
            } per member.`;


        elements.weeklyAmount.textContent =
            money(
                cycle.weekly_amount
            );


        elements.totalMembers.textContent =
            number(
                summary.total_members
            );


        elements.paidCount.textContent =
            number(
                summary.paid_count
            );


        elements.partialCount.textContent =
            number(
                summary.partial_count
            );


        elements.unpaidCount.textContent =
            number(
                summary.unpaid_count
            );


        elements.expectedAmount.textContent =
            money(
                summary.expected_amount
            );


        elements.paidAmount.textContent =
            money(
                summary.paid_amount
            );


        elements.outstandingAmount.textContent =
            money(
                summary.outstanding_amount
            );


        const rate =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        summary.collection_rate ||
                        0
                    )
                )
            );


        elements.collectionRate.textContent =
            `${rate.toFixed(1)}%`;


        elements.progressRate.textContent =
            `${rate.toFixed(1)}%`;


        elements.progressBar.style.width =
            `${rate}%`;


        elements.progressMessage.textContent =
            `${money(
                summary.paid_amount
            )} collected out of ${
                money(
                    summary.expected_amount
                )
            }, with ${
                money(
                    summary.outstanding_amount
                )
            } outstanding.`;


        const members =
            monitoring.members || [];


        elements.memberCount.textContent =
            `${number(
                members.length
            )} members`;


        renderMembers(members);


        renderHistory(
            monitoring.weekly_history || []
        );


    } catch (error) {

        console.error(
            "TLC Contribution Monitoring:",
            error
        );


        elements.membersArea.innerHTML = `
            <div class="loading-state">
                ${escapeHtml(
                    error.message ||
                    "Unable to load contribution monitoring."
                )}
            </div>
        `;

        elements.historyArea.innerHTML = `
            <div class="loading-state">
                Contribution history unavailable.
            </div>
        `;

    } finally {

        elements.refreshButton.disabled =
            false;

        elements.refreshButton.textContent =
            "↻ Refresh";
    }
}


elements.refreshButton.addEventListener(
    "click",
    loadMonitoring
);


loadMonitoring();


