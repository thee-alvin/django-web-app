"use strict";

const elements = {
    refreshButton:
        document.getElementById("refreshButton"),

    totalRecords:
        document.getElementById("totalRecords"),

    displayedRecords:
        document.getElementById("displayedRecords"),

    auditUpdated:
        document.getElementById("auditUpdated"),

    auditArea:
        document.getElementById("auditArea"),
};


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatTimestamp(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (Number.isNaN(
        date.getTime()
    )) {
        return escapeHtml(value);
    }

    return date.toLocaleString(
        "en-KE",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    );
}


function renderDetails(details) {

    if (
        !details ||
        typeof details !== "object"
    ) {
        return "";
    }

    const entries =
        Object.entries(details);

    if (!entries.length) {
        return "";
    }

    return `
        <div class="audit-details">
            ${
                entries.map(
                    ([key, value]) => `
                        <span class="detail-chip">
                            ${escapeHtml(key)}:
                            ${escapeHtml(
                                typeof value === "object"
                                    ? JSON.stringify(value)
                                    : value
                            )}
                        </span>
                    `
                ).join("")
            }
        </div>
    `;
}


function renderAudit(records) {

    if (
        !records ||
        !records.length
    ) {

        elements.auditArea.innerHTML = `
            <div class="loading-state">
                No financial audit events have been recorded.
            </div>
        `;

        return;
    }


    elements.auditArea.innerHTML =
        records.map(record => `

            <article class="audit-row">

                <span class="audit-dot"></span>


                <div class="audit-main">

                    <strong>
                        ${escapeHtml(
                            record.action ||
                            "Financial Activity"
                        )}

                        <span class="audit-category">
                            ${escapeHtml(
                                record.category ||
                                "financial"
                            )}
                        </span>
                    </strong>


                    <p>
                        ${escapeHtml(
                            record.description ||
                            "Financial activity recorded."
                        )}
                    </p>


                    <div class="audit-member">
                        Member:
                        ${escapeHtml(
                            record.member_id ||
                            "—"
                        )}
                    </div>


                    ${
                        renderDetails(
                            record.details
                        )
                    }

                </div>


                <time class="audit-time">
                    ${formatTimestamp(
                        record.timestamp
                    )}
                </time>

            </article>

        `).join("");
}


async function loadAuditTrail() {

    // TRUE RESET
    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

    elements.totalRecords.textContent = "0";
    elements.displayedRecords.textContent = "0";
    elements.auditUpdated.textContent =
        "Starting from zero…";

    elements.auditArea.innerHTML = `
        <div class="loading-state">
            Starting financial audit trail from zero…
        </div>
    `;

    elements.refreshButton.disabled = true;
    elements.refreshButton.textContent =
        "↻ Resetting...";

    try {

        const response =
            await fetch(
                "/api/tlc/financial-audit-trail?limit=200",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (response.status === 403) {
            throw new Error(
                "Access denied."
            );
        }

        if (
            !response.ok ||
            !data.success ||
            !data.audit
        ) {
            throw new Error(
                data.message ||
                "Unable to load financial audit trail."
            );
        }

        const audit =
            data.audit;

        const records =
            audit.records || [];

        // Rebuild from the first record.
        elements.totalRecords.textContent =
            Number(
                audit.total_records || 0
            ).toLocaleString("en-KE");

        elements.displayedRecords.textContent =
            Number(
                records.length
            ).toLocaleString("en-KE");

        elements.auditUpdated.textContent =
            `Updated ${formatTimestamp(
                audit.generated_at
            )}`;

        renderAudit(records);

    } catch (error) {

        console.error(
            "TLC Financial Audit Trail:",
            error
        );

        elements.totalRecords.textContent = "0";
        elements.displayedRecords.textContent = "0";

        elements.auditArea.innerHTML = `
            <div class="loading-state">
                ${escapeHtml(
                    error.message ||
                    "Unable to load financial audit trail."
                )}
            </div>
        `;

    } finally {

        elements.refreshButton.disabled = false;
        elements.refreshButton.textContent =
            "↻ Refresh";
    }
}

elements.refreshButton.addEventListener(
    "click",
    async function () {

        elements.refreshButton.disabled = true;
        elements.refreshButton.textContent =
            "↻ Clearing...";

        elements.totalRecords.textContent = "0";
        elements.displayedRecords.textContent = "0";
        elements.auditUpdated.textContent =
            "History cleared";

        elements.auditArea.innerHTML = `
            <div class="loading-state">
                Financial audit history cleared.
                No previous financial history is displayed.
            </div>
        `;

        try {

            const response =
                await fetch(
                    "/api/tlc/financial-audit-trail/reset",
                    {
                        method: "POST",
                        credentials: "same-origin",
                        cache: "no-store"
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
                    "Unable to clear audit history."
                );
            }

        } catch (error) {

            console.error(
                "TLC Financial Audit Reset:",
                error
            );

            elements.auditArea.innerHTML = `
                <div class="loading-state">
                    ${escapeHtml(
                        error.message ||
                        "Unable to clear audit history."
                    )}
                </div>
            `;
        }

        elements.refreshButton.disabled = false;
        elements.refreshButton.textContent =
            "↻ Refresh";
    }
);


loadAuditTrail();
