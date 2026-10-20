
let electionData = {
    elections: [],
    positions: [],
    candidates: []
};


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


function formatRange(start, end) {

    if (!start && !end) {
        return "CLOSED";
    }

    if (start && end) {
        return `${start} ? ${end}`;
    }

    return start || end;
}


function renderElectionInfo(election) {

    if (!election) {
        return;
    }

    setText(
        "electionName",
        election["Election Name"],
        "General Election"
    );

    setText(
        "pageElectionTitle",
        election["Election Name"],
        "General Election"
    );

    setText(
        "electionDescription",
        election["Description"],
        "Official TLC General Election."
    );

    setText(
        "electionId",
        election["Election ID"]
    );

    setText(
        "electionType",
        election["Election Type"]
    );

    setText(
        "nominationPeriod",
        formatRange(
            election["Nomination Start"],
            election["Nomination End"]
        )
    );

    setText(
        "votingPeriod",
        formatRange(
            election["Voting Start"],
            election["Voting End"]
        )
    );

    setText(
        "eligibilityRule",
        election["Eligibility Rule"]
    );

    const status =
        election["Status"] || "NOT CONFIGURED";

    setText(
        "electionStatus",
        status
    );

    const votingState =
        String(status)
            .toUpperCase()
            === "VOTING OPEN"
            ? "OPEN"
            : "CLOSED";

    setText(
        "votingState",
        votingState
    );
}


function renderPositions(positions) {

    const container =
        document.getElementById(
            "positionsGrid"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    setText(
        "positionCount",
        positions.length,
        "0"
    );

    setText(
        "positionRecordCount",
        `${positions.length} position${
            positions.length === 1 ? "" : "s"
        }`
    );

    positions.forEach((position, index) => {

        const card =
            document.createElement("article");

        card.className =
            "position-card";

        card.innerHTML = `
            <div class="position-number">
                POSITION ${index + 1}
            </div>

            <div class="position-code">
                ${escapeHtml(
                    position["Position ID"] ||
                    "NO CODE"
                )}
            </div>

            <h3>
                ${escapeHtml(
                    position["Position Name"] ||
                    "Unnamed Position"
                )}
            </h3>

            <p>
                ${
                    position["Status"] ||
                    "ACTIVE"
                }
            </p>
        `;

        container.appendChild(card);
    });
}


function renderCandidates(candidates) {

    const container =
        document.getElementById(
            "candidatesGrid"
        );

    const empty =
        document.getElementById(
            "candidatesEmpty"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    setText(
        "candidateCount",
        candidates.length,
        "0"
    );

    setText(
        "candidateRecordCount",
        `${candidates.length} candidate${
            candidates.length === 1 ? "" : "s"
        }`
    );

    if (candidates.length === 0) {

        container.classList.add("hidden");

        if (empty) {
            empty.classList.remove("hidden");
        }

        return;
    }

    if (empty) {
        empty.classList.add("hidden");
    }

    container.classList.remove("hidden");

    candidates.forEach(candidate => {

        const card =
            document.createElement("article");

        card.className =
            "candidate-card";

        card.innerHTML = `
            <div class="candidate-position">
                ${escapeHtml(
                    candidate["Position"] ||
                    "Position"
                )}
            </div>

            <h3>
                ${escapeHtml(
                    candidate["Full Name"] ||
                    "Candidate"
                )}
            </h3>

            <p>
                Member ID:
                ${escapeHtml(
                    candidate["Member ID"] ||
                    "?"
                )}
            </p>

            <p>
                ${escapeHtml(
                    candidate["Manifesto"] ||
                    "No manifesto recorded."
                )}
            </p>

            <span class="candidate-status">
                ${escapeHtml(
                    candidate["Candidate Status"] ||
                    "PENDING"
                )}
            </span>
        `;

        container.appendChild(card);
    });
}


async function loadElections() {

    const loading =
        document.getElementById("loadingState");

    const error =
        document.getElementById("errorState");

    const content =
        document.getElementById("mainContent");

    if (loading) {
        loading.classList.remove("hidden");
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
                "/api/member/elections",
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
                "Unable to load elections."
            );
        }

        electionData = {
            elections:
                Array.isArray(data.elections)
                    ? data.elections
                    : [],

            positions:
                Array.isArray(data.positions)
                    ? data.positions
                    : [],

            candidates:
                Array.isArray(data.candidates)
                    ? data.candidates
                    : []
        };

        const election =
            electionData.elections[0] || null;

        renderElectionInfo(election);
        renderPositions(
            electionData.positions
        );

        const approvedCandidates =
            electionData.candidates.filter(
                item =>
                    String(
                        item["Candidate Status"] || ""
                    )
                    .trim()
                    .toUpperCase()
                    === "APPROVED"
            );

        renderCandidates(
            approvedCandidates
        );

        renderBallot();
        renderApplicationPositions();

        if (loading) {
            loading.classList.add("hidden");
        }

        if (content) {
            content.classList.remove("hidden");
        }

    } catch (errorMessage) {

        console.error(
            "Elections loading error:",
            errorMessage
        );

        if (loading) {
            loading.classList.add("hidden");
        }

        if (error) {
            error.textContent =
                errorMessage.message ||
                "Unable to load election information.";

            error.classList.remove("hidden");
        }
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const refresh =
            document.getElementById(
                "refreshElections"
            );

        if (refresh) {
            refresh.addEventListener(
                "click",
                loadElections
            );
        }

        const ballot =
            document.getElementById(
                "electionBallot"
            );

        if (ballot) {
            ballot.addEventListener(
                "submit",
                submitElectionBallot
            );
        }

        loadElections();
    }
);


function showBallotMessage(type, message) {

    const element =
        document.getElementById(
            "ballotMessage"
        );

    if (!element) {
        return;
    }

    element.className =
        "ballot-message " + type;

    element.textContent =
        message;
}


function renderBallot() {

    const section =
        document.getElementById(
            "votingSection"
        );

    const closedNotice =
        document.getElementById(
            "votingClosedNotice"
        );

    const container =
        document.getElementById(
            "ballotPositions"
        );

    const election =
        electionData.elections[0];

    const status =
        String(
            election?.["Status"] || ""
        )
        .trim()
        .toUpperCase();

    const canVote =
        status === "VOTING OPEN";

    if (!section || !closedNotice || !container) {
        return;
    }

    if (!canVote) {

        section.classList.add("hidden");
        closedNotice.classList.remove("hidden");

        setText(
            "votingWindowStatus",
            "Voting closed"
        );

        return;
    }

    section.classList.remove("hidden");
    closedNotice.classList.add("hidden");

    setText(
        "votingWindowStatus",
        "Voting open"
    );

    container.innerHTML = "";

    const activePositions =
        electionData.positions.filter(
            position =>
                String(
                    position["Status"] || "ACTIVE"
                )
                .trim()
                .toUpperCase()
                === "ACTIVE"
        );

    activePositions.forEach(position => {

        const positionId =
            String(
                position["Position ID"] || ""
            ).trim();

        const positionName =
            position["Position Name"] ||
            "Unnamed Position";

        const candidates =
            electionData.candidates.filter(
                candidate =>
                    String(
                        candidate["Position ID"] || ""
                    ).trim()
                    === positionId &&
                    String(
                        candidate["Candidate Status"] || ""
                    )
                    .trim()
                    .toUpperCase()
                    === "APPROVED"
            );

        const card =
            document.createElement("div");

        card.className =
            "ballot-position";

        let options = "";

        candidates.forEach(
            (candidate, candidateIndex) => {

                const candidateId =
                    String(
                        candidate["Candidate ID"] || ""
                    ).trim();

                options += `
                    <label class="candidate-option">

                        <input
                            type="radio"
                            name="position_${escapeHtml(positionId)}"
                            value="${escapeHtml(candidateId)}"
                            required
                        >

                        <span class="candidate-option-content">

                            <strong>
                                ${escapeHtml(
                                    candidate["Full Name"] ||
                                    "Candidate"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    candidate["Manifesto"] ||
                                    "No manifesto recorded."
                                )}
                            </span>

                        </span>

                    </label>
                `;
            }
        );

        if (!options) {
            options = `
                <p>
                    No approved candidates are available
                    for this position.
                </p>
            `;
        }

        card.innerHTML = `
            <div class="ballot-position-header">

                <div class="ballot-position-code">
                    ${escapeHtml(positionId)}
                </div>

                <h3 class="ballot-position-title">
                    ${escapeHtml(positionName)}
                </h3>

            </div>

            ${options}
        `;

        container.appendChild(card);
    });
}


async function submitElectionBallot(event) {

    event.preventDefault();

    const election =
        electionData.elections[0];

    const status =
        String(
            election?.["Status"] || ""
        )
        .trim()
        .toUpperCase();

    if (status !== "VOTING OPEN") {
        showBallotMessage(
            "error",
            "Voting is not currently open."
        );
        return;
    }

    const selections = {};

    const activePositions =
        electionData.positions.filter(
            position =>
                String(
                    position["Status"] || "ACTIVE"
                )
                .trim()
                .toUpperCase()
                === "ACTIVE"
        );

    for (const position of activePositions) {

        const positionId =
            String(
                position["Position ID"] || ""
            ).trim();

        const selected =
            document.querySelector(
                `input[name="position_${CSS.escape(positionId)}"]:checked`
            );

        if (!selected) {
            showBallotMessage(
                "error",
                `Please select a candidate for ${position["Position Name"]}.`
            );
            return;
        }

        selections[positionId] =
            selected.value;
    }

    const button =
        document.getElementById(
            "castVoteButton"
        );

    if (button) {
        button.disabled = true;
        button.textContent = "Submitting...";
    }

    showBallotMessage(
        "success",
        "Submitting your ballot..."
    );

    try {

        const response =
            await fetch(
                "/api/member/elections/vote",
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },
                    body: JSON.stringify({
                        selections
                    })
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
                "Unable to submit ballot."
            );
        }

        showBallotMessage(
            "success",
            data.message ||
            "Your ballot has been recorded successfully."
        );

        const form =
            document.getElementById(
                "electionBallot"
            );

        if (form) {
            form.reset();
        }

        if (button) {
            button.textContent =
                "Vote Submitted";
            button.disabled = true;
        }

    } catch (error) {

        console.error(
            "Election ballot error:",
            error
        );

        showBallotMessage(
            "error",
            error.message ||
            "Unable to submit ballot."
        );

        if (button) {
            button.disabled = false;
            button.textContent = "Cast Vote";
        }
    }
}

async function checkElectionStatus() {

    try {

        const response =
            await fetch(
                "/api/member/elections/status",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            return;
        }

        const election =
            electionData.elections[0];

        if (election) {
            election["Status"] =
                data.status;

            election["Results Status"] =
                data.results_status;

            renderElectionInfo(election);
            renderBallot();
        renderApplicationPositions();
        }

        if (data.closed_automatically) {

            await loadElections();

            if (typeof loadElectionResults === "function") {
                await loadElectionResults();
            }

            showBallotMessage(
                "success",
                "Voting has ended. Final election results have been calculated."
            );
        }

    } catch (error) {

        console.error(
            "Election status check error:",
            error
        );
    }
}


setInterval(
    checkElectionStatus,
    5000
);
async function loadMemberApplicationProfile() {

    try {

        const response = await fetch(
            "/api/member/profile",
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to load member profile."
            );
        }

        const member = data.member || {};

        const memberId =
            member["Member ID"] ||
            member["Membership ID"] ||
            member["member_id"] ||
            "";

        const fullName =
            member["Full Name"] ||
            member["Name"] ||
            member["full_name"] ||
            "";

        const memberIdInput =
            document.getElementById(
                "applicationMemberId"
            );

        const fullNameInput =
            document.getElementById(
                "applicationFullName"
            );

        if (memberIdInput) {
            memberIdInput.value =
                String(memberId).trim();
        }

        if (
            fullNameInput &&
            !fullNameInput.value.trim()
        ) {
            fullNameInput.value =
                String(fullName).trim();
        }

    } catch (error) {

        console.error(
            "Member application profile error:",
            error
        );

        const memberIdInput =
            document.getElementById(
                "applicationMemberId"
            );

        if (memberIdInput) {
            memberIdInput.value = "";
            memberIdInput.placeholder =
                "Unable to load membership ID";
        }
    }
}


function parseElectionDate(value) {

    if (!value) {
        return null;
    }

    const text = String(value).trim();

    const match = text.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
    );

    if (!match) {
        const parsed = new Date(text);
        return Number.isNaN(parsed.getTime())
            ? null
            : parsed;
    }

    return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6])
    );
}


function parseElectionDate(value) {

    if (!value) {
        return null;
    }

    const text = String(value).trim();

    if (!text) {
        return null;
    }

    const match = text.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
    );

    if (match) {
        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            Number(match[4]),
            Number(match[5]),
            Number(match[6])
        );
    }

    const parsed = new Date(text);

    return Number.isNaN(parsed.getTime())
        ? null
        : parsed;
}


function renderApplicationPositions() {

    const section =
        document.getElementById(
            "candidateApplicationSection"
        );

    const select =
        document.getElementById(
            "applicationPosition"
        );

    const status =
        document.getElementById(
            "applicationWindowStatus"
        );

    if (!section) {
        return;
    }

    const election =
        electionData.elections[0];

    if (!election) {
        section.classList.add("hidden");
        return;
    }

    const start =
        parseElectionDate(
            election["Nomination Start"]
        );

    const end =
        parseElectionDate(
            election["Nomination End"]
        );

    const now = new Date();

    /*
       No nomination dates = CLOSED.
       Both dates must exist for applications
       to be considered open.
    */
    const applicationOpen =
        Boolean(start && end) &&
        now >= start &&
        now < end;

    if (!applicationOpen) {

        section.classList.add("hidden");

        if (status) {
            status.textContent =
                "Applications closed";
        }

        return;
    }

    section.classList.remove("hidden");

    if (status) {
        status.textContent =
            "Applications open";
    }

    if (select) {
        select.innerHTML = `
            <option value="">
                Select a position
            </option>

            <option value="TLC-POS-001">
                CHAIRPERSON
            </option>

            <option value="TLC-POS-002">
                VICE CHAIRPERSON
            </option>

            <option value="TLC-POS-003">
                SECRETARY
            </option>

            <option value="TLC-POS-004">
                TREASURER
            </option>
        `;
    }
}

async function submitCandidateApplication(event) {

    event.preventDefault();

    const form =
        document.getElementById(
            "candidateApplicationForm"
        );

    const button =
        document.getElementById(
            "submitApplicationButton"
        );

    const memberId =
        document.getElementById(
            "applicationMemberId"
        )?.value.trim();

    const fullName =
        document.getElementById(
            "applicationFullName"
        )?.value.trim();

    const positionId =
        document.getElementById(
            "applicationPosition"
        )?.value.trim();

    const manifesto =
        document.getElementById(
            "applicationManifesto"
        )?.value.trim();

    if (!memberId) {
        showApplicationMessage(
            "error",
            "Membership ID could not be loaded."
        );
        return;
    }

    if (!fullName || !positionId || !manifesto) {
        showApplicationMessage(
            "error",
            "Please complete all application fields."
        );
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Submitting...";
    }

    try {

        const response =
            await fetch(
                "/api/member/elections/candidate-application",
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        member_id: memberId,
                        full_name: fullName,
                        position_id: positionId,
                        manifesto: manifesto
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to submit application."
            );
        }

        showApplicationMessage(
            "success",
            data.message ||
            "Candidate application submitted successfully."
        );

        if (form) {
            form.reset();
        }

        await loadMemberApplicationProfile();
    loadMyCandidateApplications();
        renderApplicationPositions();
        await loadElections();

    } catch (error) {

        console.error(
            "Candidate application error:",
            error
        );

        showApplicationMessage(
            "error",
            error.message ||
            "Unable to submit application."
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "Submit Application";
        }
    }
}


function initializeCandidateApplication() {

    const form =
        document.getElementById(
            "candidateApplicationForm"
        );

    if (form) {
        form.addEventListener(
            "submit",
            submitCandidateApplication
        );
    }

    renderApplicationPositions();
    loadMemberApplicationProfile();
    loadMyCandidateApplications();
}


document.addEventListener(
    "DOMContentLoaded",
    initializeCandidateApplication
);
async function loadMyCandidateApplications() {

    const loading =
        document.getElementById(
            "applicationStatusLoading"
        );

    const error =
        document.getElementById(
            "applicationStatusError"
        );

    const empty =
        document.getElementById(
            "applicationStatusEmpty"
        );

    const container =
        document.getElementById(
            "applicationStatusGrid"
        );

    if (!container) {
        return;
    }

    if (loading) {
        loading.classList.remove("hidden");
    }

    if (error) {
        error.classList.add("hidden");
    }

    if (empty) {
        empty.classList.add("hidden");
    }

    try {

        const response =
            await fetch(
                "/api/member/elections/my-applications",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to load applications."
            );
        }

        const applications =
            Array.isArray(data.applications)
                ? data.applications
                : [];

        container.innerHTML = "";

        setText(
            "applicationRecordCount",
            `${applications.length} application${applications.length === 1 ? "" : "s"}`
        );

        if (applications.length === 0) {

            if (empty) {
                empty.classList.remove("hidden");
            }

            return;
        }

        applications.forEach(application => {

            const status =
                String(
                    application["Candidate Status"] || "PENDING"
                )
                .trim()
                .toUpperCase();

            const card =
                document.createElement("article");

            card.className =
                "application-status-card";

            let statusClass = "pending";

            if (status === "APPROVED") {
                statusClass = "approved";
            } else if (status === "REJECTED") {
                statusClass = "rejected";
            }

            card.innerHTML = `
                <div class="application-status-top">

                    <div>
                        <div class="result-position-code">
                            ${escapeHtml(
                                application["Candidate ID"] || ""
                            )}
                        </div>

                        <h3>
                            ${escapeHtml(
                                application["Position"] ||
                                application["Position ID"] ||
                                "Election Position"
                            )}
                        </h3>
                    </div>

                    <span class="application-status-badge ${statusClass}">
                        ${escapeHtml(status)}
                    </span>

                </div>

                <div class="application-status-details">

                    <div>
                        <span>Membership ID</span>
                        <strong>
                            ${escapeHtml(
                                application["Member ID"] ||
                                application["Membership ID"] ||
                                "Not available"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Submitted</span>
                        <strong>
                            ${escapeHtml(
                                application["Nomination Date"] ||
                                ""
                            )}
                        </strong>
                    </div>

                </div>

                <div class="application-status-manifesto">
                    <span>Manifesto</span>
                    <p>
                        ${escapeHtml(
                            application["Manifesto"] ||
                            "No manifesto recorded."
                        )}
                    </p>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (errorMessage) {

        console.error(
            "Candidate application status error:",
            errorMessage
        );

        if (error) {
            error.textContent =
                errorMessage.message ||
                "Unable to check application status.";

            error.classList.remove("hidden");
        }

    } finally {

        if (loading) {
            loading.classList.add("hidden");
        }
    }
}


setInterval(
    () => {
        renderApplicationPositions();
    },
    1000
);
