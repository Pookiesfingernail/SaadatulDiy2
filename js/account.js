/* ACCOUNT PAGE - SA'ADATUL D.I.Y
   account.html#profile     Profile Settings
   account.html#favourites  Favourite Items
   account.html#orders      Order History
   All data comes from the database through the api/ folder. Login required. */

const TABS = ["profile", "favourites", "orders"];
const loaded = {};

const profileForm = document.getElementById("profileForm");
const passwordForm = document.getElementById("passwordForm");

function showMessage(id, message, type) {
    const box = document.getElementById(id);
    box.textContent = message;
    box.className = "account-message " + type;
}

function formatDate(value) {
    const date = new Date(String(value).replace(" ", "T"));
    return isNaN(date) ? value : date.toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
}

function statusLabel(status) {
    return `<span class="order-status ${SDIY.escapeHtml(status)}">${SDIY.escapeHtml(status.replace("_", " "))}</span>`;
}

// ---------- TABS ----------
function openTab(tab) {
    if (!TABS.includes(tab)) tab = "profile";

    document.querySelectorAll(".account-tab[data-tab]").forEach(link => {
        const active = link.dataset.tab === tab;
        link.classList.toggle("active", active);
        link.setAttribute("aria-selected", String(active));
    });

    TABS.forEach(name => {
        document.getElementById("tab-" + name).hidden = name !== tab;
    });

    if (!loaded[tab]) {
        loaded[tab] = true;
        if (tab === "favourites") loadFavourites();
        if (tab === "orders") loadOrders();
    }
}

window.addEventListener("hashchange", () => openTab(location.hash.slice(1)));

// ---------- PROFILE ----------
function fillProfile(user) {
    Object.entries(user).forEach(([key, value]) => {
        const input = profileForm.elements[key];
        if (input) input.value = value || "";
    });

    document.getElementById("sidebarName").textContent = user.full_name;
    document.getElementById("sidebarEmail").textContent = user.email;
    document.getElementById("accountGreeting").textContent =
        "Welcome back, " + user.full_name.split(" ")[0] + " ♡";
}

function markErrors(form, errors) {
    form.querySelectorAll("input").forEach(input => {
        input.classList.toggle("invalid", Boolean(errors && errors[input.name]));
    });
}

profileForm.addEventListener("submit", async event => {
    event.preventDefault();
    markErrors(profileForm, {});

    if (!profileForm.reportValidity()) return;

    const button = profileForm.querySelector("button");
    button.disabled = true;

    const data = Object.fromEntries(new FormData(profileForm));
    data.action = "update";

    try {
        const result = await SDIY.api("profile.php", { method: "POST", body: data });
        fillProfile(result.user);
        showMessage("profileMessage", result.message, "success");
    } catch (error) {
        markErrors(profileForm, error.data && error.data.errors);
        showMessage("profileMessage", error.message, "error");
    } finally {
        button.disabled = false;
    }
});

passwordForm.addEventListener("submit", async event => {
    event.preventDefault();
    markErrors(passwordForm, {});

    if (!passwordForm.reportValidity()) return;

    const data = Object.fromEntries(new FormData(passwordForm));

    if (data.new_password !== data.confirm_password) {
        markErrors(passwordForm, { confirm_password: true });
        showMessage("passwordMessage", "New passwords do not match.", "error");
        return;
    }

    const button = passwordForm.querySelector("button");
    button.disabled = true;

    try {
        const result = await SDIY.api("profile.php", {
            method: "POST",
            body: {
                action: "password",
                current_password: data.current_password,
                new_password: data.new_password
            }
        });
        passwordForm.reset();
        showMessage("passwordMessage", result.message, "success");
    } catch (error) {
        markErrors(passwordForm, error.data && error.data.errors);
        showMessage("passwordMessage", error.message, "error");
    } finally {
        button.disabled = false;
    }
});

// ---------- FAVOURITES ----------
const favouritesList = document.getElementById("favouritesList");

function renderFavourites(favourites) {
    if (!favourites.length) {
        favouritesList.innerHTML = `
            <div class="cart-empty">
                <i class="fa-regular fa-heart"></i>
                <p>You have no favourite items yet. Tap the heart on any product to save it here.</p>
                <a href="shop.html" class="cart-button">Browse the Shop</a>
            </div>`;
        return;
    }

    favouritesList.innerHTML = favourites.map(product => {
        const name = SDIY.escapeHtml(product.name);
        const soldOut = product.stock === 0;

        return `
            <div class="favourite-card" data-product-id="${product.id}">
                <a href="product.html?id=${product.id}">
                    <img src="${SDIY.escapeHtml(product.image)}" alt="${name}" data-fallback>
                </a>
                <div class="favourite-card-info">
                    <h3><a href="product.html?id=${product.id}">${name}</a></h3>
                    <p>BND ${SDIY.formatPrice(product.price)}</p>
                    <div class="favourite-actions">
                        <button type="button" class="cart-button ${soldOut ? "disabled" : ""}" data-action="cart">
                            ${soldOut ? "Out of Stock" : "Add to Cart"}
                        </button>
                        <button type="button" class="favourite-remove" data-action="remove" aria-label="Remove ${name} from favourites">
                            <i class="fa-solid fa-heart-crack"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join("");
}

async function loadFavourites() {
    try {
        renderFavourites((await SDIY.api("favourites.php")).favourites);
    } catch (error) {
        favouritesList.innerHTML = `<p class="cart-empty">${SDIY.escapeHtml(error.message)}</p>`;
    }
}

favouritesList.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const productId = Number(button.closest(".favourite-card").dataset.productId);
    button.disabled = true;

    try {
        if (button.dataset.action === "remove") {
            const result = await SDIY.setFavourite(productId, false);
            renderFavourites(result.favourites);
            SDIY.toast(result.message);
        } else {
            const result = await SDIY.addToCart(productId, 1);
            SDIY.toast(result.message);
            button.disabled = false;
        }
    } catch (error) {
        SDIY.toast(error.message, "error");
        button.disabled = false;
    }
});

// ---------- ORDER HISTORY ----------
function renderOrders(orders) {
    const box = document.getElementById("ordersList");

    if (!orders.length) {
        box.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-receipt"></i>
                <p>You have not placed any orders yet.</p>
                <a href="shop.html" class="cart-button">Start Shopping</a>
            </div>`;
        return;
    }

    box.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-card-head">
                <strong>Order #${order.id}</strong>
                <span>${SDIY.escapeHtml(formatDate(order.createdAt))}</span>
                ${statusLabel(order.status)}
            </div>
            <div class="order-card-body">
                ${order.items.map(item => `
                    <div class="order-line">
                        <span>${SDIY.escapeHtml(item.name)} &times; ${item.quantity}</span>
                        <span>BND ${SDIY.formatPrice(item.lineTotal)}</span>
                    </div>`).join("")}
                <div class="order-line">
                    <span>${order.fulfilment === "pickup" ? "Pickup" : "Delivery - " + SDIY.escapeHtml(order.shippingZone || "")}</span>
                    <span>BND ${SDIY.formatPrice(order.deliveryFee)}</span>
                </div>
                <div class="order-line total">
                    <span>Total</span>
                    <span>BND ${SDIY.formatPrice(order.total)}</span>
                </div>
            </div>
        </div>`).join("");
}

function renderCustomOrders(customOrders) {
    const box = document.getElementById("customOrdersList");

    if (!customOrders.length) {
        box.innerHTML = `
            <div class="cart-empty">
                <p>No custom orders yet.</p>
                <a href="custom.html" class="cart-button">Design a Custom Keychain</a>
            </div>`;
        return;
    }

    box.innerHTML = customOrders.map(order => `
        <div class="order-card">
            <div class="order-card-head">
                <strong>Custom Order #${order.id}</strong>
                <span>${SDIY.escapeHtml(formatDate(order.createdAt))}</span>
                ${statusLabel(order.status)}
            </div>
            <div class="order-card-body">
                ${order.keychains.map((item, index) => `
                    <div class="order-line">
                        <span>
                            Keychain #${index + 1} (${SDIY.escapeHtml(item.gender)}) &middot;
                            ${SDIY.escapeHtml(item.skin)}, ${SDIY.escapeHtml(item.hair)}, ${SDIY.escapeHtml(item.outfit)}
                            ${item.accessories && item.accessories.length ? "&middot; " + item.accessories.map(SDIY.escapeHtml).join(", ") : ""}
                        </span>
                        <span>BND ${SDIY.formatPrice(item.itemTotal)}</span>
                    </div>`).join("")}
                <div class="order-line total">
                    <span>${order.finalPrice === null ? "Estimated total (final price via WhatsApp)" : "Final price"}</span>
                    <span>BND ${SDIY.formatPrice(order.finalPrice === null ? order.estimatedTotal : order.finalPrice)}</span>
                </div>
                <a class="whatsapp-link" href="${SDIY.escapeHtml(order.whatsappUrl)}" target="_blank" rel="noopener">
                    <i class="fa-brands fa-whatsapp"></i> Discuss on WhatsApp
                </a>
            </div>
        </div>`).join("");
}

async function loadOrders() {
    try {
        const result = await SDIY.api("orders.php");
        renderOrders(result.orders);
        renderCustomOrders(result.customOrders);
    } catch (error) {
        document.getElementById("ordersList").innerHTML =
            `<p class="cart-empty">${SDIY.escapeHtml(error.message)}</p>`;
    }
}

// ---------- LOGOUT ----------
document.getElementById("logoutButton").addEventListener("click", SDIY.logout);

// ---------- START ----------
(async () => {
    const user = await SDIY.requireLogin("Please log in or sign up to view your account.");
    if (!user) return;

    fillProfile(user);
    openTab(location.hash.slice(1));
})();
