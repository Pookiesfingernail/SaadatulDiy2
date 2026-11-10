/*
 * PRODUCT DETAIL PAGE - SA'ADATUL D.I.Y
 *
 * Product details are loaded from the database.
 * Example: product.html?id=2
 *
 * Features:
 * - Display product details
 * - Display product image
 * - Select other designs
 * - Increase/decrease quantity
 * - Add product to cart
 *
 * Slideshow, product information and
 * recommendations have been removed.
 */

// ==========================================
// PRODUCT VARIABLES
// ==========================================

let currentProduct = null;

const mainImage = document.getElementById("mainProductImage");

const qtyInput = document.getElementById("qtyInput");
const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

const addToCartButton = document.querySelector(
    ".add-to-cart-large"
);

const productTitle = document.querySelector(".product-title");
const productPrice = document.querySelector(".product-price");
const productDescription = document.querySelector(".product-desc");

const stockBadge = document.querySelector(
    ".badges .badge"
);

const otherDesigns = document.querySelector(
    ".other-designs"
);

// Image fallback support from global.js
if (mainImage) {
    mainImage.setAttribute("data-fallback", "");
}


// ==========================================
// OTHER DESIGN SELECTION
// ==========================================

function selectDesign(element, imageSrc) {

    document.querySelectorAll(".design-card").forEach(card => {
        card.classList.remove("active");
    });

    element.classList.add("active");

    // If the design is linked to another
    // product in the database, open that product.

    const productId = element.dataset.productId;

    if (productId) {
        window.location.href =
            "product.html?id=" + encodeURIComponent(productId);
        return;
    }

    // Otherwise, change the displayed image.
    if (imageSrc && mainImage) {
        mainImage.src = imageSrc;
    }
}


// ==========================================
// QUANTITY SELECTOR
// ==========================================

function maxQuantity() {

    if (
        currentProduct &&
        currentProduct.stock !== null &&
        currentProduct.stock !== undefined
    ) {
        const stock = Number(currentProduct.stock);

        if (Number.isFinite(stock)) {
            return Math.max(0, stock);
        }
    }

    return 99;
}


// Increase quantity

plusBtn.addEventListener("click", () => {

    const currentQty = parseInt(qtyInput.value, 10) || 1;

    if (currentQty < maxQuantity()) {
        qtyInput.value = currentQty + 1;
    }

});


// Decrease quantity

minusBtn.addEventListener("click", () => {

    const currentQty = parseInt(qtyInput.value, 10) || 1;

    if (currentQty > 1) {
        qtyInput.value = currentQty - 1;
    }

});


// ==========================================
// ADD TO CART
// ==========================================

addToCartButton.addEventListener("click", async () => {

    // Product must be loaded first.
    if (!currentProduct) {
        SDIY.toast("Product is not available.", "error");
        return;
    }

    const quantity = parseInt(qtyInput.value, 10) || 1;

    // Prevent adding more than available stock.
    if (quantity > maxQuantity()) {
        SDIY.toast(
            "Selected quantity exceeds available stock.",
            "error"
        );
        return;
    }

    addToCartButton.disabled = true;
    addToCartButton.textContent = "Adding...";

    try {

        // Existing cart function from global.js.
        // Login requirements remain handled there.

        const result = await SDIY.addToCart(
            currentProduct.id,
            quantity
        );

        if (result) {

            SDIY.toast(
                result.message || "Product added to cart!"
            );

            // Reset quantity after successful addition.
            qtyInput.value = 1;
        }

    } catch (error) {

        SDIY.toast(
            error.message || "Unable to add product to cart.",
            "error"
        );

    } finally {

        if (currentProduct && maxQuantity() === 0) {
            addToCartButton.disabled = true;
            addToCartButton.textContent = "Out of Stock";
        } else {
            addToCartButton.disabled = false;
            addToCartButton.textContent = "Add to Cart";
        }

    }

});


// ==========================================
// DISPLAY PRODUCT FROM DATABASE
// ==========================================

function renderProduct(data) {

    if (!data || !data.product) {
        throw new Error("Product data was not found.");
    }

    const product = data.product;

    currentProduct = product;

    // ======================================
    // PRODUCT TITLE
    // ======================================

    document.title =
        product.name + " | Sa'adatul D.I.Y";

    productTitle.textContent = product.name;


    // ======================================
    // PRODUCT PRICE
    // ======================================

    productPrice.textContent =
        "BND " + SDIY.formatPrice(product.price);


    // ======================================
    // PRODUCT DESCRIPTION
    // ======================================

    productDescription.textContent =
        product.description ||
        "Handmade crochet " +
        (product.category || "product") +
        ", made with love just for you.";


    // ======================================
    // PRODUCT IMAGE
    // ======================================

    // Display one main image only.
    // No slideshow arrows or dots.

    const image =
        product.image ||
        (Array.isArray(product.images)
            ? product.images[0]
            : null);

    if (image) {
        mainImage.src = image;
    }

    mainImage.alt = product.name;


    // ======================================
    // STOCK AVAILABILITY
    // ======================================

    const stock =
        product.stock === null ||
        product.stock === undefined
            ? null
            : Number(product.stock);

    const outOfStock = stock !== null && stock <= 0;

    if (stock === null) {

        stockBadge.textContent = "In Stock";

        stockBadge.style.background = "#4caf50";
        stockBadge.style.color = "#ffffff";

    } else if (outOfStock) {

        stockBadge.textContent = "Out of Stock";

        stockBadge.style.background = "#fdecee";
        stockBadge.style.color = "#c0392b";

    } else {

        stockBadge.textContent =
            `In Stock (${stock} available)`;

        stockBadge.style.background = "#4caf50";
        stockBadge.style.color = "#ffffff";

    }

    // Disable Add to Cart if out of stock.
    addToCartButton.disabled = outOfStock;

    addToCartButton.textContent =
        outOfStock ? "Out of Stock" : "Add to Cart";

    qtyInput.value = 1;


    // ======================================
    // OTHER DESIGNS
    // ======================================

    const designOptions = otherDesigns.querySelector(
        ".design-options"
    );

    const designs = Array.isArray(data.otherDesigns)
        ? data.otherDesigns
        : [];

    if (designs.length > 0) {

        otherDesigns.hidden = false;

        designOptions.innerHTML = designs.map(item => {

            const name = SDIY.escapeHtml(item.name);
            const image = SDIY.escapeHtml(item.image || "");

            const id = encodeURIComponent(item.id);

            return `
                <div
                    class="design-card"
                    data-product-id="${id}"
                    onclick="selectDesign(this, '')"
                >
                    <img
                        src="${image}"
                        alt="${name}"
                        data-fallback
                    >

                    <p>${name}</p>
                </div>
            `;

        }).join("");

    } else {

        // Keep the original HTML design cards
        // when no database alternatives exist.

        const existingCards = designOptions.querySelectorAll(
            ".design-card"
        );

        otherDesigns.hidden = existingCards.length === 0;

    }

    // Product Information removed.
    // You May Also Like removed.
    // Slideshow removed.

}


// ==========================================
// LOAD PRODUCT FROM DATABASE
// ==========================================

async function loadProduct() {

    try {

        let id = new URLSearchParams(
            window.location.search
        ).get("id");

        // If no product ID is provided,
        // load the first available product.

        if (!id) {

            const response = await SDIY.api("products.php");

            const products = response.products || [];

            if (!products.length) {
                throw new Error(
                    "No products available yet."
                );
            }

            id = products[0].id;
        }

        // Retrieve the selected product.
        const data = await SDIY.api(
            "products.php?id=" + encodeURIComponent(id)
        );

        renderProduct(data);

    } catch (error) {

        console.error("Product loading error:", error);

        productTitle.textContent = "Product not found";

        productPrice.textContent = "";

        productDescription.textContent =
            "Unable to load this product. Please try again.";

        addToCartButton.disabled = true;

        addToCartButton.textContent = "Unavailable";

        SDIY.toast(
            error.message || "Unable to load product.",
            "error"
        );

    }

}


// ==========================================
// INITIALIZE PRODUCT PAGE
// ==========================================

loadProduct();
