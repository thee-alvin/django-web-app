function formatCurrency(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "KES 0.00";
    }

    return "KES " + amount.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function setText(id, value, fallback = "—") {

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


function renderRequests(records) {

    welfareRequestsCache = Array.isArray(records)
        ? records
        : [];

    const body =
        document.getElementById("requestsTableBody");

    if (!body) {
        return;
    }

    body.innerHTML = "";

    const count =
        document.getElementById("requestRecordCount");

    if (count) {
        count.textContent =
            `${records.length} record${records.length === 1 ? "" : "s"}`;
    }

    const tableWrap =
        document.getElementById("requestsTableWrap");

    const emptyState =
        document.getElementById("requestsEmpty");

    if (records.length === 0) {

        if (tableWrap) {
            tableWrap.classList.add("hidden");
        }

        if (emptyState) {
            emptyState.classList.remove("hidden");
        }

        return;
    }

    if (emptyState) {
        emptyState.classList.add("hidden");
    }

    if (tableWrap) {
        tableWrap.classList.remove("hidden");
    }

    records.forEach((item, index) => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHtml(item["Request Date"] || "?")}
            </td>

            <td>
                ${escapeHtml(item["Welfare Category"] || "?")}
            </td>

            <td>
                ${escapeHtml(item["Description"] || "?")}
            </td>

            <td class="amount">
                ${formatCurrency(item["Amount Requested"])}
            </td>

            <td>
                <span class="welfare-status">
                    ${escapeHtml(item["Status"] || "?")}
                </span>
            </td>

            <td>
                ${escapeHtml(item["Decision Date"] || "?")}
            </td>

            <td>
                <button
                    type="button"
                    class="request-details-button"
                    data-request-index="${index}"
                >
                    View Details
                </button>
            </td>
        `;

        body.appendChild(row);
    });
}


function renderSupport(records) {

    const body =
        document.getElementById(
            "supportTableBody"
        );

    body.innerHTML = "";

    document.getElementById(
        "supportRecordCount"
    ).textContent =
        `${records.length} record${
            records.length === 1 ? "" : "s"
        }`;


    if (records.length === 0) {

        document.getElementById(
            "supportTableWrap"
        ).classList.add("hidden");

        document.getElementById(
            "supportEmpty"
        ).classList.remove("hidden");

        return;
    }


    document.getElementById(
        "supportEmpty"
    ).classList.add("hidden");

    document.getElementById(
        "supportTableWrap"
    ).classList.remove("hidden");


    records.forEach(item => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHtml(
                    item["Support Date"] || "—"
                )}
            </td>

            <td>
                ${escapeHtml(
                    item["Support Type"] || "—"
                )}
            </td>

            <td class="reference">
                ${escapeHtml(
                    item["Request ID"] || "—"
                )}
            </td>

            <td class="amount">
                ${formatCurrency(
                    item["Amount / Value"]
                )}
            </td>

            <td>
                <span class="welfare-status">
                    ${escapeHtml(
                        item["Status"] || "—"
                    )}
                </span>
            </td>

            <td class="reference">
                ${escapeHtml(
                    item["Disbursement Reference"] || "—"
                )}
            </td>
        `;

        body.appendChild(row);
    });
}


function renderWelfareContributions(records) {

    const body =
        document.getElementById(
            "welfareContributionsTableBody"
        );

    body.innerHTML = "";

    document.getElementById(
        "welfareContributionRecordCount"
    ).textContent =
        `${records.length} record${
            records.length === 1 ? "" : "s"
        }`;


    if (records.length === 0) {

        document.getElementById(
            "welfareContributionsTableWrap"
        ).classList.add("hidden");

        document.getElementById(
            "welfareContributionsEmpty"
        ).classList.remove("hidden");

        return;
    }


    document.getElementById(
        "welfareContributionsEmpty"
    ).classList.add("hidden");

    document.getElementById(
        "welfareContributionsTableWrap"
    ).classList.remove("hidden");


    records.forEach(item => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHtml(
                    item["Payment Date"] || "—"
                )}
            </td>

            <td class="amount">
                ${formatCurrency(
                    item["Amount"]
                )}
            </td>

            <td>
                ${escapeHtml(
                    item["Payment Method"] || "—"
                )}
            </td>

            <td class="reference">
                ${escapeHtml(
                    item["Transaction Reference"] || "—"
                )}
            </td>

            <td>
                <span class="welfare-status">
                    ${escapeHtml(
                        item["Status"] || "—"
                    )}
                </span>
            </td>
        `;

        body.appendChild(row);
    });
}


function renderCases(records) {

    const body =
        document.getElementById(
            "casesTableBody"
        );

    body.innerHTML = "";


    if (records.length === 0) {

        document.getElementById(
            "casesTableWrap"
        ).classList.add("hidden");

        document.getElementById(
            "casesEmpty"
        ).classList.remove("hidden");

        return;
    }


    document.getElementById(
        "casesEmpty"
    ).classList.add("hidden");

    document.getElementById(
        "casesTableWrap"
    ).classList.remove("hidden");


    records.forEach(item => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHtml(
                    item["Case Type"] || "—"
                )}
            </td>

            <td>
                ${escapeHtml(
                    item["Case Date"] || "—"
                )}
            </td>

            <td>
                <span class="welfare-status">
                    ${escapeHtml(
                        item["Status"] || "—"
                    )}
                </span>
            </td>

            <td>
                ${escapeHtml(
                    item["Assigned Officer"] || "—"
                )}
            </td>

            <td>
                ${escapeHtml(
                    item["Closed Date"] || "—"
                )}
            </td>
        `;

        body.appendChild(row);
    });
}


function populateWelfare(data) {

    setText(
        "memberId",
        "Member ID: " +
        (data.member_id || "—")
    );


    const summary =
        data.summary || {};

    setText(
        "requestCount",
        summary.request_count || 0
    );

    setText(
        "contributionCount",
        summary.contribution_count || 0
    );

    setText(
        "supportCount",
        summary.support_count || 0
    );

    setText(
        "caseCount",
        summary.case_count || 0
    );


    const welfare =
        data.welfare || {};


    renderRequests(
        Array.isArray(welfare.requests)
            ? welfare.requests
            : []
    );


    renderSupport(
        Array.isArray(welfare.support)
            ? welfare.support
            : []
    );


    renderWelfareContributions(
        Array.isArray(welfare.contributions)
            ? welfare.contributions
            : []
    );


    renderCases(
        Array.isArray(welfare.cases)
            ? welfare.cases
            : []
    );


    setText(
        "lastUpdated",
        new Date().toLocaleTimeString(
            "en-KE",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        )
    );
}


async function loadWelfare() {

    document
        .getElementById("loadingState")
        .classList.remove("hidden");

    document
        .getElementById("errorState")
        .classList.add("hidden");

    document
        .getElementById("mainContent")
        .classList.add("hidden");


    try {

        const response =
            await fetch(
                "/api/member/welfare",
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
            throw new Error(
                data.message ||
                "Unable to load welfare information."
            );
        }


        populateWelfare(data);


        document
            .getElementById("loadingState")
            .classList.add("hidden");

        document
            .getElementById("mainContent")
            .classList.remove("hidden");


    } catch (error) {

        console.error(
            "Welfare loading error:",
            error
        );

        document
            .getElementById("loadingState")
            .classList.add("hidden");

        document
            .getElementById("errorState")
            .classList.remove("hidden");
    }
}


function showRequestForm() {
    const formWrap =
        document.getElementById("welfareRequestFormWrap");

    const message =
        document.getElementById("welfareRequestMessage");

    if (formWrap) {
        formWrap.classList.remove("hidden");
    }

    if (message) {
        message.className =
            "request-form-message hidden";
        message.textContent = "";
    }

    const category =
        document.getElementById("welfareCategory");

    if (category) {
        category.focus();
    }
}


function hideRequestForm() {
    const formWrap =
        document.getElementById("welfareRequestFormWrap");

    const form =
        document.getElementById("welfareRequestForm");

    const message =
        document.getElementById("welfareRequestMessage");

    if (formWrap) {
        formWrap.classList.add("hidden");
    }

    if (form) {
        form.reset();
    }

    if (message) {
        message.className =
            "request-form-message hidden";
        message.textContent = "";
    }
}


function showRequestMessage(type, messageText) {
    const message =
        document.getElementById("welfareRequestMessage");

    if (!message) {
        return;
    }

    message.className =
        "request-form-message " + type;

    message.textContent =
        messageText;
}


async function submitWelfareRequest(event) {
    event.preventDefault();

    const categoryElement =
        document.getElementById("welfareCategory");

    const descriptionElement =
        document.getElementById("welfareDescription");

    const amountElement =
        document.getElementById("amountRequested");

    const submitButton =
        document.getElementById("submitWelfareRequest");

    if (
        !categoryElement ||
        !descriptionElement ||
        !amountElement ||
        !submitButton
    ) {
        return;
    }

    const welfareCategory =
        categoryElement.value.trim();

    const description =
        descriptionElement.value.trim();

    const amountRequested =
        Number(amountElement.value);

    if (!welfareCategory) {
        showRequestMessage(
            "error",
            "Please select a welfare category."
        );
        categoryElement.focus();
        return;
    }

    if (!description) {
        showRequestMessage(
            "error",
            "Please enter a description."
        );
        descriptionElement.focus();
        return;
    }

    if (!Number.isFinite(amountRequested) || amountRequested <= 0) {
        showRequestMessage(
            "error",
            "Please enter a valid amount greater than zero."
        );
        amountElement.focus();
        return;
    }

    if (amountRequested > 100000000) {
        showRequestMessage(
            "error",
            "The requested amount is too large."
        );
        amountElement.focus();
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    showRequestMessage(
        "success",
        "Submitting your welfare request..."
    );

    try {
        const response =
            await fetch(
                "/api/member/welfare/request",
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        welfare_category:
                            welfareCategory,

                        description:
                            description,

                        amount_requested:
                            amountRequested
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to submit welfare request."
            );
        }

        const requestId =
            data.request?.request_id ||
            "your request";

        showRequestMessage(
            "success",
            "Welfare request " +
            requestId +
            " submitted successfully and is now PENDING review."
        );

        const form =
            document.getElementById(
                "welfareRequestForm"
            );

        if (form) {
            form.reset();
        }

        await loadWelfare();

        setTimeout(
            hideRequestForm,
            1800
        );

    } catch (error) {
        console.error(
            "Welfare request submission error:",
            error
        );

        showRequestMessage(
            "error",
            error.message ||
            "Unable to submit welfare request."
        );

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Request";
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const refreshButton =
            document.getElementById(
                "refreshWelfare"
            );

        if (refreshButton) {
            refreshButton.addEventListener(
                "click",
                loadWelfare
            );
        }

        const openButton =
            document.getElementById(
                "openWelfareRequestForm"
            );

        if (openButton) {
            openButton.addEventListener(
                "click",
                showRequestForm
            );
        }

        const cancelButton =
            document.getElementById(
                "cancelWelfareRequest"
            );

        if (cancelButton) {
            cancelButton.addEventListener(
                "click",
                hideRequestForm
            );
        }

        const requestForm =
            document.getElementById(
                "welfareRequestForm"
            );

        if (requestForm) {
            requestForm.addEventListener(
                "submit",
                submitWelfareRequest
            );
        }

        loadWelfare();
    }
);


/* =========================
   WELFARE REQUEST DETAILS
========================= */

function setRequestDetail(id, value, fallback = "?") {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    const text = String(value ?? "").trim();
    element.textContent = text || fallback;
}


function openWelfareRequestDetails(index) {
    const numericIndex = Number(index);

    if (
        !Number.isInteger(numericIndex) ||
        numericIndex < 0 ||
        numericIndex >= welfareRequestsCache.length
    ) {
        return;
    }

    const item = welfareRequestsCache[numericIndex];

    setRequestDetail(
        "detailRequestId",
        item["Request ID"]
    );

    setRequestDetail(
        "detailRequestDate",
        item["Request Date"]
    );

    setRequestDetail(
        "detailCategory",
        item["Welfare Category"]
    );

    setRequestDetail(
        "detailAmount",
        formatCurrency(item["Amount Requested"])
    );

    setRequestDetail(
        "detailStatus",
        item["Status"]
    );

    setRequestDetail(
        "detailDecisionDate",
        item["Decision Date"]
    );

    setRequestDetail(
        "detailDescription",
        item["Description"]
    );

    setRequestDetail(
        "detailOfficerRemarks",
        item["Officer Remarks"]
    );

    setRequestDetail(
        "detailReviewedBy",
        item["Reviewed By"]
    );

    const modal = document.getElementById(
        "welfareRequestDetails"
    );

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}


function closeWelfareRequestDetails() {
    const modal = document.getElementById(
        "welfareRequestDetails"
    );

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}


document.addEventListener("click", event => {

    const detailsButton =
        event.target.closest(".request-details-button");

    if (detailsButton) {
        openWelfareRequestDetails(
            detailsButton.dataset.requestIndex
        );
        return;
    }

    if (
        event.target.id === "closeWelfareDetails" ||
        event.target.id === "closeWelfareDetailsBackdrop"
    ) {
        closeWelfareRequestDetails();
    }
});


document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeWelfareRequestDetails();
    }
});
