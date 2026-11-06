
// Product subtotal
const subtotal = 95;


// elements
const shippingRadios = document.querySelectorAll(
    'input[name="shipping"]'
);

const deliveryFeeText = document.getElementById("deliveryFee");
const totalText = document.getElementById("total");

const addressFields = document.getElementById("addressFields");
const shippingOptions = document.getElementById("shippingOptions");

const addressInputs = addressFields.querySelectorAll("input");


// Claculation for delivery fee and total
function updateTotals() {

    const selected = document.querySelector(
        'input[name="shipping"]:checked'
    );

    const fee = selected ? Number(selected.value) : 0;

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

        // Show or hide address and shipping information
        addressFields.hidden = !isDelivery;
        shippingOptions.hidden = !isDelivery;

        // Address only for deli
        addressInputs.forEach(input => {
            input.required = isDelivery;
        });

        // Update delivery fee
        if (!isDelivery) {

            deliveryFeeText.textContent = "0.00";
            totalText.textContent = subtotal.toFixed(2);

        } else {

            updateTotals();

        }

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


// Place Order button
document.getElementById("checkoutForm").addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const form = event.currentTarget;

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

        // Confirmation message
        alert(
            "Thank you for your order! Your checkout details are ready."
        );

    }
);


// Calculate initial total
updateTotals();
