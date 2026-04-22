function updateEmotionUI(data) {
    const circle = document.querySelector(".emotion-circle");

    // Reset previous emotion color classes
    circle.classList.remove(
        "emotion-happy",
        "emotion-sad",
        "emotion-calm",
        "emotion-angry",
        "emotion-neutral"
    );

    // Apply ring color based on primary emotion
    const emotion = (data.primary.label || "").toLowerCase();

    if (emotion === "happy") {
        circle.classList.add("emotion-happy");
    } else if (emotion === "sad") {
        circle.classList.add("emotion-sad");
    } else if (emotion === "calm") {
        circle.classList.add("emotion-calm");
    } else if (emotion === "angry") {
        circle.classList.add("emotion-angry");
    } else {
        circle.classList.add("emotion-neutral");
    }

    // Main emotion
    document.getElementById("emotionFace").textContent = data.primary.emoji || "";
    document.getElementById("emotionPercent").textContent = `${data.primary.percent}%`;
    document.getElementById("emotionLabel").textContent = data.primary.label || "";

    // Secondary emotion 1
    document.getElementById("secondaryEmotion1Emoji").textContent = data.secondary[0].emoji || "";
    document.getElementById("secondaryEmotion1Name").textContent = data.secondary[0].label || "";
    document.getElementById("secondaryEmotion1Percent").textContent = `${data.secondary[0].percent}%`;

    // Secondary emotion 2
    document.getElementById("secondaryEmotion2Emoji").textContent = data.secondary[1].emoji || "";
    document.getElementById("secondaryEmotion2Name").textContent = data.secondary[1].label || "";
    document.getElementById("secondaryEmotion2Percent").textContent = `${data.secondary[1].percent}%`;
}

// Placeholder function for now.
// Later, replace this with real hardware/backend results.
function fetchEmotionResults() {
    return {
        primary: {
            label: "Happy",
            percent: 51,
            emoji: "😊"
        },
        secondary: [
            {
                label: "Calm",
                percent: 35,
                emoji: "😌"
            },
            {
                label: "Sad",
                percent: 14,
                emoji: "😢"
            }
        ]
    };
}

const detectedEmotionData = fetchEmotionResults();
updateEmotionUI(detectedEmotionData);