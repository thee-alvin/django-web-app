"use strict";

const elements = {
    statusCard: document.getElementById("statusCard"),
    statusIcon: document.querySelector(".status-icon"),
    statusTitle: document.getElementById("statusTitle"),
    statusMessage: document.getElementById("statusMessage"),

    totalRecords: document.getElementById("totalRecords"),
    totalContributions: document.getElementById("totalContributions"),
    fines: document.getElementById("fines"),
    totalFunds: document.getElementById("totalFunds"),

    controlAmount: document.getElementById("controlAmount"),
    controlCategory: document.getElementById("controlCategory"),
    controlReceipts: document.getElementById("controlReceipts"),
    controlIds: document.getElementById("controlIds"),
    controlMembers: document.getElementById("controlMembers"),

    issuesArea: document.getElementById("issuesArea"),
    refreshButton: document.getElementById("refreshButton"),
};


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


function setControl(element, passed) {

    element.classList.toggle(
        "failed",
        !passed
    );

    const icon =
        element.querySelector(".control-icon");

    const status =
        element.querySelector("b");

    icon.textContent =
        passed ? "✓" : "!";

    status.textContent =
        passed ? "PASSED" : "REVIEW";
}


function renderIssues(issues) {

    if (!issues || !issues.length) {

        elements.issuesArea.innerHTML = `
            <div class="empty-state">
                ✓ No reconciliation exceptions found.
                The official TLC financial register is internally consistent.
            </div>
        `;

        return;
    }


    elements.issuesArea.innerHTML =
        issues.map(issue => `
            <div class="issue-row">
                <span class="issue-dot"></span>

                <div>
                    <strong>
                        Review Required
                    </strong>

                    <span>
                        ${escapeHtml(issue)}
                    </span>
                </div>
            </div>
        `).join("");
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function renderReconciliation(result) {

    const status =
        result.status || "REVIEW REQUIRED";

    const matched =
        status === "MATCHED";

    elements.statusCard.classList.remove(
        "loading",
        "matched",
        "review"
    );

    elements.statusCard.classList.add(
        matched ? "matched" : "review"
    );

    elements.statusIcon.textContent =
        matched ? "✓" : "!";

    elements.statusTitle.textContent =
        matched
            ? "Financial Records Matched"
            : "Review Required";

    elements.statusMessage.textContent =
        matched
            ? "The contribution register reconciles with the official TLC ledger rules."
            : "One or more financial control checks require review.";

    const register =
        result.register || {};

    elements.totalRecords.textContent =
        Number(
            register.total_records || 0
        ).toLocaleString("en-KE");

    elements.totalContributions.textContent =
        money(
            register.total_contributions
        );

    elements.fines.textContent =
        money(
            register.fines
        );

    elements.totalFunds.textContent =
        money(
            register.total_funds
        );


    const integrity =
        result.integrity || {};

    setControl(
        elements.controlAmount,
        Boolean(
            integrity.total_amount_match
        )
    );

    setControl(
        elements.controlCategory,
        Boolean(
            integrity.category_amount_match
        )
    );

    setControl(
        elements.controlReceipts,
        Boolean(
            integrity.receipts_complete &&
            integrity.receipts_unique
        )
    );

    setControl(
        elements.controlIds,
        Boolean(
            integrity.contribution_ids_complete
        )
    );

    setControl(
        elements.controlMembers,
        Boolean(
            integrity.members_valid
        )
    );


    renderIssues(
        result.issues || []
    );
}


async function loadReconciliation() {

    elements.refreshButton.disabled = true;
    elements.refreshButton.textContent =
        "↻ Checking...";

    try {

        const response =
            await fetch(
                "/api/tlc/financial-reconciliation",
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
            !data.reconciliation
        ) {
            throw new Error(
                data.message ||
                "Unable to complete reconciliation."
            );
        }

        renderReconciliation(
            data.reconciliation
        );

    } catch (error) {

        elements.statusCard.classList.remove(
            "loading",
            "matched"
        );

        elements.statusCard.classList.add(
            "review"
        );

        elements.statusIcon.textContent =
            "!";

        elements.statusTitle.textContent =
            "Reconciliation Unavailable";

        elements.statusMessage.textContent =
            error.message ||
            "Unable to load the reconciliation check.";

        elements.issuesArea.innerHTML = `
            <div class="issue-row">
                <span class="issue-dot"></span>

                <div>
                    <strong>
                        System Check Failed
                    </strong>

                    <span>
                        ${escapeHtml(
                            error.message ||
                            "Unable to load reconciliation."
                        )}
                    </span>
                </div>
            </div>
        `;

    } finally {

        elements.refreshButton.disabled = false;
        elements.refreshButton.textContent =
            "↻ Refresh Check";
    }
}


elements.refreshButton.addEventListener(
    "click",
    loadReconciliation
);


loadReconciliation();
