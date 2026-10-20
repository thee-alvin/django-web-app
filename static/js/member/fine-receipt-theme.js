/* ============================================================
   TLC FINE RECEIPT VISUAL CLASSIFIER
   Visual-only module.
   Does NOT modify receipt data, APIs, numbering, QR or PDF logic.
   ============================================================ */

(function () {

    "use strict";

    function applyFineReceiptTheme() {

        const paymentTypeElement =
            document.getElementById("paymentType");

        const descriptionElement =
            document.getElementById("description");

        const receiptCard =
            document.getElementById("receiptCard");

        if (!receiptCard) {
            return;
        }

        const paymentType =
            paymentTypeElement
                ? String(paymentTypeElement.textContent || "").trim()
                : "";

        const description =
            descriptionElement
                ? String(descriptionElement.textContent || "").trim()
                : "";

        const combined =
            `${paymentType} ${description}`.toLowerCase();

        const isFine =
            /\bfine\b|\bpenalty\b|\blate fine\b/.test(combined);

        document.body.classList.toggle(
            "fine-receipt-mode",
            isFine
        );

        receiptCard.classList.toggle(
            "fine-receipt-card",
            isFine
        );

        if (isFine) {

            const brandEyebrow =
                document.querySelector(".brand-eyebrow");

            const receiptTitle =
                document.querySelector(".receipt-brand h1");

            const amountKicker =
                document.querySelector(".amount-kicker");

            const qrLabel =
                document.querySelector(".qr-label");

            if (brandEyebrow) {
                brandEyebrow.textContent =
                    "THE LEGACY CIRCLE • FINANCIAL CONTROL";
            }

            if (receiptTitle) {
                receiptTitle.textContent =
                    "OFFICIAL FINE RECEIPT";
            }

            if (amountKicker) {
                amountKicker.textContent =
                    "FINE AMOUNT RECEIVED";
            }

            if (qrLabel) {
                qrLabel.textContent =
                    "FINE RECEIPT VERIFICATION";
            }

            document.title =
                "TLC | Official Fine Receipt";
        }

    }

    const paymentTypeElement =
        document.getElementById("paymentType");

    if (paymentTypeElement) {

        const observer =
            new MutationObserver(function () {
                applyFineReceiptTheme();
            });

        observer.observe(
            paymentTypeElement,
            {
                childList: true,
                characterData: true,
                subtree: true
            }
        );
    }

    const descriptionElement =
        document.getElementById("description");

    if (descriptionElement) {

        const observer =
            new MutationObserver(function () {
                applyFineReceiptTheme();
            });

        observer.observe(
            descriptionElement,
            {
                childList: true,
                characterData: true,
                subtree: true
            }
        );
    }

    applyFineReceiptTheme();

})();
