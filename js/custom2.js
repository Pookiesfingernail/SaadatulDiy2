const figurines = [
    {
        gender: "",
        basePrice: 0,
        skin: "",
        hair: "",
        outfit: "",
        accessories: [],
        hairNote: "",
        outfitNote: "",
        accessoryNote: ""
    }
];

const skinTones = [
    { name: "Light", color: "#f5dfc8" },
    { name: "Fair", color: "#eac5a5" },
    { name: "Medium", color: "#c99473" },
    { name: "Tan", color: "#a9795c" }
];

const hairOptions = [
    { name: "Standard Hijab", price: 0, womenOnly: true },
    { name: "Short Hair", price: 0 },
    { name: "Long Hair", price: 0 },
    { name: "Curly / Wavy Hair", price: 5 },
    { name: "Custom Detailed Hair", price: 5 }
];

const outfitOptions = [
    { name: "Casual Outfit", price: 0 },
    { name: "Military / Army", price: 8 },
    { name: "General Uniform", price: 8 },
    { name: "Baju Melayu Traditional", price: 8 },
    { name: "Formal Suits", price: 8 },
    { name: "Dress", price: 8 }
];

const accessoryOptions = [
    { name: "Cap / Helmet or Head Accessories", price: 8 },
    { name: "Eyeglasses", price: 3 },
    { name: "Backpack / Bag", price: 5 },
    { name: "Graduation Robe", price: 8 },
    { name: "Other Details", price: 5 }
];

const figurineForms = document.getElementById("figurineForms");
const summaryItems = document.getElementById("summaryItems");
const totalPrice = document.getElementById("totalPrice");

function createFigurineForm(item, index) {
    const hairChoices = hairOptions.filter(option => {
        if (item.gender === "Male" && option.womenOnly) return false;
        return true;
    });

    return `
        <section class="form-section figurine-card">
            <label>CHOOSE DOLL GENDER (Fixed Size 16cm - 22cm)</label>
            <div class="gender-options">
                <button type="button" class="choice ${item.gender === "Male" ? "selected" : ""}" data-index="${index}" data-field="gender" data-value="Male">
                    <strong>Male Figurine</strong>
                    <small>Male crochet doll</small>
                    <span class="choice-price">BND $58.00</span>
                </button>
                <button type="button" class="choice ${item.gender === "Female" ? "selected" : ""}" data-index="${index}" data-field="gender" data-value="Female">
                    <strong>Female Figurine</strong>
                    <small>Female crochet doll</small>
                    <span class="choice-price">BND $60.00</span>
                </button>
            </div>

            <p class="small-instruction">SELECT SKIN TONE</p>
            <div class="skin-options">
                ${skinTones.map(tone => `
                    <button type="button" title="${tone.name}" class="skin-choice ${item.skin === tone.name ? "selected" : ""}" style="background:${tone.color}" data-index="${index}" data-field="skin" data-value="${tone.name}"></button>
                `).join("")}
            </div>
        </section>

        <!-- HAIR STYLING -->
        <section class="form-section">
            <h3>Hair & Head Styling</h3>
            <label class="reference-photo-box">
                <i class="fa-regular fa-image"></i>
                <div>
                    <strong>Reference Photo Customisation:</strong><br>
                    Upload your own picture or reference photo to help us understand your preferred hairstyle.
                    <span class="file-upload-status" id="hairFile-${index}"></span>
                </div>
                <input type="file" class="hidden-file" accept="image/*" onchange="handleReferenceUpload(this, 'hairFile-${index}')">
            </label>

            <label>HAIRSTYLE / LENGTH / HEADWEAR OPTIONS</label>
            <div class="option-grid">
                ${hairChoices.map(option => `
                    <button type="button" class="option-button ${item.hair === option.name ? "selected" : ""}" data-index="${index}" data-field="hair" data-value="${option.name}">
                        ${option.name}
                        ${option.price > 0 ? `<small>+ BND $${option.price.toFixed(2)}</small>` : ""}
                    </button>
                `).join("")}
            </div>
            <p class="small-instruction">*Enter colour code from PDF if your choice of hairstyle or headwear is different.</p>
            <textarea placeholder="Type in the colour number & hairstyle (if any)..." data-index="${index}" data-note="hairNote">${item.hairNote}</textarea>
        </section>

        <!-- OUTFIT -->
        <section class="form-section">
            <h3>Outfit / Apparel</h3>
            <label class="reference-photo-box">
                <i class="fa-regular fa-image"></i>
                <div>
                    <strong>Reference Photo Customisation:</strong><br>
                    Upload your own picture or reference photo to help us understand your preferred outfit.
                    <span class="file-upload-status" id="outfitFile-${index}"></span>
                </div>
                <input type="file" class="hidden-file" accept="image/*" onchange="handleReferenceUpload(this, 'outfitFile-${index}')">
            </label>

            <label>SELECT OUTFIT / APPAREL CATEGORY</label>
            <div class="option-grid">
                ${outfitOptions.map(option => `
                    <button type="button" class="option-button ${item.outfit === option.name ? "selected" : ""}" data-index="${index}" data-field="outfit" data-value="${option.name}">
                        ${option.name}
                        ${option.price > 0 ? `<small>+ BND $${option.price.toFixed(2)}</small>` : ""}
                    </button>
                `).join("")}
            </div>
            <p class="small-instruction">*Enter colour code from PDF if your choice of outfit is different.</p>
            <textarea placeholder="Type in the colour number & outfit request..." data-index="${index}" data-note="outfitNote">${item.outfitNote}</textarea>
        </section>

        <!-- ACCESSORIES -->
        <section class="form-section">
            <h3>Optional Accessories & Details</h3>
            <label class="reference-photo-box">
                <i class="fa-regular fa-image"></i>
                <div>
                    <strong>Reference Photo Customisation:</strong><br>
                    Upload your own picture or reference photo to help us understand your preferred accessories.
                    <span class="file-upload-status" id="accFile-${index}"></span>
                </div>
                <input type="file" class="hidden-file" accept="image/*" onchange="handleReferenceUpload(this, 'accFile-${index}')">
            </label>

            <label>SELECT ACCESSORIES</label>
            <div class="accessory-list">
                ${accessoryOptions.map(option => {
                    const selected = item.accessories.includes(option.name);
                    return `
                        <label class="accessory-option ${selected ? "selected" : ""}">
                            <input type="checkbox" data-index="${index}" data-accessory="${option.name}" ${selected ? "checked" : ""}>
                            <span class="accessory-name">${option.name}</span>
                            <span class="accessory-price">BND $${option.price.toFixed(2)}</span>
                        </label>
                    `;
                }).join("")}
            </div>
            <p class="small-instruction">*Type in the colour number & accessories request if needed.</p>
            <textarea placeholder="Type in the colour number & accessories request..." data-index="${index}" data-note="accessoryNote">${item.accessoryNote}</textarea>
        </section>
    `;
}

function handleReferenceUpload(input, spanId) {
    const span = document.getElementById(spanId);
    if (input.files && input.files.length > 0) {
        span.textContent = "✓ " + input.files[0].name;
    } else {
        span.textContent = "";
    }
}

function renderFigurines() {
    figurineForms.innerHTML = figurines.map((item, index) => createFigurineForm(item, index)).join("");
    updateSummary();
}

const addButton = document.getElementById("addFigurine");
addButton.addEventListener("change", function () {
    if (addButton.checked) {
        figurines.push({
            gender: "Female",
            basePrice: 60,
            skin: "Light",
            hair: "Standard Hijab",
            outfit: "Casual Outfit",
            accessories: [],
            hairNote: "",
            outfitNote: "",
            accessoryNote: ""
        });
    } else {
        figurines.splice(1, 1);
    }
    renderFigurines();
});

figurineForms.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-field]");
    if (!button) return;

    const index = Number(button.dataset.index);
    const field = button.dataset.field;
    const value = button.dataset.value;
    const item = figurines[index];

    item[field] = value;

    if (field === "gender") {
        item.basePrice = value === "Male" ? 58 : 60;
        if (value === "Male" && item.hair === "Standard Hijab") item.hair = "Short Hair";
        if (value === "Female" && !item.hair) item.hair = "Standard Hijab";
        renderFigurines();
        return;
    }
    renderFigurines();
});

figurineForms.addEventListener("change", function(event) {
    if (!event.target.matches("input[data-accessory]")) return;

    const index = Number(event.target.dataset.index);
    const accessory = event.target.dataset.accessory;
    const selected = event.target.checked;

    if (selected) {
        figurines[index].accessories.push(accessory);
    } else {
        figurines[index].accessories = figurines[index].accessories.filter(item => item !== accessory);
    }
    renderFigurines();
});

figurineForms.addEventListener("input", function(event) {
    const noteField = event.target.dataset.note;
    if (!noteField) return;

    const index = Number(event.target.dataset.index);
    figurines[index][noteField] = event.target.value;
});

function getOptionPrice(options, selectedName) {
    const selected = options.find(option => option.name === selectedName);
    return selected ? selected.price : 0;
}

function updateSummary() {
    let total = 0;

    summaryItems.innerHTML = figurines.map((item, index) => {
        const hairPrice = getOptionPrice(hairOptions, item.hair);
        const outfitPrice = getOptionPrice(outfitOptions, item.outfit);
        const accessoryPrice = item.accessories.reduce((sum, name) => sum + getOptionPrice(accessoryOptions, name), 0);
        const itemTotal = item.basePrice + hairPrice + outfitPrice + accessoryPrice;

        total += itemTotal;

        return `
            <div class="summary-item">
                <h3>Figurine #${index + 1} (${item.gender || "Choose gender"})</h3>
                <div class="summary-line"><span>Skin: ${item.skin || "Not selected"}</span><span></span></div>
                <div class="summary-line"><span>Hair: ${item.hair || "Not selected"}</span><span>${hairPrice ? "+$" + hairPrice.toFixed(2) : ""}</span></div>
                <div class="summary-line"><span>Outfit: ${item.outfit || "Not selected"}</span><span>${outfitPrice ? "+$" + outfitPrice.toFixed(2) : ""}</span></div>
                ${item.accessories.map(name => `
                    <div class="summary-line"><span>Acc: ${name}</span><span>+$${getOptionPrice(accessoryOptions, name).toFixed(2)}</span></div>
                `).join("")}
                <div class="summary-line"><strong>Item Total</strong><strong>BND $${itemTotal.toFixed(2)}</strong></div>
            </div>
        `;
    }).join("");

    totalPrice.textContent = total.toFixed(2);
}

//  MODAL & VALIDATION LOGIC
const DRAFT_KEY = "sdiyCustomDraftFigurine";
const confirmButton = document.getElementById("confirmCustom");
const specialNotes = document.getElementById("specialNotes");

confirmButton.addEventListener("click", function() {
    // 1. Clear previous errors
    document.querySelectorAll('.missing-error').forEach(el => el.classList.remove('missing-error'));
    document.querySelectorAll('.form-section').forEach(el => el.classList.remove('has-error'));

    let hasError = false;
    let firstErrorElement = null;

    // 2. Check every figurine for missing fields
    figurines.forEach((item, index) => {
        if (!item.gender) {
            document.querySelectorAll(`.choice[data-index="${index}"][data-field="gender"]`).forEach(el => el.classList.add('missing-error'));
            if (!firstErrorElement) firstErrorElement = document.querySelector(`.choice[data-index="${index}"][data-field="gender"]`);
            hasError = true;
        }
        if (!item.skin) {
            document.querySelectorAll(`.skin-choice[data-index="${index}"][data-field="skin"]`).forEach(el => el.classList.add('missing-error'));
            if (!firstErrorElement) firstErrorElement = document.querySelector(`.skin-choice[data-index="${index}"][data-field="skin"]`);
            hasError = true;
        }
        if (!item.hair) {
            document.querySelectorAll(`.option-button[data-index="${index}"][data-field="hair"]`).forEach(el => el.classList.add('missing-error'));
            if (!firstErrorElement) firstErrorElement = document.querySelector(`.option-button[data-index="${index}"][data-field="hair"]`);
            hasError = true;
        }
        if (!item.outfit) {
            document.querySelectorAll(`.option-button[data-index="${index}"][data-field="outfit"]`).forEach(el => el.classList.add('missing-error'));
            if (!firstErrorElement) firstErrorElement = document.querySelector(`.option-button[data-index="${index}"][data-field="outfit"]`);
            hasError = true;
        }
    });

    // 3. If there's an error, highlight the whole section and scroll to it
    if (hasError) {
        // Add red background to the parent sections containing errors
        document.querySelectorAll('.missing-error').forEach(el => {
            el.closest('.form-section').classList.add('has-error');
        });

        // Scroll to the first missing item
        if (firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return; // Stop! Don't show the modal.
    }

    // 4. If everything is perfect, save draft and show modal
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        figurines: figurines,
        specialNotes: specialNotes.value
    }));

    document.getElementById("customModal").style.display = "flex";
});

function closeCustomModal() {
    document.getElementById("customModal").style.display = "none";
}

async function addToCart() {
    document.getElementById("customModal").style.display = "none";
    
    const user = await SDIY.requireLogin("Please log in or sign up to submit your custom order.");
    if (!user) return;

    confirmButton.disabled = true;

    try {
        const result = await SDIY.api("custom_order.php", {
            method: "POST",
            body: {
                figurines: figurines,
                specialNotes: specialNotes.value,
                orderType: "figurine"
            }
        });

        sessionStorage.removeItem(DRAFT_KEY);

        alert(
            "Your custom order #" + result.customOrderId + " has been saved!\n\n" +
            "Estimated total: BND $" + result.estimatedTotal.toFixed(2) + "\n" +
            "The final price depends on your requirements, so we will now open WhatsApp " +
            "for you to discuss and confirm the final price with us."
        );

        window.location.href = result.whatsappUrl;

    } catch (error) {
        alert(error.message);
        confirmButton.disabled = false;
    }
}

function restoreDraft() {
    try {
        const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
        if (!draft || !Array.isArray(draft.figurines) || !draft.figurines.length) return;

        figurines.splice(0, figurines.length, ...draft.figurines.slice(0, 2).map(item => ({
            ...item,
            basePrice: Number(item.basePrice) || 0,
            accessories: Array.isArray(item.accessories) ? item.accessories : []
        })));

        specialNotes.value = draft.specialNotes || "";
        addButton.checked = figurines.length > 1;

    } catch (error) {
        sessionStorage.removeItem(DRAFT_KEY);
    }
}

// INITIAL DISPLAY
restoreDraft();
renderFigurines();