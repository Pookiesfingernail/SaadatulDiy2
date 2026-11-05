// Location popup elements
const locationDialog = document.getElementById("locationDialog");
const openLocationButton = document.getElementById("openLocation");
const closeLocationButton = document.getElementById("closeLocation");

// Open the popup
openLocationButton.addEventListener("click", () => {
    locationDialog.showModal();
});

//Close using the X button
closeLocationButton.addEventListener("click", () => {
    locationDialog.close();
});

//Close when clicking outside the popup
locationDialog.addEventListener("click", (event) => {
    const bound = locationDialog.getBoundingClientRect();

    const clickenOutside =
        event.clientX < bound.left ||
        event.clientX > bound.right ||
        event.clientY < bound.top ||
        event.clientY > bound.bottom;

        if (clickenOutside) {
            locationDialog.close();
        }
});

// Return focus to the button after closing.
// The escape key also closes the dialog automatically
locationDialog.addEventListener("close", () => {
    openLocationButton.focus();
}
);

