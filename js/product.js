// IMAGE GALLERY LOGIC
// Add product image  here
const productImages = [
    "photos/flowers.jpg",
    "photos/rose.jpg",
    "photos/flowers2.jpg", 
    "photos/flowers3.jpg"
];

let currentImageIndex = 0;
const mainImage = document.getElementById("mainProductImage");
const dots = document.querySelectorAll(".dot");

// Function to update the main image and active dot
function updateGallery(index) {
    if (index < 0) index = productImages.length - 1;
    if (index >= productImages.length) index = 0;
    
    currentImageIndex = index;
    mainImage.src = productImages[index];

    // Update dots
    dots.forEach(dot => dot.classList.remove("active"));
    if(dots[index]) dots[index].classList.add("active");
}

// Function for the Left/Right Arrows
function changeImage(direction) {
    updateGallery(currentImageIndex + direction);
}

// Function for clicking the dots
function setImage(index) {
    updateGallery(index);
}

// CLICKING "OTHER DESIGN" THUMBNAILS
function selectDesign(element, imageSrc) {
    // Remove active class from all design cards
    document.querySelectorAll('.design-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to clicked card
    element.classList.add('active');
    
    // Change the main image to the clicked design
    mainImage.src = imageSrc;
    
    // Optional: Reset the dots to the first one
    dots.forEach(dot => dot.classList.remove("active"));
    if(dots[0]) dots[0].classList.add("active");
}

// QUANTITY PLUS/MINUS LOGIC
const qtyInput = document.getElementById("qtyInput");
const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

plusBtn.addEventListener("click", () => {
    let currentQty = parseInt(qtyInput.value);
    qtyInput.value = currentQty + 1;
});

minusBtn.addEventListener("click", () => {
    let currentQty = parseInt(qtyInput.value);
    if (currentQty > 1) {
        qtyInput.value = currentQty - 1;
    }
});