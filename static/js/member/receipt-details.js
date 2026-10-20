const receiptNumberElement = document.getElementById("receiptNumber");
const receiptStatusElement = document.getElementById("receiptStatus");

const memberNameElement = document.getElementById("memberName");
const memberIdElement = document.getElementById("memberId");
const phoneNumberElement = document.getElementById("phoneNumber");
const emailElement = document.getElementById("email");

const paymentTypeElement = document.getElementById("paymentType");
const paymentDateElement = document.getElementById("paymentDate");
const paymentReferenceElement = document.getElementById("paymentReference");
const transactionReferenceElement =
    document.getElementById("transactionReference");
const paymentMethodElement =
    document.getElementById("paymentMethod");
const paymentTimeElement =
    document.getElementById("paymentTime");
const descriptionElement =
    document.getElementById("description");
const recordedByElement =
    document.getElementById("recordedBy");

const amountElement = document.getElementById("amount");

const receiptMessage =
    document.getElementById("receiptMessage");

const qrContainer =
    document.getElementById("receiptQRCode");

const qrReceiptNumber =
    document.getElementById("qrReceiptNumber");

const printButton =
    document.getElementById("printReceipt");

const downloadButton =
    document.getElementById("downloadReceipt");


function getReceiptNumber() {

    const marker = "/member/receipt/";

    const pathname =
        window.location.pathname;

    const index =
        pathname.indexOf(marker);

    if (index === -1) {
        return "";
    }

    const receiptPart =
        pathname.substring(
            index + marker.length
        );

    return decodeURIComponent(
        receiptPart
    ).trim();
}


function setText(element, value) {

    if (!element) {
        return;
    }

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        element.textContent = "—";
        return;
    }

    element.textContent = String(value);
}


function formatAmount(amount) {

    const value = Number(amount);

    if (!Number.isFinite(value)) {
        return "KES 0.00";
    }

    return `KES ${value.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


/*
==================================================
GENERATE TLC QR CODE
==================================================
*/

async function generateReceiptQRCode(receipt) {

    if (!qrContainer) {

        console.error(
            "TLC QR container not found."
        );

        return;
    }

    const receiptNumber =
        String(
            receipt.receipt_number ||
            getReceiptNumber() ||
            ""
        ).trim();

    if (!receiptNumber) {

        qrContainer.innerHTML =
            '<span style="color:#173F6B;">QR unavailable</span>';

        return;
    }

    if (qrReceiptNumber) {

        qrReceiptNumber.textContent =
            receiptNumber;
    }

    qrContainer.innerHTML =
        '<span style="color:#173F6B;font-size:12px;">Loading QR...</span>';

    const qrUrl =
        `/api/receipt/qr?receipt=${encodeURIComponent(receiptNumber)}`;

    console.log(
        "TLC QR request:",
        qrUrl
    );

    try {

        const response =
            await fetch(qrUrl, {
                method: "GET",
                cache: "no-store"
            });

        console.log(
            "TLC QR status:",
            response.status,
            response.headers.get("content-type")
        );

        if (!response.ok) {

            throw new Error(
                `QR server returned ${response.status}`
            );
        }

        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.includes("image")) {

            throw new Error(
                "QR server did not return an image."
            );
        }

        const blob =
            await response.blob();

        if (!blob.size) {

            throw new Error(
                "QR image is empty."
            );
        }

        const imageUrl =
            URL.createObjectURL(blob);

        const qrImage =
            document.createElement("img");

        qrImage.alt =
            `QR code for verifying TLC receipt ${receiptNumber}`;

        qrImage.width = 165;
        qrImage.height = 165;

        qrImage.style.display = "block";
        qrImage.style.width = "165px";
        qrImage.style.height = "165px";
        qrImage.style.maxWidth = "165px";
        qrImage.style.maxHeight = "165px";
        qrImage.style.minWidth = "165px";
        qrImage.style.minHeight = "165px";
        qrImage.style.objectFit = "contain";
        qrImage.style.visibility = "visible";
        qrImage.style.opacity = "1";
        qrImage.style.background = "#FFFFFF";

        qrImage.onload = function () {

            console.log(
                "TLC QR image displayed successfully."
            );
        };

        qrImage.onerror = function () {

            console.error(
                "TLC QR image failed after blob creation."
            );

            URL.revokeObjectURL(imageUrl);

            qrContainer.innerHTML =
                '<span style="color:#173F6B;">QR unavailable</span>';
        };

        qrContainer.innerHTML = "";

        qrContainer.appendChild(qrImage);

        qrImage.src = imageUrl;

    } catch (error) {

        console.error(
            "TLC QR ERROR:",
            error
        );

        qrContainer.innerHTML =
            '<span style="color:#173F6B;font-size:12px;">QR unavailable</span>';
    }
}


/*
==================================================
DISPLAY RECEIPT
==================================================
*/

function displayReceipt(receipt) {

    console.log(
        "TLC RECEIPT DATA:",
        receipt
    );

    setText(
        receiptNumberElement,
        receipt.receipt_number
    );

    setText(
        receiptStatusElement,
        receipt.status || "Issued"
    );

    setText(
        memberNameElement,
        receipt.member_name ||
        receipt.full_name
    );

    setText(
        memberIdElement,
        receipt.member_id
    );

    setText(
        phoneNumberElement,
        receipt.phone_number ||
        receipt.phone
    );

    setText(
        emailElement,
        receipt.email ||
        receipt.email_address
    );

    setText(
        paymentTypeElement,
        receipt.payment_type
    );

    setText(
        paymentDateElement,
        receipt.payment_date
    );

    setText(
        paymentReferenceElement,
        receipt.payment_reference
    );

    setText(
        transactionReferenceElement,
        receipt.transaction_reference ||
        receipt.payment_reference
    );

    setText(
        paymentMethodElement,
        receipt.payment_method
    );

    setText(
        paymentTimeElement,
        receipt.payment_time
    );

    setText(
        descriptionElement,
        receipt.description
    );

    setText(
        recordedByElement,
        receipt.recorded_by
    );

    if (amountElement) {

        amountElement.textContent =
            formatAmount(receipt.amount);
    }

    /*
     * Generate QR AFTER receipt data
     * has been successfully loaded.
     */

    generateReceiptQRCode(receipt);
}


/*
==================================================
LOAD RECEIPT
==================================================
*/

async function loadReceipt() {

    const receiptNumber =
        getReceiptNumber();

    console.log(
        "TLC receipt number:",
        receiptNumber
    );

    if (!receiptNumber) {

        if (receiptMessage) {

            receiptMessage.textContent =
                "No receipt number was provided.";
        }

        return;
    }

    try {

        const apiUrl =
            `/api/member/receipt/${encodeURIComponent(receiptNumber)}`;

        console.log(
            "TLC receipt API:",
            apiUrl
        );

        const response =
            await fetch(apiUrl, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            });

        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {

            const text =
                await response.text();

            console.error(
                "TLC API returned non-JSON:",
                text
            );

            throw new Error(
                "Receipt server returned an invalid response."
            );
        }

        const data =
            await response.json();

        console.log(
            "TLC receipt API response:",
            data
        );

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load this receipt."
            );
        }

        if (!data.receipt) {

            throw new Error(
                "Receipt data was not returned."
            );
        }

        displayReceipt(
            data.receipt
        );

    } catch (error) {

        console.error(
            "TLC RECEIPT ERROR:",
            error
        );

        if (receiptMessage) {

            receiptMessage.textContent =
                error.message;
        }
    }
}


/*
==================================================
PRINT
==================================================
*/

if (printButton) {

    printButton.addEventListener(
        "click",
        function () {

            window.print();
        }
    );
}


/*
==================================================
DOWNLOAD
==================================================
*/

if (downloadButton) {

    downloadButton.addEventListener(
        "click",
        function () {

            const receipt =
                document.getElementById("receiptCard");

            if (!receipt) {
                return;
            }

            const receiptNumber =
                receiptNumberElement
                    ? receiptNumberElement.textContent
                    : "TLC-receipt";

            const content =
                receipt.innerText;

            const blob =
                new Blob(
                    [content],
                    { type: "text/plain;charset=utf-8" }
                );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                `${receiptNumber || "TLC-receipt"}.txt`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            URL.revokeObjectURL(url);
        }
    );
}


/*
==================================================
START
==================================================
*/

loadReceipt();

