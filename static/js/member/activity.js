function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatActivityDate(timestamp) {

    if (!timestamp) {
        return "Date unavailable";
    }

    const date =
        new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return String(timestamp);
    }

    return date.toLocaleString(
        "en-KE",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


function getActivityIcon(category) {

    const icons = {
        authentication: "🔐",
        contribution: "💰",
        receipt: "🧾",
        welfare: "♥",
        meeting: "◷",
        announcement: "📢",
        election: "✓",
        document: "▤",
        notification: "🔔",
        profile: "👤",
        system: "●"
    };

    return icons[
        String(category || "")
            .toLowerCase()
    ] || "●";
}


function updateSummary(activities) {

    const total =
        document.getElementById(
            "activityTotal"
        );

    const latest =
        document.getElementById(
            "activityLatest"
        );


    if (total) {
        total.textContent =
            activities.length.toLocaleString(
                "en-KE"
            );
    }


    if (latest) {

        if (!activities.length) {

            latest.textContent = "—";

            return;
        }

        const latestDate =
            new Date(
                activities[0].timestamp
            );

        latest.textContent =
            Number.isNaN(
                latestDate.getTime()
            )
                ? "Recent"
                : latestDate.toLocaleDateString(
                    "en-KE",
                    {
                        day: "numeric",
                        month: "short"
                    }
                );
    }
}


function renderActivities(activities) {

    const list =
        document.getElementById(
            "activityList"
        );

    if (!list) {
        return;
    }


    updateSummary(
        activities
    );


    if (
        !Array.isArray(activities) ||
        activities.length === 0
    ) {

        list.innerHTML = `
            <div class="activity-empty">

                <div class="activity-empty-icon">
                    ◷
                </div>

                <strong>
                    No recent activity
                </strong>

                <p>
                    Your TLC account activity will appear
                    here as you use the portal.
                </p>

            </div>
        `;

        return;
    }


    list.innerHTML =
        activities
            .map(
                (activity) => {

                    const category =
                        String(
                            activity.category ||
                            "system"
                        ).toLowerCase();


                    return `
                        <article
                            class="activity-item"
                        >

                            <div class="activity-icon">
                                ${getActivityIcon(category)}
                            </div>


                            <div class="activity-content">

                                <div class="activity-title">
                                    ${escapeHtml(
                                        activity.action ||
                                        "Account Activity"
                                    )}
                                </div>


                                <div class="activity-description">
                                    ${escapeHtml(
                                        activity.description ||
                                        "TLC account activity."
                                    )}
                                </div>


                                <div class="activity-meta">

                                    <span class="activity-time">
                                        ${escapeHtml(
                                            formatActivityDate(
                                                activity.timestamp
                                            )
                                        )}
                                    </span>

                                    <span class="activity-category">
                                        ${escapeHtml(
                                            category
                                        )}
                                    </span>

                                </div>

                            </div>

                        </article>
                    `;
                }
            )
            .join("");
}


async function loadActivities() {

    const list =
        document.getElementById(
            "activityList"
        );

    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="activity-loading">

            <div class="loading-spinner"></div>

            <span>
                Loading your activity...
            </span>

        </div>
    `;


    try {

        const response =
            await fetch(
                "/api/member/activity",
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Activity service unavailable."
            );
        }


        renderActivities(
            Array.isArray(data.activities)
                ? data.activities
                : []
        );

    } catch (error) {

        console.error(
            "Recent activity error:",
            error
        );


        const total =
            document.getElementById(
                "activityTotal"
            );

        if (total) {
            total.textContent = "—";
        }


        const latest =
            document.getElementById(
                "activityLatest"
            );

        if (latest) {
            latest.textContent = "—";
        }


        list.innerHTML = `
            <div class="activity-error">

                <div class="activity-error-icon">
                    !
                </div>

                <strong>
                    Activity service unavailable
                </strong>

                <p>
                    We could not retrieve your latest
                    TLC account activity. Please try
                    refreshing the page.
                </p>

            </div>
        `;
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadActivities();


        const refreshButton =
            document.getElementById(
                "refreshActivity"
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                loadActivities
            );

        }

    }
);
