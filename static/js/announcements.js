
let announcementsCache = [];


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


function renderAnnouncements(records) {

    announcementsCache =
        Array.isArray(records)
            ? records
            : [];

    const list =
        document.getElementById(
            "announcementsList"
        );

    const empty =
        document.getElementById(
            "announcementsEmpty"
        );

    const count =
        document.getElementById(
            "announcementRecordCount"
        );

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (count) {
        count.textContent =
            `${records.length} announcement${
                records.length === 1
                    ? ""
                    : "s"
            }`;
    }

    if (records.length === 0) {

        list.classList.add("hidden");

        if (empty) {
            empty.classList.remove("hidden");
        }

        return;
    }

    if (empty) {
        empty.classList.add("hidden");
    }

    list.classList.remove("hidden");

    records.forEach(item => {

        const card =
            document.createElement("article");

        card.className =
            "announcement-card";

        const type =
            item["Announcement Type"] || "GENERAL";

        const priority =
            item["Priority"] || "NORMAL";

        const title =
            item["Title"] || "Untitled Announcement";

        const message =
            item["Message"] || "No message provided.";

        const date =
            item["Announcement Date"] || "?";

        const postedBy =
            item["Posted By"] || "TLC";

        const expiry =
            item["Expiry Date"] || "";

        card.innerHTML = `
            <div class="announcement-top">

                <div>
                    <h3 class="announcement-title">
                        ${escapeHtml(title)}
                    </h3>
                </div>

                <div class="announcement-meta">

                    <span class="announcement-badge badge-type">
                        ${escapeHtml(type)}
                    </span>

                    <span class="announcement-badge badge-priority">
                        ${escapeHtml(priority)}
                    </span>

                </div>

            </div>

            <div class="announcement-message">
                ${escapeHtml(message)}
            </div>

            <div class="announcement-info">

                <span>
                    Published: ${escapeHtml(date)}
                </span>

                <span>
                    Posted by: ${escapeHtml(postedBy)}
                </span>

                ${
                    expiry
                        ? `<span>
                               Expires: ${escapeHtml(expiry)}
                           </span>`
                        : ""
                }

            </div>
        `;

        list.appendChild(card);
    });
}


function updateSummary(records) {

    setText(
        "totalAnnouncements",
        records.length,
        "0"
    );

    const newest =
        records.length > 0
            ? records[0]["Announcement Date"]
            : "None";

    setText(
        "newestAnnouncement",
        newest,
        "None"
    );

    const highPriority =
        records.filter(item => {

            const priority =
                String(
                    item["Priority"] || ""
                )
                .trim()
                .toUpperCase();

            return (
                priority === "HIGH" ||
                priority === "URGENT"
            );

        }).length;

    setText(
        "highPriorityAnnouncements",
        highPriority,
        "0"
    );
}


async function loadAnnouncements() {

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
        error.classList.add(
            "hidden"
        );
    }

    if (content) {
        content.classList.add(
            "hidden"
        );
    }

    try {

        const response =
            await fetch(
                "/api/member/announcements",
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
                "Unable to load announcements."
            );
        }

        const records =
            Array.isArray(
                data.announcements
            )
                ? data.announcements
                : [];

        renderAnnouncements(records);
        updateSummary(records);

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
            "Announcements loading error:",
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
                "refreshAnnouncements"
            );

        if (refresh) {
            refresh.addEventListener(
                "click",
                loadAnnouncements
            );
        }

        loadAnnouncements();
    }
);


/* ============================================================
   TLC OCTOBER 2026 CODED ANNOUNCEMENT POSTER
   Injected after Excel-backed announcements are rendered.
============================================================ */

function renderOctoberWelcomePoster() {

    const announcementsList =
        document.querySelector("#announcementsList");

    if (!announcementsList) {
        return;
    }

    const cards =
        announcementsList.querySelectorAll(".announcement-card");

    cards.forEach((card) => {

        const titleElement =
            card.querySelector(".announcement-title");

        if (!titleElement) {
            return;
        }

        const title =
            titleElement.textContent
                .trim()
                .replace(/\s+/g, " ")
                .toUpperCase();

        if (title !== "WELCOME TO OCTOBER 2026") {
            return;
        }

        if (card.querySelector(".tlc-october-poster")) {
            return;
        }

        const poster =
            document.createElement("div");

        poster.className =
            "tlc-october-poster";

        poster.innerHTML = `
            <div class="tlc-october-poster-glow"></div>

            <div class="tlc-october-poster-top">
                <span>THE LEGACY CIRCLE</span>
                <span>OFFICIAL ANNOUNCEMENT</span>
            </div>

            <div class="tlc-october-poster-main">

                <div class="tlc-october-number">
                    10
                </div>

                <div class="tlc-october-heading">
                    <div>WELCOME TO</div>
                    <strong>A NEW MONTH</strong>
                </div>

                <div class="tlc-october-month">
                    OCTOBER
                </div>

                <div class="tlc-october-year">
                    2026
                </div>

            </div>

            <div class="tlc-october-tagline">
                United in Purpose. Built to Last.
            </div>

            <div class="tlc-october-poster-footer">
                <span>THE LEGACY CIRCLE TREASURY</span>
                <span>OCTOBER 2026</span>
            </div>
        `;

        card.insertBefore(
            poster,
            card.firstChild
        );
    });
}

/* ============================================================
   OCTOBER POSTER AUTO-BOOT
   Ensures the poster appears after async announcement rendering.
============================================================ */

(function bootOctoberPoster() {

    function runPoster() {

        if (typeof renderOctoberWelcomePoster === "function") {
            renderOctoberWelcomePoster();
        }

    }

    function watchAnnouncements() {

        const list =
            document.querySelector("#announcementsList");

        if (!list) {
            return false;
        }

        runPoster();

        const observer =
            new MutationObserver(function () {
                runPoster();
            });

        observer.observe(list, {
            childList: true,
            subtree: true
        });

        return true;
    }

    function start() {

        if (watchAnnouncements()) {
            return;
        }

        const timer =
            setInterval(function () {

                if (watchAnnouncements()) {
                    clearInterval(timer);
                }

            }, 250);

        setTimeout(function () {
            clearInterval(timer);
        }, 15000);

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

})();
