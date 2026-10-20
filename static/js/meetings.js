
let meetingsCache = [];


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function setText(id, value, fallback = "?") {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    const text =
        String(value ?? "").trim();

    element.textContent =
        text || fallback;
}


function renderMeetings(records) {

    meetingsCache =
        Array.isArray(records)
            ? records
            : [];

    const body =
        document.getElementById(
            "meetingsTableBody"
        );

    if (!body) {
        return;
    }

    body.innerHTML = "";

    const count =
        document.getElementById(
            "meetingRecordCount"
        );

    if (count) {
        count.textContent =
            `${records.length} record${
                records.length === 1
                    ? ""
                    : "s"
            }`;
    }

    const tableWrap =
        document.getElementById(
            "meetingsTableWrap"
        );

    const empty =
        document.getElementById(
            "meetingsEmpty"
        );

    if (records.length === 0) {

        if (tableWrap) {
            tableWrap.classList.add(
                "hidden"
            );
        }

        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;
    }

    if (empty) {
        empty.classList.add("hidden");
    }

    if (tableWrap) {
        tableWrap.classList.remove(
            "hidden"
        );
    }

    records.forEach(
        (item, index) => {

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        item["Meeting Date"] ||
                        "?"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item["Meeting Time"] ||
                        "?"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item["Meeting Type"] ||
                        "?"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item["Venue"] ||
                        "?"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item["Agenda"] ||
                        "?"
                    )}
                </td>

                <td>
                    <span class="meeting-status">
                        ${escapeHtml(
                            item["Status"] ||
                            "?"
                        )}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="meeting-details-button"
                        data-meeting-index="${index}"
                    >
                        View Details
                    </button>
                </td>
            `;

            body.appendChild(row);
        }
    );
}


function updateMeetingSummary(records) {

    const total =
        records.length;

    const scheduled =
        records.filter(
            item =>
                String(
                    item["Status"] || ""
                ).trim().toUpperCase()
                === "SCHEDULED"
        ).length;

    const completed =
        records.filter(
            item =>
                String(
                    item["Status"] || ""
                ).trim().toUpperCase()
                === "COMPLETED"
        ).length;

    setText(
        "totalMeetings",
        total,
        "0"
    );

    setText(
        "scheduledMeetings",
        scheduled,
        "0"
    );

    setText(
        "completedMeetings",
        completed,
        "0"
    );
}


function openMeetingDetails(index) {

    const numericIndex =
        Number(index);

    if (
        !Number.isInteger(
            numericIndex
        ) ||
        numericIndex < 0 ||
        numericIndex >= meetingsCache.length
    ) {
        return;
    }

    const meeting =
        meetingsCache[numericIndex];

    setText(
        "detailMeetingId",
        meeting["Meeting ID"]
    );

    setText(
        "detailMeetingStatus",
        meeting["Status"]
    );

    setText(
        "detailMeetingDate",
        meeting["Meeting Date"]
    );

    setText(
        "detailMeetingTime",
        meeting["Meeting Time"]
    );

    setText(
        "detailMeetingType",
        meeting["Meeting Type"]
    );

    setText(
        "detailMeetingVenue",
        meeting["Venue"]
    );

    setText(
        "detailChairperson",
        meeting["Chairperson"]
    );

    setText(
        "detailSecretary",
        meeting["Secretary"]
    );

    setText(
        "detailAgenda",
        meeting["Agenda"]
    );

    setText(
        "detailMinutes",
        meeting["Minutes"]
    );

    const modal =
        document.getElementById(
            "meetingDetails"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeMeetingDetails() {

    const modal =
        document.getElementById(
            "meetingDetails"
        );

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


async function loadMeetings() {

    const loading =
        document.getElementById(
            "loadingState"
        );

    const error =
        document.getElementById(
            "errorState"
        );

    const content =
        document.getElementById(
            "mainContent"
        );

    if (loading) {
        loading.classList.remove(
            "hidden"
        );
    }

    if (error) {
        error.classList.add("hidden");
    }

    if (content) {
        content.classList.add("hidden");
    }

    try {

        const response =
            await fetch(
                "/api/member/meetings",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
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
                "Unable to load meetings."
            );
        }

        const records =
            Array.isArray(
                data.meetings
            )
                ? data.meetings
                : [];

        renderMeetings(records);
        updateMeetingSummary(
            records
        );

        if (loading) {
            loading.classList.add(
                "hidden"
            );
        }

        if (content) {
            content.classList.remove(
                "hidden"
            );
        }

    } catch (errorMessage) {

        console.error(
            "Meetings loading error:",
            errorMessage
        );

        if (loading) {
            loading.classList.add(
                "hidden"
            );
        }

        if (error) {
            error.classList.remove(
                "hidden"
            );
        }
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const refresh =
            document.getElementById(
                "refreshMeetings"
            );

        if (refresh) {
            refresh.addEventListener(
                "click",
                loadMeetings
            );
        }

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".meeting-details-button"
                    );

                if (button) {
                    openMeetingDetails(
                        button.dataset
                            .meetingIndex
                    );
                    return;
                }

                if (
                    event.target.id ===
                    "closeMeetingDetails" ||
                    event.target.id ===
                    "closeMeetingBackdrop"
                ) {
                    closeMeetingDetails();
                }
            }
        );

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {
                    closeMeetingDetails();
                }
            }
        );

        loadMeetings();
    }
);
