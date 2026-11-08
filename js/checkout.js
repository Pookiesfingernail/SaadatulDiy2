/* CHECKOUT PAGE - SA'ADATUL D.I.Y
   Shows the customer's saved cart (from the database) and sends the
   order + payment screenshot to api/checkout.php. Login required. */

// Product subtotal (loaded from the cart)
let subtotal = 0;
let cartItems = [];
let fulfilment = "delivery";


// elements
const checkoutForm = document.getElementById("checkoutForm");
const placeOrderButtons = document.querySelectorAll(".place-order");

const shippingRadios = document.querySelectorAll(
    'input[name="shipping"]'
);

const subtotalText = document.getElementById("subtotal");
const deliveryFeeText = document.getElementById("deliveryFee");
const totalText = document.getElementById("total");
const orderItems = document.getElementById("orderItems");
const emptyOrder = document.getElementById("emptyOrder");

const addressFields = document.getElementById("addressFields");
const shippingOptions = document.getElementById("shippingOptions");

const addressInputs = addressFields.querySelectorAll("input");


// Calculation for delivery fee and total
function updateTotals() {

    const selected = document.querySelector(
        'input[name="shipping"]:checked'
    );

    const fee = fulfilment === "delivery" && selected ? Number(selected.value) : 0;

    subtotalText.textContent = subtotal.toFixed(2);
    deliveryFeeText.textContent = fee.toFixed(2);
    totalText.textContent = (subtotal + fee).toFixed(2);
}


// Update total when customer selects delivery district
shippingRadios.forEach(radio => {

    radio.addEventListener("change", updateTotals);

});


// Delivery and Pickup selection
document.querySelectorAll(".switch-option").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".switch-option").forEach(item => {
            item.classList.remove("active");
        });

        // Highlight selected button
        button.classList.add("active");

        const isDelivery = button.dataset.method === "delivery";
        fulfilment = isDelivery ? "delivery" : "pickup";

        // Show or hide address and shipping information
        addressFields.hidden = !isDelivery;
        shippingOptions.hidden = !isDelivery;

        // Address only for delivery
        addressInputs.forEach(input => {
            input.required = isDelivery;
        });

        updateTotals();

    });

});


//  uploaded payment screenshot filename
document.getElementById("proof").addEventListener(
    "change",
    event => {

        const file = event.target.files[0];

        document.getElementById("fileName").textContent =
            file ? file.name : "No file selected";

    }
);


// Show the items in "Your Order"
function renderOrder() {

    emptyOrder.hidden = cartItems.length > 0;

    orderItems.innerHTML = cartItems.map(item => `
        <div class="order-item">
            <img src="${SDIY.escapeHtml(item.image)}" alt="${SDIY.escapeHtml(item.name)}" data-fallback>
            <div class="order-item-info">
                <strong>${SDIY.escapeHtml(item.name)}</strong>
                <span>Qty: ${item.quantity} &times; BND ${SDIY.formatPrice(item.price)}</span>
            </div>
            <span class="order-item-price">BND ${SDIY.formatPrice(item.lineTotal)}</span>
        </div>
    `).join("");

    placeOrderButtons.forEach(button => {
        button.disabled = cartItems.length === 0;
    });

    updateTotals();
}


// Fill in saved details from the customer's profile
function prefill(user) {

    const values = {
        email: user.email,
        fullname: user.full_name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        postcode: user.postcode
    };

    Object.entries(values).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input && !input.value && value) input.value = value;
    });
}


// Place Order button
checkoutForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const form = event.currentTarget;

        if (cartItems.length === 0) {
            alert("Your order is empty. Please add items from the Shop page.");
            return;
        }

        // Check required information
        if (!form.reportValidity()) {
            return;
        }

        // Check payment screenshot
        const proof = document.getElementById("proof").files[0];

        if (!proof) {

            alert(
                "Please upload your BIBD bank transfer screenshot before placing your order."
            );

            return;
        }

        if (proof.size > 5 * 1024 * 1024) {
            alert("Payment screenshot must be 5 MB or smaller.");
            return;
        }

        const selected = document.querySelector('input[name="shipping"]:checked');
        const data = new FormData();

        data.append("email", document.getElementById("email").value.trim());
        data.append("full_name", document.getElementById("fullname").value.trim());
        data.append("phone", document.getElementById("phone").value.trim());
        data.append("country", document.getElementById("country").value.trim());
        data.append("fulfilment", fulfilment);
        data.append("address", document.getElementById("address").value.trim());
        data.append("city", document.getElementById("city").value.trim());
        data.append("postcode", document.getElementById("postcode").value.trim());
        data.append("shipping", selected ? selected.value : "");
        data.append("proof", proof);

        placeOrderButtons.forEach(button => { button.disabled = true; });

        try {
            const result = await SDIY.api("checkout.php", { method: "POST", form: data });

            SDIY.setCartCount(0);

            // Confirmation message
            alert(result.message + "\nWe will contact you once your payment is confirmed.");

            window.location.href = "account.html#orders";

        } catch (error) {
            alert(error.message);
            placeOrderButtons.forEach(button => { button.disabled = false; });
        }
    }
);


// Load the saved cart (login required)
async function loadCheckout() {

    placeOrderButtons.forEach(button => { button.disabled = true; });

    const user = await SDIY.requireLogin("Please log in or sign up to check out.");
    if (!user) return;

    prefill(user);

    try {
        const cart = await SDIY.api("cart.php");
        cartItems = cart.items;
        subtotal = cart.subtotal;
    } catch (error) {
        alert(error.message);
    }

    renderOrder();
}


// Calculate initial total
updateTotals();
loadCheckout();
