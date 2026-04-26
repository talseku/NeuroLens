function applySavedContrastMode() {
    const savedContrastMode = localStorage.getItem("highContrastMode") || "Off";

    if (savedContrastMode === "On") {
        document.body.classList.add("high-contrast");
    } else {
        document.body.classList.remove("high-contrast");
    }
}

function setContrastMode(mode) {
    localStorage.setItem("highContrastMode", mode);
    applySavedContrastMode();
}

document.addEventListener("DOMContentLoaded", () => {
    applySavedContrastMode();
});