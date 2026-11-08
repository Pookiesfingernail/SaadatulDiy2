/* LOGIN PAGE - SA'ADATUL D.I.Y */

document.addEventListener("DOMContentLoaded", async () => {

    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const notice = document.getElementById("loginNotice");
    const formMessage = document.getElementById("formMessage");
    const submitButton = loginForm.querySelector(".signup-button");

    // Page to return to after logging in (e.g. the product the customer wanted to add)
    const next = SDIY.safeRedirect(
        new URLSearchParams(window.location.search).get("next"),
        "account.html"
    );

    document.getElementById("signupLink").href = SDIY.loginUrl(next, "signup.html");

    // Already logged in? Go straight to the page.
    const session = await SDIY.getSession();
    if (session.loggedIn) {
        window.location.replace(next);
        return;
    }

    const loginMessage = sessionStorage.getItem("sdiyLoginMessage");
    if (loginMessage) {
        notice.textContent = loginMessage;
        notice.className = "form-message error";
        sessionStorage.removeItem("sdiyLoginMessage");
    }

    function showError(input, errorId, message) {
        document.getElementById(errorId).textContent = message;
        input.classList.add("invalid");
        input.setAttribute("aria-invalid", "true");
    }

    function clearError(input, errorId) {
        document.getElementById(errorId).textContent = "";
        input.classList.remove("invalid");
        input.removeAttribute("aria-invalid");
    }

    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = "form-message " + type;
    }

    // PASSWORD VISIBILITY
    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.target);
            const isHidden = target.type === "password";

            target.type = isHidden ? "text" : "password";
            button.innerHTML = isHidden
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';
            button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
            button.setAttribute("aria-pressed", String(isHidden));
        });
    });

    [[email, "emailError"], [password, "passwordError"]].forEach(([input, errorId]) => {
        input.addEventListener("input", () => {
            clearError(input, errorId);
            formMessage.className = "form-message";
            formMessage.textContent = "";
        });
    });

    loginForm.addEventListener("submit", async event => {

        event.preventDefault();

        let isValid = true;
        clearError(email, "emailError");
        clearError(password, "passwordError");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            showError(email, "emailError", "Please enter a valid email address.");
            isValid = false;
        }

        if (!password.value) {
            showError(password, "passwordError", "Please enter your password.");
            isValid = false;
        }

        if (!isValid) {
            showMessage("Please correct the highlighted fields.", "error");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Logging In...";

        try {
            await SDIY.api("login.php", {
                method: "POST",
                body: { email: email.value.trim(), password: password.value },
                redirectOnLogin: false
            });

            showMessage("Login successful! Redirecting...", "success");
            window.location.href = next;

        } catch (error) {
            showMessage(error.message, "error");
            password.value = "";
            submitButton.disabled = false;
            submitButton.textContent = "Log In";
        }
    });
});
