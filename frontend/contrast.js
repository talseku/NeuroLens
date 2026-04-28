function applyContrastMode() {
    const mode = localStorage.getItem("highContrastMode");

    if (mode === "on") {
        document.body.classList.add("high-contrast");
    } else {
        document.body.classList.remove("high-contrast");
    }
}

function setContrastMode(mode) {
    localStorage.setItem("highContrastMode", mode);
    applyContrastMode();
}

document.addEventListener("DOMContentLoaded", applyContrastMode);