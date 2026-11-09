// Product subtotal
const subtotal = 0;

// --- LOCK PHONE NUMBER TO +673 ---
function enforceBruneiPhone(input) {
    if (!input.value.startsWith('+673')) {
        input.value = '+673 ' + input.value.replace(/[^0-9]/g, ''); 
    }
}

// --- CALCULATE TOTALS ---
const shippingRadios = document.querySelectorAll('input[name="shipping"]');
const deliveryFeeText = document.getElementById("deliveryFee");
const totalText = document.getElementById("total");
const addressFields = document.getElementById("addressFields");
const addressInputs = addressFields.querySelectorAll("input");

const shippingOptionsBox = document.getElementById("shippingOptions");
const pickupAddressBox = document.getElementById("pickupAddressBox");

function updateTotals() {
    const selected = document.querySelector('input[name="shipping"]:checked');
    const fee = selected ? Number(selected.value) : 0;
    deliveryFeeText.textContent = fee.toFixed(2);
    totalText.textContent = (subtotal + fee).toFixed(2);
}

shippingRadios.forEach(radio => {
    radio.addEventListener("change", updateTotals);
});

// --- DELIVERY / PICKUP TOGGLE ---
document.querySelectorAll(".switch-option").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".switch-option").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        const isDelivery = button.dataset.method === "delivery";

        if (isDelivery) {
            addressFields.style.display = "block";
            shippingOptionsBox.style.display = "block";
            pickupAddressBox.style.display = "none";
            addressInputs.forEach(input => input.required = true);
            updateTotals();
        } else {
            addressFields.style.display = "none";
            shippingOptionsBox.style.display = "none";
            pickupAddressBox.style.display = "block";
            addressInputs.forEach(input => input.required = false);
            deliveryFeeText.textContent = "0.00";
            totalText.textContent = subtotal.toFixed(2);
        }
    });
});

// --- FILE UPLOAD ---
document.getElementById("proof").addEventListener("change", event => {
    const file = event.target.files[0];
    document.getElementById("fileName").textContent = file ? file.name : "No file selected";
});

// --- SUBMIT ORDER (ONLY ONE SUBMIT EVENT) ---
document.getElementById("checkoutForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;

    // 1. Check if form is valid
    if (!form.reportValidity()) return;

    // 2. Check if proof is uploaded
    const proof = document.getElementById("proof").files[0];
    if (!proof) {
        alert("Please upload your BIBD bank transfer screenshot before placing your order.");
        return;
    }

    // 3. Generate a random 3-digit Order ID (e.g., SD-001)
    const randomId = Math.floor(1 + Math.random() * 999).toString().padStart(3, '0');
    document.getElementById("randomId").textContent = randomId;

    // 4. Show the Success Modal (No alerts!)
    document.getElementById("successModal").style.display = "flex";
});

// Calculate initial total on page load
updateTotals();