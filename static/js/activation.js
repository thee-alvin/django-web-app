const form = document.getElementById("activationForm");
const message = document.getElementById("activationMessage");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const memberId = document.getElementById("memberId").value.trim();
    const phone = document.getElementById("phone").value.trim();

    message.textContent = "Verifying your TLC membership...";

    try {
        const response = await fetch("/api/verify-member", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                member_id: memberId,
                phone: phone
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            message.textContent = "Account verified. Please create your password.";

            sessionStorage.setItem(
                "verified_member_id",
                data.member.member_id
            );

            sessionStorage.setItem(
                "verified_member_name",
                data.member.name
            );

            setTimeout(() => {
                window.location.href = "/create-password";
            }, 700);

        } else {
            message.textContent =
                data.message || "Verification failed.";
        }

    } catch (error) {
        message.textContent =
            "Unable to connect to the TLC Portal.";
    }
});
