
/* SIGNUP PAGE - SA'ADATUL D.I.Y */

document.addEventListener("DOMContentLoaded", () => {

    const signupForm = document.getElementById("signupForm");

    if (!signupForm) return;

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const agreeTerms = document.getElementById("agreeTerms");
    const formMessage = document.getElementById("formMessage");
    const submitButton = signupForm.querySelector(".signup-button");

    // Page to return to after signing up (e.g. the product the customer wanted to add)
    const next = SDIY.safeRedirect(
        new URLSearchParams(window.location.search).get("next"),
        "account.html"
    );

    document.getElementById("loginLink").href = SDIY.loginUrl(next);

    SDIY.getSession().then(session => {
        if (session.loggedIn) window.location.replace(next);
    });

    // DISPLAY FIELD ERROR
    function showError(input, errorId, message) {
        document.getElementById(errorId).textContent = message;

        if (input) {
            input.classList.add("invalid");
            input.setAttribute("aria-invalid", "true");
        }
    }

    // CLEAR FIELD ERROR
    function clearError(input, errorId) {
        document.getElementById(errorId).textContent = "";

        if (input) {
            input.classList.remove("invalid");
            input.removeAttribute("aria-invalid");
        }
    }

    // DISPLAY FORM MESSAGE
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = "form-message " + type;
    }

    // PASSWORD VISIBILITY
    document.querySelectorAll(".toggle-password").forEach(button => {

        button.addEventListener("click", () => {

            const target = document.getElementById(
                button.dataset.target
            );

            const isHidden = target.type === "password";

            target.type = isHidden ? "text" : "password";

            button.innerHTML = isHidden
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

            button.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );

            button.setAttribute(
                "aria-pressed",
                String(isHidden)
            );
        });
    });

    // CLEAR ERRORS WHEN CUSTOMER TYPES
    [
        [fullName, "nameError"],
        [email, "emailError"],
        [password, "passwordError"],
        [confirmPassword, "confirmError"]
    ].forEach(([input, errorId]) => {

        input.addEventListener("input", () => {
            clearError(input, errorId);
            formMessage.className = "form-message";
            formMessage.textContent = "";
        });
    });

    agreeTerms.addEventListener("change", () => {
        document.getElementById("termsError").textContent = "";
    });

    // VALIDATE FORM
    function validateForm() {

        let isValid = true;

        const nameValue = fullName.value.trim();
        const emailValue = email.value.trim();
        const passwordValue = password.value;
        const confirmValue = confirmPassword.value;

        // Reset errors
        clearError(fullName, "nameError");
        clearError(email, "emailError");
        clearError(password, "passwordError");
        clearError(confirmPassword, "confirmError");

        document.getElementById("termsError").textContent = "";

        // Full name
        if (nameValue.length < 2) {
            showError(
                fullName,
                "nameError",
                "Please enter your full name."
            );
            isValid = false;
        }

        // Email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(emailValue)) {
            showError(
                email,
                "emailError",
                "Please enter a valid email address."
            );
            isValid = false;
        }

        // Password
        if (passwordValue.length < 8) {
            showError(
                password,
                "passwordError",
                "Password must contain at least 8 characters."
            );
            isValid = false;
        }

        // Confirm password
        if (!confirmValue) {
            showError(
                confirmPassword,
                "confirmError",
                "Please confirm your password."
            );
            isValid = false;
        } else if (passwordValue !== confirmValue) {
            showError(
                confirmPassword,
                "confirmError",
                "Passwords do not match."
            );
            isValid = false;
        }

        // Terms agreement
        if (!agreeTerms.checked) {
            document.getElementById("termsError").textContent =
                "Please agree to the Terms & Conditions.";
            isValid = false;
        }

        return isValid;
    }

    // SUBMIT SIGNUP FORM
    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        formMessage.className = "form-message";
        formMessage.textContent = "";

        if (!validateForm()) {
            showMessage(
                "Please correct the highlighted fields.",
                "error"
            );
            return;
        }

        // api/register.php saves the account in the database and logs the customer in.
        submitButton.disabled = true;
        submitButton.textContent = "Creating Account...";

        try {
            await SDIY.api("register.php", {
                method: "POST",
                body: {
                    full_name: fullName.value.trim(),
                    email: email.value.trim(),
                    password: password.value
                },
                redirectOnLogin: false
            });

            showMessage(
                "Account created successfully! Redirecting...",
                "success"
            );

            signupForm.reset();
            window.location.href = next;

        } catch (error) {
            const fieldErrors = (error.data && error.data.errors) || {};

            if (fieldErrors.email) showError(email, "emailError", fieldErrors.email);
            if (fieldErrors.full_name) showError(fullName, "nameError", fieldErrors.full_name);
            if (fieldErrors.password) showError(password, "passwordError", fieldErrors.password);

            showMessage(error.message, "error");

            submitButton.disabled = false;
            submitButton.textContent = "Sign Up";
        }
    });

});
