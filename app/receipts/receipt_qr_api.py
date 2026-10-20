from io import BytesIO
from flask import Blueprint, request, send_file, jsonify
import qrcode


receipt_qr_api = Blueprint(
    "receipt_qr_api",
    __name__
)


@receipt_qr_api.route("/api/receipt/qr", methods=["GET"])
def receipt_qr():

    receipt_number = request.args.get("receipt", "").strip()

    if not receipt_number:
        return jsonify({
            "success": False,
            "message": "Receipt number is required."
        }), 400

    verification_url = (
        request.host_url.rstrip("/")
        + "/member/receipt/"
        + receipt_number.replace("/", "%2F")
    )

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=8,
        border=4
    )

    qr.add_data(verification_url)
    qr.make(fit=True)

    image = qr.make_image(
        fill_color="#173F6B",
        back_color="#FFFFFF"
    )

    output = BytesIO()

    image.save(
        output,
        format="PNG"
    )

    output.seek(0)

    return send_file(
        output,
        mimetype="image/png",
        download_name="tlc-receipt-qr.png"
    )
