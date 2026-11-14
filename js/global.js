/* =========================================================
   GLOBAL JS - SA'ADATUL D.I.Y
   Loaded on every page. Connects the pages to the PHP backend (api/ folder):
   - login status, account dropdown and cart badge in the navigation bar
   - shared helpers used by the other JS files: SDIY.api(), SDIY.addToCart() ...
   ========================================================= */

(function () {

    if (window.SDIY) return;

    const API_BASE = "api/";
    const FALLBACK_IMAGE = "photos/saadatuldiyclear.png";

    let sessionPromise = null;

    // ---------- Helpers ----------

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[char]);
    }

    function formatPrice(amount) {
        return Number(amount || 0).toFixed(2);
    }

    function currentPage() {
        const file = window.location.pathname.split("/").pop() || "index.html";
        return file + window.location.search + window.location.hash;
    }

    // Only allow redirects to pages of this website (e.g. "shop.html?id=2").
    function safeRedirect(target, fallback = "account.html") {
        return /^[a-z0-9_-]+\.html([?#][^\s]*)?$/i.test(target || "") ? target : fallback;
    }

    function loginUrl(next = currentPage(), page = "login.html") {
        return page + "?next=" + encodeURIComponent(safeRedirect(next, "index.html"));
    }

    function redirectToLogin(message) {
        if (message) sessionStorage.setItem("sdiyLoginMessage", message);
        window.location.href = loginUrl();
    }

    // ---------- Talking to the PHP backend ----------

    async function api(path, options = {}) {

        const request = {
            method: options.method || "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        };

        if (options.form) {
            request.body = options.form;
        } else if (options.body !== undefined) {
            request.headers["Content-Type"] = "application/json";
            request.body = JSON.stringify(options.body);
        }

        let response;
        let result;

        try {
            response = await fetch(API_BASE + path, request);
        } catch (error) {
            throw new Error("Cannot reach the server. Please make sure Apache and MySQL are running in XAMPP.");
        }

        try {
            result = await response.json();
        } catch (error) {
            throw new Error("The server sent an invalid response. Please open the website through http://localhost/ (not by double-clicking the file).");
        }

        if (response.status === 401 && result.loginRequired) {
            sessionPromise = Promise.resolve({ loggedIn: false, user: null, cartCount: 0 });
            if (options.redirectOnLogin !== false) redirectToLogin(result.message);
        }

        if (!response.ok || !result.success) {
            const error = new Error(result.message || "Something went wrong. Please try again.");
            error.status = response.status;
            error.data = result;
            throw error;
        }

        return result;
    }

    function getSession(refresh = false) {
        if (!sessionPromise || refresh) {
            sessionPromise = api("session.php").catch(error => {
                sessionPromise = null;
                console.warn(error.message);
                return { loggedIn: false, user: null, cartCount: 0, offline: true };
            });
        }
        return sessionPromise;
    }

    // Use on pages/buttons that need an account. Returns the user, or redirects to login.
    async function requireLogin(message = "Please log in or sign up to continue.") {
        const session = await getSession();
        if (session.loggedIn) return session.user;
        redirectToLogin(message);
        return null;
    }

    async function addToCart(productId, quantity = 1) {
        const user = await requireLogin("Please log in or sign up to add items to your cart.");
        if (!user) return null;

        const result = await api("cart.php", {
            method: "POST",
            body: { product_id: productId, quantity }
        });

        setCartCount(result.count);
        return result;
    }

    async function setFavourite(productId, isFavourite) {
        const user = await requireLogin("Please log in or sign up to save your favourite items.");
        if (!user) return null;

        return api("favourites.php", {
            method: isFavourite ? "POST" : "DELETE",
            body: { product_id: productId }
        });
    }

    async function logout() {
        try {
            await api("logout.php", { method: "POST" });
        } catch (error) {
            console.warn(error.message);
        }
        sessionStorage.removeItem("sdiyCustomDraft");
        window.location.href = "index.html";
    }

    // ---------- Cart badge ----------

    function setCartCount(count) {
        document.querySelectorAll(".cart-icon a").forEach(link => {

            let badge = link.parentElement.querySelector("#cart-count, .sdiy-cart-count");

            if (!badge) {
                badge = document.createElement("span");
                badge.className = "sdiy-cart-count";
                link.appendChild(badge);
            }

            badge.textContent = count > 99 ? "99+" : String(count);
            badge.style.display = count > 0 ? "inline-block" : "none";
        });
    }

    // ---------- Small pop-up message ----------

    function toast(message, type = "success") {
        let box = document.querySelector(".sdiy-toast");

        if (!box) {
            box = document.createElement("div");
            box.className = "sdiy-toast";
            box.setAttribute("role", "status");
            box.setAttribute("aria-live", "polite");
            document.body.appendChild(box);
        }

        box.textContent = message;
        box.className = "sdiy-toast show " + type;

        clearTimeout(box.hideTimer);
        box.hideTimer = setTimeout(() => box.classList.remove("show"), 3200);
    }

    // ---------- Account dropdown ----------

    function buildAccountMenu(session) {

        document.querySelectorAll(".profile-icon").forEach((holder, index) => {

            const link = holder.querySelector("a");
            if (!link || holder.querySelector(".account-menu")) return;

            const menuId = "accountMenu" + index;
            const user = session.user;

            const accountLink = (hash) => session.loggedIn
                ? "account.html#" + hash
                : loginUrl("account.html#" + hash);

            holder.classList.add("has-account-menu");
            link.href = session.loggedIn ? "account.html#profile" : "login.html";
            link.setAttribute("aria-haspopup", "true");
            link.setAttribute("aria-expanded", "false");
            link.setAttribute("aria-controls", menuId);
            link.setAttribute("aria-label", "My account");

            const menu = document.createElement("div");
            menu.className = "account-menu";
            menu.id = menuId;

            menu.innerHTML = `
                <p class="account-menu-greeting">
                    ${session.loggedIn
                        ? "Hi, <strong>" + escapeHtml(user.full_name.split(" ")[0]) + "</strong>"
                        : "Welcome to Sa'adatul D.I.Y"}
                </p>
                <a href="${accountLink("profile")}"><i class="fa-regular fa-user"></i> Profile Settings</a>
                <a href="${accountLink("favourites")}"><i class="fa-regular fa-heart"></i> Favourite Items</a>
                <a href="${accountLink("orders")}"><i class="fa-solid fa-receipt"></i> Order History</a>
                <div class="account-menu-rule"></div>
                ${session.loggedIn
                    ? '<button type="button" class="account-menu-logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button>'
                    : `<a href="${loginUrl()}"><i class="fa-solid fa-arrow-right-to-bracket"></i> Log In</a>
                       <a href="${loginUrl(currentPage(), "signup.html")}"><i class="fa-solid fa-user-plus"></i> Sign Up</a>`}
            `;

            holder.appendChild(menu);

            const close = () => {
                holder.classList.remove("open");
                link.setAttribute("aria-expanded", "false");
            };

            link.addEventListener("click", event => {
                event.preventDefault();
                const isOpen = holder.classList.toggle("open");
                link.setAttribute("aria-expanded", String(isOpen));
            });

            document.addEventListener("click", event => {
                if (!holder.contains(event.target)) close();
            });

            document.addEventListener("keydown", event => {
                if (event.key === "Escape") close();
            });

            const logoutButton = menu.querySelector(".account-menu-logout");
            if (logoutButton) logoutButton.addEventListener("click", logout);
        });
    }

    // ---------- Navigation search -> Shop page ----------

    function connectSearch() {
        document.querySelectorAll(".searchbar").forEach(bar => {

            const input = bar.querySelector(".search-input");
            const icon = bar.querySelector(".search-icon");
            if (!input) return;

            const params = new URLSearchParams(window.location.search);
            if (params.get("search") && !input.value) input.value = params.get("search");

            const go = () => {
                const term = input.value.trim();
                window.location.href = term ? "shop.html?search=" + encodeURIComponent(term) : "shop.html";
            };

            input.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    go();
                }
            });

            if (icon) {
                icon.style.cursor = "pointer";
                icon.addEventListener("click", go);
            }
        });
    }

    // Show the shop logo if a product photo is missing.
    document.addEventListener("error", event => {
        const img = event.target;
        if (img.tagName === "IMG" && img.hasAttribute("data-fallback") && !img.src.endsWith(FALLBACK_IMAGE)) {
            img.src = FALLBACK_IMAGE;
        }
    }, true);

    window.SDIY = {
        FALLBACK_IMAGE,
        api,
        getSession,
        requireLogin,
        redirectToLogin,
        loginUrl,
        safeRedirect,
        addToCart,
        setFavourite,
        setCartCount,
        logout,
        toast,
        escapeHtml,
        formatPrice
    };

    function init() {
        connectSearch();
        getSession().then(session => {
            buildAccountMenu(session);
            setCartCount(session.cartCount || 0);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
