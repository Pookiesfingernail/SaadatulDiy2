
const reviewForm = document.getElementById("reviewForm");
const reviewGrid = document.getElementById("reviewGrid");
const productImage = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");

let uploadedImage = "";

// Show selected image before submitting
productImage.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) {
        uploadedImage = "";
        imagePreview.innerHTML = "";
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        this.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        uploadedImage = event.target.result;
        imagePreview.innerHTML = `<img src="${uploadedImage}" alt="Product preview">`;
    };

    reader.readAsDataURL(file);
});

// Submit review
reviewForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const product = document.getElementById("productName").value.trim();
    const comments = document.getElementById("comments").value.trim();
    const rating = document.querySelector('input[name="rating"]:checked');

    if (!rating) {
        alert("Please select a star rating.");
        return;
    }

    const stars = "★".repeat(Number(rating.value)) +
                  "☆".repeat(5 - Number(rating.value));

    const card = document.createElement("article");
    card.className = "review-card";

    const heading = document.createElement("h3");
    heading.textContent = name;

    const starDisplay = document.createElement("div");
    starDisplay.className = "stars";
    starDisplay.textContent = stars;

    const content = document.createElement("div");
    content.className = "review-content";

    if (uploadedImage) {
        const photo = document.createElement("img");
        photo.className = "review-photo";
        photo.src = uploadedImage;
        photo.alt = "Customer's product";
        content.appendChild(photo);
    }

    const comment = document.createElement("p");
    comment.textContent = comments;
    content.appendChild(comment);

    const productName = document.createElement("span");
    productName.className = "product-name";
    productName.textContent = product;

    card.appendChild(heading);
    card.appendChild(starDisplay);
    card.appendChild(content);
    card.appendChild(productName);

    reviewGrid.prepend(card);

    reviewForm.reset();
    uploadedImage = "";
    imagePreview.innerHTML = "";

    alert("Thank you for sharing your review!");
});
