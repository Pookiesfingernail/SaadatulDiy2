// --- FAVOURITES / HEART BUTTON FUNCTIONALITY ---
const wishlistButtons = document.querySelectorAll('.wishlist-btn');

wishlistButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault(); // Prevents the page from jumping or following a link
        
        // Toggle the 'active' class
        this.classList.toggle('active');
        
        // Swap the icon between outline (regular) and solid
        const icon = this.querySelector('i');
        if (this.classList.contains('active')) {
            icon.classList.remove('fa-regular');
            icon.classList.add('fa-solid'); // Filled heart
        } else {
            icon.classList.remove('fa-solid');
            icon.classList.add('fa-regular'); // Outline heart
        }
    });
});

// --- CATEGORY FILTERING ---
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