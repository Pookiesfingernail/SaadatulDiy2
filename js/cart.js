/* SHOPPING CART PAGE - SA'ADATUL D.I.Y
   Items and quantities are saved in the database (api/cart.php). Login required. */

const cartItemsBox = document.getElementById("cartItems");
const cartLoading = document.getElementById("cartLoading");
const cartEmpty = document.getElementById("cartEmpty");
const cartItemCount = document.getElementById("cartItemCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");
const checkoutButton = document.getElementById("checkoutButton");

function renderCart(cart) {

    cartLoading.hidden = true;
    cartEmpty.hidden = cart.items.length > 0;

    cartItemCount.textContent = cart.count + (cart.count === 1 ? " item" : " items");
    cartSubtotal.textContent = SDIY.formatPrice(cart.subtotal);
    cartTotal.textContent = SDIY.formatPrice(cart.subtotal);

    checkoutButton.classList.toggle("disabled", cart.items.length === 0);
    checkoutButton.setAttribute("aria-disabled", String(cart.items.length === 0));

    cartItemsBox.innerHTML = cart.items.map(item => {
        const name = SDIY.escapeHtml(item.name);
        const max = item.stock === null ? 99 : Math.min(99, item.stock);

        return `
            <div class="cart-item" data-product-id="${item.productId}" data-quantity="${item.quantity}">
                <a href="product.html?id=${item.productId}">
                    <img src="${SDIY.escapeHtml(item.image)}" alt="${name}" data-fallback>
                </a>

                <div class="cart-item-info">
                    <h3><a href="product.html?id=${item.productId}">${name}</a></h3>
                    <p>BND ${SDIY.formatPrice(item.price)} each</p>
                    ${item.stock !== null ? `<p>${item.stock} in stock</p>` : ""}
                </div>

                <div class="cart-qty">
                    <button type="button" data-action="minus" aria-label="Decrease quantity" ${item.quantity <= 1 ? "disabled" : ""}>-</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-action="plus" aria-label="Increase quantity" ${item.quantity >= max ? "disabled" : ""}>+</button>
                </div>

                <div class="cart-item-end">
                    <strong>BND ${SDIY.formatPrice(item.lineTotal)}</strong>
                    <button type="button" class="cart-remove" data-action="remove">
                        <i class="fa-regular fa-trash-can"></i> Remove
                    </button>
                </div>
            </div>
        `;
    }).join("");

    SDIY.setCartCount(cart.count);
}

cartItemsBox.addEventListener("click", async event => {

    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const row = button.closest(".cart-item");
    const productId = Number(row.dataset.productId);
    const quantity = Number(row.dataset.quantity);
    const action = button.dataset.action;

    row.querySelectorAll("button").forEach(item => { item.disabled = true; });

    try {
        let result;

        if (action === "remove") {
            result = await SDIY.api("cart.php", { method: "DELETE", body: { product_id: productId } });
        } else {
            result = await SDIY.api("cart.php", {
                method: "PATCH",
                body: { product_id: productId, quantity: action === "plus" ? quantity + 1 : quantity - 1 }
            });
        }

        renderCart(result);

        if (action === "remove") SDIY.toast(result.message);

    } catch (error) {
        SDIY.toast(error.message, "error");
        loadCart();
    }
});

async function loadCart() {

    const user = await SDIY.requireLogin("Please log in or sign up to view your shopping cart.");
    if (!user) return;

    try {
        renderCart(await SDIY.api("cart.php"));
    } catch (error) {
        cartLoading.textContent = error.message;
    }
}

loadCart();
