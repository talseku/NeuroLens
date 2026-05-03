const EMOTION_EMOJI = {
    angry:    '😠',
    disgust:  '🤢',
    fear:     '😨',
    happy:    '😊',
    neutral:  '😐',
    sad:      '😢',
    surprise: '😲',
};

let socket;

function connect() {
    socket = new WebSocket('ws://neurolens.local:8765');

    socket.onopen = () => {
        console.log('Connected to emotion server.');
    };

    socket.onmessage = (event) => {
        const { faces } = JSON.parse(event.data);
        if (faces && faces.length > 0) {
            const data = mapFaceToEmotionData(faces[0]);
            updateEmotionUI(data);
        }
    };

    socket.onclose = socket.onerror = () => {
        console.warn('Disconnected from emotion server. Retrying in 3s...');
        setTimeout(connect, 3000);
    };
}

/**
 * Maps a face object from server.py into the shape updateEmotionUI() expects:
 * {
 *   primary:   { label, percent, emoji },
 *   secondary: [ { label, percent, emoji }, { label, percent, emoji } ]
 * }
 */
function mapFaceToEmotionData(face) {
    const { emotion, scores } = face;

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    const [primaryName, primaryPct] = sorted[0];
    const secondary = sorted.slice(1, 3).map(([name, pct]) => ({
        label:   capitalize(name),
        percent: pct,
        emoji:   EMOTION_EMOJI[name] || '•',
    }));

    return {
        primary: {
            label:   capitalize(primaryName),
            percent: primaryPct,
            emoji:   EMOTION_EMOJI[primaryName] || '❓',
        },
        secondary,
    };
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateEmotionUI(data) {
    const circle = document.querySelector('.emotion-circle');

    circle.classList.remove(
        'emotion-happy',
        'emotion-sad',
        'emotion-calm',
        'emotion-angry',
        'emotion-neutral',
    );

    const emotion = (data.primary.label || '').toLowerCase();

    if (emotion === 'happy') {
        circle.classList.add('emotion-happy');
    } else if (emotion === 'sad') {
        circle.classList.add('emotion-sad');
    } else if (emotion === 'calm') {
        circle.classList.add('emotion-calm');
    } else if (emotion === 'angry') {
        circle.classList.add('emotion-angry');
    } else {
        circle.classList.add('emotion-neutral');
    }

    document.getElementById('emotionFace').textContent    = data.primary.emoji   || '';
    document.getElementById('emotionPercent').textContent = `${data.primary.percent}%`;
    document.getElementById('emotionLabel').textContent   = data.primary.label   || '';

    document.getElementById('secondaryEmotion1Emoji').textContent   = data.secondary[0].emoji   || '';
    document.getElementById('secondaryEmotion1Name').textContent    = data.secondary[0].label   || '';
    document.getElementById('secondaryEmotion1Percent').textContent = `${data.secondary[0].percent}%`;

    document.getElementById('secondaryEmotion2Emoji').textContent   = data.secondary[1].emoji   || '';
    document.getElementById('secondaryEmotion2Name').textContent    = data.secondary[1].label   || '';
    document.getElementById('secondaryEmotion2Percent').textContent = `${data.secondary[1].percent}%`;
}

window.addEventListener('DOMContentLoaded', connect);