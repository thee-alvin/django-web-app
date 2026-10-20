async function loadHealth() {

    const overallContainer =
        document.getElementById("overallContainer");

    const checksContainer =
        document.getElementById("checksContainer");

    overallContainer.innerHTML =
        `<div class="loading">Checking TLC system health...</div>`;

    checksContainer.innerHTML =
        `<div class="loading">Loading system checks...</div>`;

    try {

        const response =
            await fetch("/api/tlc/health", {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        renderOverall(data);
        renderChecks(data.checks || []);

    } catch (error) {

        overallContainer.innerHTML = `
            <div class="error-box">
                Unable to load TLC system health.
                <br>
                ${escapeHtml(error.message)}
            </div>
        `;

        checksContainer.innerHTML = "";
    }
}


function renderOverall(data) {

    const container =
        document.getElementById("overallContainer");

    const summary = data.summary || {};

    let statusClass = "status-healthy";

    if (data.overall === "WARNING") {
        statusClass = "status-warning";
    }

    if (data.overall === "ERROR") {
        statusClass = "status-error";
    }

    const checkedAt =
        data.checked_at
            ? new Date(data.checked_at).toLocaleString()
            : "Unknown";

    container.innerHTML = `
        <div class="overall-top">

            <div>
                <div class="overall-label">
                    OVERALL SYSTEM STATUS
                </div>

                <div class="overall-status ${statusClass}">
                    ${escapeHtml(data.overall || "UNKNOWN")}
                </div>
            </div>

            <div class="last-check">
                Last checked<br>
                ${escapeHtml(checkedAt)}
            </div>

        </div>

        <div class="metrics">

            <div class="metric">
                <div class="metric-label">TOTAL CHECKS</div>
                <div class="metric-value">
                    ${summary.total ?? 0}
                </div>
            </div>

            <div class="metric">
                <div class="metric-label">HEALTHY</div>
                <div class="metric-value">
                    ${summary.healthy ?? 0}
                </div>
            </div>

            <div class="metric">
                <div class="metric-label">WARNINGS</div>
                <div class="metric-value">
                    ${summary.warnings ?? 0}
                </div>
            </div>

            <div class="metric">
                <div class="metric-label">ERRORS</div>
                <div class="metric-value">
                    ${summary.errors ?? 0}
                </div>
            </div>

        </div>
    `;
}


function renderChecks(checks) {

    const container =
        document.getElementById("checksContainer");

    if (!checks.length) {

        container.innerHTML =
            `<div class="empty">
                No system checks available.
             </div>`;

        return;
    }

    container.innerHTML =
        checks.map(check => {

            let statusClass =
                "status-healthy";

            if (check.status === "WARNING") {
                statusClass = "status-warning";
            }

            if (check.status === "ERROR") {
                statusClass = "status-error";
            }

            let details = "";

            if (check.details) {

                details = `
                    <div class="check-details">
                        ${escapeHtml(
                            JSON.stringify(
                                check.details,
                                null,
                                2
                            )
                        )}
                    </div>
                `;
            }

            return `
                <div class="check-card">

                    <div class="check-top">

                        <div class="check-name">
                            ${escapeHtml(check.name)}
                        </div>

                        <div class="status-badge ${statusClass}">
                            ${escapeHtml(check.status)}
                        </div>

                    </div>

                    <div class="check-message">
                        ${escapeHtml(check.message)}
                    </div>

                    ${details}

                </div>
            `;

        }).join("");
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


document.addEventListener(
    "DOMContentLoaded",
    loadHealth
);
