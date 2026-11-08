/* PRODUCT DETAIL PAGE - SA'ADATUL D.I.Y
   Open as product.html?id=2 - details are loaded from the database.
   "Add to Cart" saves the item to the customer's cart (login required). */

const CATEGORY_NAMES = {
    keychain: "Keychains",
    figurine: "Figurines",
    plushie: "Plushies",
    accessory: "Accessories"
};

// IMAGE GALLERY LOGIC (filled from the database)
let productImages = [document.getElementById("mainProductImage").getAttribute("src")];
let currentProduct = null;

let currentImageIndex = 0;
const mainImage = document.getElementById("mainProductImage");
const dotsContainer = document.getElementById("dotsContainer");
let dots = document.querySelectorAll(".dot");

mainImage.setAttribute("data-fallback", "");

// Function to update the main image and active dot
function updateGallery(index) {
    if (index < 0) index = productImages.length - 1;
    if (index >= productImages.length) index = 0;

    currentImageIndex = index;
    mainImage.src = productImages[index];

    // Update dots
    dots.forEach(dot => dot.classList.remove("active"));
    if (dots[index]) dots[index].classList.add("active");
}

// Function for the Left/Right Arrows
function changeImage(direction) {
    updateGallery(currentImageIndex + direction);
}

// Function for clicking the dots
function setImage(index) {
    updateGallery(index);
}

// CLICKING "OTHER DESIGN" CARDS opens that product
function selectDesign(element, imageSrc) {
    document.querySelectorAll('.design-card').forEach(card => {
        card.classList.remove('active');
    });

    element.classList.add('active');

    if (element.dataset.productId) {
        window.location.href = "product.html?id=" + element.dataset.productId;
        return;
    }

    mainImage.src = imageSrc;
    dots.forEach(dot => dot.classList.remove("active"));
    if (dots[0]) dots[0].classList.add("active");
}

// QUANTITY PLUS/MINUS LOGIC
const qtyInput = document.getElementById("qtyInput");
const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");
const addToCartButton = document.querySelector(".add-to-cart-large");

function maxQuantity() {
    if (currentProduct && currentProduct.stock !== null) return currentProduct.stock;
    return 99;
}

plusBtn.addEventListener("click", () => {
    let currentQty = parseInt(qtyInput.value);
    if (currentQty < maxQuantity()) {
        qtyInput.value = currentQty + 1;
    }
});

minusBtn.addEventListener("click", () => {
    let currentQty = parseInt(qtyInput.value);
    if (currentQty > 1) {
        qtyInput.value = currentQty - 1;
    }
});

// ADD TO CART (redirects to login if the customer is not logged in)
addToCartButton.addEventListener("click", async () => {
    if (!currentProduct) return;

    addToCartButton.disabled = true;
    addToCartButton.textContent = "Adding...";

    try {
        const result = await SDIY.addToCart(currentProduct.id, parseInt(qtyInput.value) || 1);
        if (result) {
            SDIY.toast(result.message);
            qtyInput.value = 1;
        }
    } catch (error) {
        SDIY.toast(error.message, "error");
    } finally {
        addToCartButton.disabled = false;
        addToCartButton.textContent = "Add to Cart";
    }
});

// DISPLAY PRODUCT FROM DATABASE
function smallCard(product) {
    const name = SDIY.escapeHtml(product.name);
    return `
        <div class="product-card">
            <div class="card-image-wrapper">
                <img src="${SDIY.escapeHtml(product.image)}" alt="${name}" data-fallback>
            </div>
            <div class="card-info">
                <h3>${name}</h3>
                <p class="price">BND ${SDIY.formatPrice(product.price)}</p>
                <div class="card-actions">
                    <a href="product.html?id=${product.id}" class="view-detail-btn">View Details</a>
                </div>
            </div>
        </div>
    `;
}

function renderProduct(data) {
    const product = data.product;
    currentProduct = product;
    document.title = product.name + " | Sa'adatul D.I.Y";

    document.querySelector(".product-title").textContent = product.name;
    document.querySelector(".product-price").textContent = "BND " + SDIY.formatPrice(product.price);
    document.querySelector(".product-desc").textContent =
        product.description || "Handmade crochet " + product.category + ", made with love just for you.";

    // Stock badge
    const stockBadge = document.querySelector(".badges .badge");
    const outOfStock = product.stock === 0;
    stockBadge.textContent = product.stock === null
        ? "In Stock"
        : outOfStock ? "Out of Stock" : `In Stock (${product.stock} available)`;
    if (outOfStock) {
        stockBadge.style.background = "#fdecee";
        stockBadge.style.color = "#c0392b";
        addToCartButton.disabled = true;
        addToCartButton.textContent = "Out of Stock";
        addToCartButton.replaceWith(addToCartButton.cloneNode(true));
    }

    // Gallery
    productImages = product.images.length ? product.images : [product.image];
    dotsContainer.innerHTML = productImages.map((_, index) =>
        `<span class="dot ${index === 0 ? "active" : ""}" onclick="setImage(${index})"></span>`
    ).join("");
    dots = dotsContainer.querySelectorAll(".dot");
    mainImage.alt = product.name;
    updateGallery(0);

    const arrowsHidden = productImages.length < 2;
    document.querySelectorAll(".nav-arrow").forEach(arrow => { arrow.hidden = arrowsHidden; });
    dotsContainer.hidden = arrowsHidden;

    // Other designs from the same category
    const otherDesigns = document.querySelector(".other-designs");
    if (data.otherDesigns.length) {
        otherDesigns.querySelector(".design-options").innerHTML = data.otherDesigns.map(item => `
            <div class="design-card" data-product-id="${item.id}" onclick="selectDesign(this, '')">
                <img src="${SDIY.escapeHtml(item.image)}" alt="${SDIY.escapeHtml(item.name)}" data-fallback>
                <p>${SDIY.escapeHtml(item.name)}</p>
            </div>
        `).join("");
    } else {
        otherDesigns.hidden = true;
    }

    // Product information
    const meta = document.querySelectorAll(".product-meta p");
    if (meta[0]) meta[0].innerHTML = "<strong>Category:</strong> " + (CATEGORY_NAMES[product.category] || product.category);
    if (meta[1]) meta[1].innerHTML = "<strong>Availability:</strong> " + (outOfStock ? "Out of stock" : "Available");

    // You may also like
    const youMayLike = document.querySelector(".you-may-like");
    if (data.related.length) {
        youMayLike.querySelector(".recommendation-grid").innerHTML = data.related.map(smallCard).join("");
    } else {
        youMayLike.hidden = true;
    }
}

async function loadProduct() {
    try {
        let id = new URLSearchParams(window.location.search).get("id");

        if (!id) {
            const { products } = await SDIY.api("products.php");
            if (!products.length) throw new Error("No products available yet.");
            id = products[0].id;
        }

        renderProduct(await SDIY.api("products.php?id=" + encodeURIComponent(id)));
    } catch (error) {
        document.querySelector(".product-title").textContent = "Product not found";
        document.querySelector(".product-price").textContent = "";
        addToCartButton.disabled = true;
        SDIY.toast(error.message, "error");
    }
}

loadProduct();
