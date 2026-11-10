/* SHOP PAGE FILTERING & VIEW ALL */

document.addEventListener("DOMContentLoaded", function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const categorySections = document.querySelectorAll('.category-section');
    const MAX_VISIBLE_PRODUCTS = 5;

    // Function to handle the filtering logic
    function filterProducts(filterValue) {
        
        // 1. Update the active button styling
        filterButtons.forEach(btn => {
            if (btn.dataset.filter === filterValue) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 2. Loop through each category section (Keychains, Figurines, etc.)
        categorySections.forEach(section => {
            const categoryId = section.id.replace('section-', ''); // e.g., "keychain"
            const cards = section.querySelectorAll('.product-card');
            const viewAllBtn = section.querySelector('.view-all');

            // If the filter is "all", or if it matches this section's category
            if (filterValue === 'all' || filterValue === categoryId) {
                section.style.display = 'block'; // Show the section

                if (filterValue === 'all') {
                    // RULE FOR "ALL": Show only 5, hide the rest, show View All
                    let visibleCount = 0;
                    cards.forEach(card => {
                        if (visibleCount < MAX_VISIBLE_PRODUCTS) {
                            card.style.display = 'flex'; // Show
                            visibleCount++;
                        } else {
                            card.style.display = 'none'; // Hide
                        }
                    });

                    // ALWAYS show "View all" in the "All" view for every category
                    if (viewAllBtn) {
                        viewAllBtn.style.display = 'inline-block';
                    }

                } else {
                    // RULE FOR SPECIFIC CATEGORY: Show ALL items in that category
                    cards.forEach(card => {
                        card.style.display = 'flex'; // Show all
                    });

                    // Hide "View all" because they are already seeing everything
                    if (viewAllBtn) {
                        viewAllBtn.style.display = 'none';
                    }
                }

            } else {
                // Hide the entire section if it doesn't match the filter
                section.style.display = 'none';
            }
        });
    }

    // 3. Add click events to the top filter buttons (All, Keychains, etc.)
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterValue = this.dataset.filter; // gets 'all', 'keychain', etc.
            filterProducts(filterValue);
        });
    });

    // 4. Add click events to the "View all" links inside the sections
    categorySections.forEach(section => {
        const viewAllBtn = section.querySelector('.view-all');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const categoryId = section.id.replace('section-', '');
                
                // Trigger the filter for this specific category
                filterProducts(categoryId);

                // Scroll to the top of the shop container so they see the results
                const shopContainer = document.querySelector('.shop-container');
                window.scrollTo({
                    top: shopContainer.offsetTop - 100,
                    behavior: 'smooth'
                });
            });
        }
    });

    // 5. Initial Load: Automatically click the "All" button on page load
    filterProducts('all');
});