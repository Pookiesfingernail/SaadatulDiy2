// ADD TO CART FUNCTIONALITY
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const cartCountBadge = document.getElementById('cart-count');

// Load existing cart from localStorage, or start with an empty array
let cart = JSON.parse(localStorage.getItem('saadatulCart')) || [];

// Update the cart icon badge number on page load
updateCartBadge();

addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
        const productName = this.getAttribute('data-name');
        const productPrice = parseFloat(this.getAttribute('data-price'));
        const productImage = this.closest('.product-card').querySelector('img').src;

        // Create a product object
        const product = {
            name: productName,
            price: productPrice,
            image: productImage
        };

        // Add to cart array
        cart.push(product);
        
        // Save to localStorage
        localStorage.setItem('saadatulCart', JSON.stringify(cart));

        // Update UI
        updateCartBadge();

        // Optional: Change button color briefly to show success
        const originalColor = this.style.backgroundColor;
        this.style.backgroundColor = '#69c27c'; // Green
        setTimeout(() => {
            this.style.backgroundColor = originalColor;
        }, 500);
    });
});

function updateCartBadge() {
    if (cart.length > 0) {
        cartCountBadge.style.display = 'block';
        cartCountBadge.textContent = cart.length;
    } else {
        cartCountBadge.style.display = 'none';
    }
}

// 2. CATEGORY FILTERING
const filterButtons = document.querySelectorAll('.filter-btn');
const categorySections = document.querySelectorAll('.category-section');

filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');

        const filterValue = this.getAttribute('data-filter');

        categorySections.forEach(section => {
            if (filterValue === 'all') {
                // Show all sections
                section.style.display = 'block';
            } else {
                // Check if the section ID matches the filter (e.g., "section-keychain")
                if (section.id === `section-${filterValue}`) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            }
        });
    });
});