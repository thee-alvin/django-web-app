import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_DIR = Path(__file__).resolve().parents[2]

PORTAL_URL = os.getenv(
    "TLC_PORTAL_LOCAL_URL",
    "http://127.0.0.1:5000"
)


def generate_receipt_pdf(receipt):
    """
    Render the existing TLC portal receipt page as a PDF.

    This does NOT create a second receipt design.
    It uses the same member-receipt.html page, CSS,
    QR code, logo, official stamp, Treasurer section,
    and footer used by the portal.
    """

    receipt_number = str(
        receipt.get("receipt_number", "")
    ).strip()

    if not receipt_number:
        raise ValueError(
            "Receipt number is required for PDF generation."
        )

    encoded_receipt_number = receipt_number.replace(
        "/",
        "%2F"
    )

    page_url = (
        f"{PORTAL_URL.rstrip('/')}"
        f"/member/receipt/{encoded_receipt_number}"
    )

    with sync_playwright() as playwright:

        browser = playwright.chromium.launch()

        page = browser.new_page(
            viewport={
                "width": 1200,
                "height": 1600,
            },
            device_scale_factor=1,
        )

        try:
            page.goto(
                page_url,
                wait_until="domcontentloaded",
                timeout=30000,
            )

            # The receipt card exists in the HTML but is populated/shown
            # by the portal JavaScript. Wait only for it to be attached.
            page.wait_for_selector(
                "#receiptCard",
                state="attached",
                timeout=15000,
            )

            # Wait for the existing portal receipt renderer.
            page.wait_for_function(
                "() => typeof displayReceipt === 'function'",
                timeout=15000,
            )

            # Populate the SAME receipt page with the receipt
            # that was just recorded by the server.
            page.evaluate(
                """
                (receipt) => {
                    if (typeof displayReceipt !== "function") {
                        throw new Error(
                            "TLC receipt display function is unavailable."
                        );
                    }

                    displayReceipt(receipt);
                }
                """,
                receipt,
            )

            # displayReceipt() is responsible for revealing the populated card.
            page.wait_for_selector(
                "#receiptCard",
                state="visible",
                timeout=15000,
            )

            # Wait until the existing QR code on the portal page
            # has actually appeared.
            try:
                page.wait_for_selector(
                    "#receiptQRCode img",
                    state="visible",
                    timeout=15000,
                )
            except Exception:
                # Do not silently generate a different receipt.
                raise RuntimeError(
                    "The TLC QR code did not load before PDF generation."
                )

            # Make sure the QR image itself has finished loading.
            page.wait_for_function(
                """
                () => {
                    const image =
                        document.querySelector(
                            "#receiptQRCode img"
                        );

                    return image &&
                           image.complete &&
                           image.naturalWidth > 0 &&
                           image.naturalHeight > 0;
                }
                """,
                timeout=15000,
            )

            # Ensure the portal's print stylesheet is active.
            page.emulate_media(
                media="print"
            )

            # Preserve the exact portal colors/backgrounds.
            page.add_style_tag(
                content="""
                    html {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        size: A4;
                        margin: 0;
                    }
                """
            )

            # Extra protection: the action buttons must never
            # appear in the emailed PDF.
            page.add_style_tag(
                content="""
                    @media print {
                        .receipt-actions {
                            display: none !important;
                        }
                    }
                """
            )

            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
                margin={
                    "top": "0",
                    "right": "0",
                    "bottom": "0",
                    "left": "0",
                },
            )

            return pdf_bytes

        finally:
            browser.close()

