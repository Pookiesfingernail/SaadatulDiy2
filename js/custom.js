const keychains = [
    {
        gender: "",
        basePrice: "",
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

const keychainForms = document.getElementById("keychainForms");
const summaryItems = document.getElementById("summaryItems");
const totalPrice = document.getElementById("totalPrice");


// CREATE A KEYCHAIN FORM

function createKeychainForm(item, index) {

    const hairChoices = hairOptions.filter(option => {
        if (item.gender === "Male" && option.womenOnly) {
            return false;
        }
        return true;
    });

    return `
        <section class="form-section keychain-card">


            <label>CHOOSE DOLL GENDER (Fixed Size 12cm - 14cm)</label>

            <div class="gender-options">

                <button type="button"
                    class="choice ${item.gender === "Male" ? "selected" : ""}"
                    data-index="${index}"
                    data-field="gender"
                    data-value="Male">

                    <strong>Male Keychain</strong>
                    <small>Male crochet doll</small>
                    <span class="choice-price">BND $38.00</span>
                </button>

                <button type="button"
                    class="choice ${item.gender === "Female" ? "selected" : ""}"
                    data-index="${index}"
                    data-field="gender"
                    data-value="Female">

                    <strong>Female Keychain</strong>
                    <small>Female crochet doll</small>
                    <span class="choice-price">BND $40.00</span>
                </button>

            </div>


            <p class="small-instruction">SELECT SKIN TONE</p>

            <div class="skin-options">

                ${skinTones.map(tone => `
                    <button type="button"
                        title="${tone.name}"
                        class="skin-choice ${item.skin === tone.name ? "selected" : ""}"
                        style="background:${tone.color}"
                        data-index="${index}"
                        data-field="skin"
                        data-value="${tone.name}">
                    </button>
                `).join("")}

            </div>

        </section>


        <!-- HAIR STYLING -->

        <section class="form-section">

            <h3>Hair & Head Styling</h3>

<div class="reference-photo-box">
    <i class="fa-regular fa-image"></i>
    <div>
        <strong>Reference Photo Customisation:</strong><br>
        Upload your own picture or reference photo to help us understand your preferred hairstyle.
    </div>
</div>

            <label>HAIRSTYLE / LENGTH / HEADWEAR OPTIONS</label>

            <div class="option-grid">

                ${hairChoices.map(option => `
                    <button type="button"
                        class="option-button ${item.hair === option.name ? "selected" : ""}"
                        data-index="${index}"
                        data-field="hair"
                        data-value="${option.name}">

                        ${option.name}

                        ${option.price > 0
                            ? `<small>+ BND $${option.price.toFixed(2)}</small>`
                            : ""}
                    </button>
                `).join("")}

            </div>

            <p class="small-instruction">
                *Enter colour code from PDF if your choice of hairstyle
                or headwear is different.
            </p>

            <textarea
                placeholder="Type in the colour number & hairstyle (if any)..."
                data-index="${index}"
                data-note="hairNote">${item.hairNote}</textarea>

        </section>


        <!-- OUTFIT -->

        <section class="form-section">

            <h3>Outfit / Apparel</h3>

            <div class="reference-photo-box">
    <i class="fa-regular fa-image"></i>
    <div>
        <strong>Reference Photo Customisation:</strong><br>
        Upload your own picture or reference photo to help us understand your preferred hairstyle.
    </div>
</div>

            <label>SELECT OUTFIT / APPAREL CATEGORY</label>

            <div class="option-grid">

                ${outfitOptions.map(option => `
                    <button type="button"
                        class="option-button ${item.outfit === option.name ? "selected" : ""}"
                        data-index="${index}"
                        data-field="outfit"
                        data-value="${option.name}">

                        ${option.name}

                        ${option.price > 0
                            ? `<small>+ BND $${option.price.toFixed(2)}</small>`
                            : ""}
                    </button>
                `).join("")}

            </div>

            <p class="small-instruction">
                *Enter colour code from PDF if your choice of outfit
                is different.
            </p>

            <textarea
                placeholder="Type in the colour number & outfit request..."
                data-index="${index}"
                data-note="outfitNote">${item.outfitNote}</textarea>

        </section>


        <!-- ACCESSORIES -->

        <section class="form-section">

            <h3>Optional Accessories & Details</h3>

<div class="reference-photo-box">
    <i class="fa-regular fa-image"></i>
    <div>
        <strong>Reference Photo Customisation:</strong><br>
        Upload your own picture or reference photo to help us understand your preferred hairstyle.
    </div>
</div>

            <label>SELECT ACCESSORIES</label>

            <div class="accessory-list">

                ${accessoryOptions.map(option => {
                    const selected = item.accessories.includes(option.name);

                    return `
                        <label class="accessory-option ${selected ? "selected" : ""}">

                            <input type="checkbox"
                                data-index="${index}"
                                data-accessory="${option.name}"
                                ${selected ? "checked" : ""}>

                            <span class="accessory-name">
                                ${option.name}
                            </span>

                            <span class="accessory-price">
                                BND $${option.price.toFixed(2)}
                            </span>

                        </label>
                    `;
                }).join("")}

            </div>

            <p class="small-instruction">
                *Type in the colour number & accessories request if needed.
            </p>

            <textarea
                placeholder="Type in the colour number & accessories request..."
                data-index="${index}"
                data-note="accessoryNote">${item.accessoryNote}</textarea>

        </section>
    `;
}


// DISPLAY KEYCHAIN FORMS

function renderKeychains() {

    keychainForms.innerHTML = keychains.map((item, index) =>
        createKeychainForm(item, index)
    ).join("");

    updateSummary();
}


// ADD OR REMOVE SECOND KEYCHAIN

const addButton = document.getElementById("addKeychain");

addButton.addEventListener("change", function () {

    if (addButton.checked) {

        keychains.push({
            gender: "Female",
            basePrice: 40,
            skin: "Light",
            hair: "Standard Hijab",
            outfit: "Casual Outfit",
            accessories: [],
            hairNote: "",
            outfitNote: "",
            accessoryNote: ""
        });

    } else {

        keychains.splice(1, 1);

    }

    renderKeychains();
});


// HANDLE ALL OPTION BUTTONS

keychainForms.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-field]");

    if (!button) return;

    const index = Number(button.dataset.index);
    const field = button.dataset.field;
    const value = button.dataset.value;

    const item = keychains[index];

    item[field] = value;

    if (field === "gender") {

        item.basePrice = value === "Male" ? 38 : 40;

        // Male keychains cannot select hijab.
        if (value === "Male" && item.hair === "Standard Hijab") {
            item.hair = "Short Hair";
        }

        // Female keychains default to hijab if no suitable hair choice.
        if (value === "Female" && !item.hair) {
            item.hair = "Standard Hijab";
        }

        renderKeychains();
        return;
    }

    renderKeychains();
});


// HANDLE ACCESSORY CHECKBOXES

keychainForms.addEventListener("change", function(event) {

    if (!event.target.matches("input[data-accessory]")) return;

    const index = Number(event.target.dataset.index);
    const accessory = event.target.dataset.accessory;

    const selected = event.target.checked;

    if (selected) {
        keychains[index].accessories.push(accessory);
    } else {
        keychains[index].accessories =
            keychains[index].accessories.filter(item => item !== accessory);
    }

    renderKeychains();
});


// HANDLE TEXT NOTES

keychainForms.addEventListener("input", function(event) {

    const noteField = event.target.dataset.note;

    if (!noteField) return;

    const index = Number(event.target.dataset.index);

    keychains[index][noteField] = event.target.value;
});


// GET PRICE OF SELECTED OPTIONS

function getOptionPrice(options, selectedName) {

    const selected = options.find(option => option.name === selectedName);

    return selected ? selected.price : 0;
}


// UPDATE LIVE ORDER SUMMARY

function updateSummary() {

    let total = 0;

    summaryItems.innerHTML = keychains.map((item, index) => {

        const hairPrice = getOptionPrice(hairOptions, item.hair);
        const outfitPrice = getOptionPrice(outfitOptions, item.outfit);

        const accessoryPrice = item.accessories.reduce((sum, name) => {
            return sum + getOptionPrice(accessoryOptions, name);
        }, 0);

        const itemTotal =
            item.basePrice + hairPrice + outfitPrice + accessoryPrice;

        total += itemTotal;

        return `
            <div class="summary-item">

                <h3>Keychain #${index + 1} (${item.gender})</h3>

                <div class="summary-line">
                    <span>Skin: ${item.skin}</span>
                    <span></span>
                </div>

                <div class="summary-line">
                    <span>Hair: ${item.hair}</span>
                    <span>${hairPrice ? "+$" + hairPrice.toFixed(2) : ""}</span>
                </div>

                <div class="summary-line">
                    <span>Outfit: ${item.outfit}</span>
                    <span>${outfitPrice ? "+$" + outfitPrice.toFixed(2) : ""}</span>
                </div>

                ${item.accessories.map(name => `
                    <div class="summary-line">
                        <span>Acc: ${name}</span>
                        <span>+$${getOptionPrice(accessoryOptions, name).toFixed(2)}</span>
                    </div>
                `).join("")}

                <div class="summary-line">
                    <strong>Item Total</strong>
                    <strong>BND $${itemTotal.toFixed(2)}</strong>
                </div>

            </div>
        `;

    }).join("");

    totalPrice.textContent = total.toFixed(2);
}


// CONFIRM CUSTOMISATION

document.getElementById("confirmCustom").addEventListener("click", function() {

    const order = {
        keychains: keychains,
        specialNotes: document.getElementById("specialNotes").value,
        estimatedTotal: totalPrice.textContent
    };

    localStorage.setItem("customOrder", JSON.stringify(order));

    alert(
        "Your customisation has been saved! Your estimated total is BND $" +
        totalPrice.textContent
    );

});


// INITIAL DISPLAY

renderKeychains();