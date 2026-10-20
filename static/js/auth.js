const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

togglePassword.addEventListener("click", () => {
    const hidden = passwordInput.type === "password";

    passwordInput.type = hidden ? "text" : "password";
    togglePassword.textContent = hidden ? "Hide" : "Show";
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const memberId = document.getElementById("memberId").value.trim();
    const password = passwordInput.value;

    loginMessage.textContent = "Checking your account...";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                member_id: memberId,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            loginMessage.textContent = "Login successful. Opening your portal...";

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 700);

        } else {
            loginMessage.textContent =
                data.message || "Invalid Member ID or password.";
        }

    } catch (error) {
        loginMessage.textContent =
            "Unable to connect to the TLC Portal.";
    }
});
