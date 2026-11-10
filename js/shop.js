/* SHOP PAGE - SA'ADATUL D.I.Y
   Products are loaded from the database (api/products.php).
   The heart button saves favourites to the customer's account.

   ALL: Shows only 5 products per category.
   CATEGORY / VIEW ALL: Shows every product in that category.
*/

const shopContainer = document.querySelector('.shop-container');
const filterButtons = document.querySelectorAll('.filter-btn');
const categorySections = document.querySelectorAll('.category-section');

const searchTerm =
    new URLSearchParams(window.location.search).get('search') || '';

// Maximum products displayed per category in ALL view
const MAX_VISIBLE_PRODUCTS = 5;

// Store products from database
let allProducts = [];

// Currently selected filter
let currentFilter = 'all';


// --------------------------------------------------
// PRODUCT CARD
// --------------------------------------------------

function productCard(product) {

    const name = SDIY.escapeHtml(product.name);

    return `
        <div class="product-card" data-product-id="${product.id}">

            <div class="card-image-wrapper">
                <a href="product.html?id=${product.id}">
                    <img
                        src="${SDIY.escapeHtml(product.image)}"
                        alt="${name}"
                        data-fallback
                    >
                </a>
            </div>

            <div class="card-info">

                <h3>${name}</h3>

                <p class="price">
                    BND ${SDIY.formatPrice(product.price)}
                </p>

                <div class="card-actions">

                    <a href="product.html?id=${product.id}"
                       class="view-detail-btn">
                        View Detail
                    </a>

                    <button
                        class="wishlist-btn ${product.isFavourite ? 'active' : ''}"
                        data-product-id="${product.id}"
                        aria-pressed="${Boolean(product.isFavourite)}"
                        aria-label="${product.isFavourite
                            ? 'Remove from favourites'
                            : 'Add to favourites'}">

                        <i class="${product.isFavourite
                            ? 'fa-solid'
                            : 'fa-regular'} fa-heart"></i>

                    </button>

                </div>

            </div>

        </div>
    `;
}


// --------------------------------------------------
// UPDATE FAVOURITE HEART
// --------------------------------------------------

function setHeart(button, isFavourite) {

    const icon = button.querySelector('i');

    button.classList.toggle('active', isFavourite);

    button.setAttribute(
        'aria-pressed',
        String(isFavourite)
    );

    button.setAttribute(
        'aria-label',
        isFavourite
            ? 'Remove from favourites'
            : 'Add to favourites'
    );

    icon.classList.toggle('fa-solid', isFavourite);
    icon.classList.toggle('fa-regular', !isFavourite);
}


// --------------------------------------------------
// LOAD PRODUCTS FROM MYSQL DATABASE
// --------------------------------------------------

async function loadProducts() {

    try {

        const query = searchTerm
            ? '?search=' + encodeURIComponent(searchTerm)
            : '';

        const response = await SDIY.api('products.php' + query);

        allProducts = response.products || [];

        // Display products using the selected filter
        renderProducts();

        // Display search results message
        if (searchTerm) {

            let note = document.querySelector('.search-result-note');

            if (!note) {

                note = document.createElement('p');

                note.className = 'search-result-note';

                note.style.cssText =
                    'text-align:center;color:#465b8b;margin:0 0 20px;';

                shopContainer.prepend(note);
            }

            note.innerHTML = allProducts.length
                ? `Showing results for "<strong>${SDIY.escapeHtml(searchTerm)}</strong>" &middot; <a href="shop.html">Show all products</a>`
                : `No products found for "<strong>${SDIY.escapeHtml(searchTerm)}</strong>". <a href="shop.html">Show all products</a>`;
        }

    } catch (error) {

        SDIY.toast(error.message, 'error');

    }
}


// --------------------------------------------------
// RENDER PRODUCTS
// --------------------------------------------------

function renderProducts() {

    categorySections.forEach(section => {

        const category =
            section.id.replace('section-', '');

        const grid =
            section.querySelector('.product-grid');

        // Find products in this category
        const categoryProducts = allProducts.filter(
            product => product.category === category
        );

        let displayedProducts;

        if (currentFilter === 'all') {

            // Show only first 5 products
            displayedProducts = categoryProducts.slice(
                0,
                MAX_VISIBLE_PRODUCTS
            );

        } else {

            // Show ALL products in selected category
            displayedProducts = categoryProducts;

        }

        // Generate product cards
        grid.innerHTML = displayedProducts.length
            ? displayedProducts.map(productCard).join('')
            : '<p class="price" style="grid-column:1/-1;">No products in this category yet.</p>';

        // Show or hide category section
        const matchesFilter =
            currentFilter === 'all' ||
            currentFilter === category;

        const hasProducts =
            categoryProducts.length > 0;

        section.style.display =
            matchesFilter && (!searchTerm || hasProducts)
                ? 'block'
                : 'none';

        // Show "View all" only when more than 5 products exist
        const viewAll =
            section.querySelector('.view-all');

        if (viewAll) {

            viewAll.style.display =
                currentFilter === 'all' &&
                categoryProducts.length > MAX_VISIBLE_PRODUCTS
                    ? 'inline'
                    : 'none';

        }

    });

}


// --------------------------------------------------
// CATEGORY FILTERING
// --------------------------------------------------

function applyFilter(filterValue) {

    currentFilter = filterValue;

    // Update active category button
    filterButtons.forEach(button => {

        button.classList.toggle(
            'active',
            button.dataset.filter === filterValue
        );

    });

    // Refresh product display
    renderProducts();

}


// --------------------------------------------------
// CATEGORY BUTTON CLICK EVENTS
// --------------------------------------------------

filterButtons.forEach(button => {

    button.addEventListener('click', function () {

        const selectedCategory =
            this.dataset.filter;

        applyFilter(selectedCategory);

    });

});


// --------------------------------------------------
// VIEW ALL CLICK EVENTS
// --------------------------------------------------

categorySections.forEach(section => {

    const viewAll =
        section.querySelector('.view-all');

    if (!viewAll) return;

    viewAll.addEventListener('click', function (event) {

        event.preventDefault();

        const category =
            section.id.replace('section-', '');

        // Show every product in selected category
        applyFilter(category);

        // Scroll to products
        window.scrollTo({
            top: shopContainer.offsetTop - 20,
            behavior: 'smooth'
        });

    });

});


// --------------------------------------------------
// FAVOURITES / HEART BUTTON FUNCTIONALITY
// --------------------------------------------------

shopContainer.addEventListener('click', async function (event) {

    const button =
        event.target.closest('.wishlist-btn');

    if (!button) return;

    event.preventDefault();

    const productId =
        Number(button.dataset.productId);

    if (!productId) return;

    const makeFavourite =
        !button.classList.contains('active');

    button.disabled = true;

    try {

        const result = await SDIY.setFavourite(
            productId,
            makeFavourite
        );

        if (result) {

            // Update stored product state
            const product = allProducts.find(
                item => Number(item.id) === productId
            );

            if (product) {
                product.isFavourite = makeFavourite;
            }

            setHeart(button, makeFavourite);

            SDIY.toast(result.message);

        }

    } catch (error) {

        SDIY.toast(error.message, 'error');

    } finally {

        button.disabled = false;

    }

});


// --------------------------------------------------
// INITIALIZE SHOP PAGE
// --------------------------------------------------

loadProducts();
