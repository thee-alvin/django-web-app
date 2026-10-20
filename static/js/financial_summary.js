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


function setText(id, value, fallback = "—") {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    const text =
        String(value ?? "").trim();

    element.textContent =
        text || fallback;
}


function formatDate(value) {
    if (!value) {
        return "—";
    }

    return String(value);
}


function populateSummary(data) {

    const summary =
        data.summary || {};

    setText(
        "memberId",
        "Member ID: " +
        (data.member_id || "—")
    );

    document.getElementById(
        "totalAmount"
    ).textContent =
        formatCurrency(summary.total);


    document.getElementById(
        "thisMonth"
    ).textContent =
        formatCurrency(summary.this_month);


    document.getElementById(
        "thisYear"
    ).textContent =
        formatCurrency(summary.this_year);


    document.getElementById(
        "paymentCount"
    ).textContent =
        String(summary.payment_count || 0);


    document.getElementById(
        "averageAmount"
    ).textContent =
        formatCurrency(summary.average);


    const first =
        summary.first_contribution;


    const latest =
        summary.latest_contribution;


    if (first) {

        document.getElementById(
            "firstAmount"
        ).textContent =
            formatCurrency(first.amount);

        document.getElementById(
            "firstDate"
        ).textContent =
            formatDate(first.payment_date);

    } else {

        setText(
            "firstAmount",
            "KES 0.00"
        );

        setText(
            "firstDate",
            "—"
        );
    }


    if (latest) {

        document.getElementById(
            "latestAmount"
        ).textContent =
            formatCurrency(latest.amount);

        document.getElementById(
            "latestDate"
        ).textContent =
            formatDate(latest.payment_date);

        setText(
            "recordId",
            latest.contribution_id
        );

        setText(
            "recordType",
            latest.payment_type,
            "Contribution"
        );

        setText(
            "recordDescription",
            latest.description
        );

        setText(
            "recordMethod",
            latest.payment_method
        );

        setText(
            "recordReference",
            latest.transaction_reference
        );

        setText(
            "recordStatus",
            latest.status
        );

        document.getElementById(
            "recordAmount"
        ).textContent =
            formatCurrency(latest.amount);

        document.getElementById(
            "latestRecord"
        ).classList.remove("hidden");

        document.getElementById(
            "noRecord"
        ).classList.add("hidden");

    } else {

        document.getElementById(
            "latestRecord"
        ).classList.add("hidden");

        document.getElementById(
            "noRecord"
        ).classList.remove("hidden");
    }


    const updated =
        document.getElementById(
            "lastUpdated"
        );

    if (updated) {

        updated.textContent =
            "Last updated: " +
            new Date().toLocaleTimeString(
                "en-KE",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );
    }
}


async function loadFinancialSummary() {

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
                "/api/member/financial-summary",
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
                "Financial summary unavailable."
            );
        }


        populateSummary(data);


        document
            .getElementById("loadingState")
            .classList.add("hidden");

        document
            .getElementById("mainContent")
            .classList.remove("hidden");

    } catch (error) {

        console.error(
            "Financial summary error:",
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


document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "refreshSummary"
            )
            .addEventListener(
                "click",
                loadFinancialSummary
            );


        loadFinancialSummary();
    }
);
