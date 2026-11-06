// ABOUT PAGE: LOCATION DETAILS POPUP

(() => {
    const locationDialog = document.getElementById("locationDialog");
    const openButton = document.getElementById("openLocation");
    const closeButton = document.getElementById("closeLocation");

    // Only run when the popup elements exist.
    if (!locationDialog || !openButton || !closeButton) {
        return;
    }

    // Open the location details.
    openButton.addEventListener("click", () => {
        if (!locationDialog.open) {
            locationDialog.showModal();
        }
    });

    // Close using the X button.
    closeButton.addEventListener("click", () => {
        locationDialog.close();
    });

    // Close when clicking the shaded area outside the popup.
    locationDialog.addEventListener("click", (event) => {
        if (event.target !== locationDialog) {
            return;
        }

        const bounds = locationDialog.getBoundingClientRect();

        const clickedOutside =
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom;

        if (clickedOutside) {
            locationDialog.close();
        }
    });

    // Return keyboard focus after closing.
    // Pressing Escape also closes the popup automatically.
    locationDialog.addEventListener("close", () => {
        openButton.focus();
    });
})();