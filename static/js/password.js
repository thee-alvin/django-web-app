const form = document.getElementById("passwordForm");
const message = document.getElementById("passwordMessage");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const memberId = sessionStorage.getItem("verified_member_id");
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!memberId) {
        message.textContent = "Your verification session has expired. Please start again.";
        return;
    }

    if (newPassword.length < 8) {
        message.textContent = "Password must be at least 8 characters.";
        return;
    }

    if (newPassword !== confirmPassword) {
        message.textContent = "The passwords do not match.";
        return;
    }

    message.textContent = "Activating your TLC account...";

    try {
        const response = await fetch("/api/activate-account", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                member_id: memberId,
                password: newPassword
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {

            sessionStorage.removeItem("verified_member_id");
            sessionStorage.removeItem("verified_member_name");

            message.textContent =
                "Account activated successfully. Redirecting to login...";

            setTimeout(() => {
                window.location.href = "/login";
            }, 1200);

        } else {
            message.textContent =
                data.message || "Unable to activate your account.";
        }

    } catch (error) {
        message.textContent =
            "Unable to connect to the TLC Portal.";
    }
});
