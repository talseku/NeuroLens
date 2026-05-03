const DEMO_MODE = false;

const EMOTION_EMOJI = {
    angry: '😠',
    disgust: '🤢',
    fear: '😨',
    happy: '😊',
    neutral: '😐',
    sad: '😢',
    surprise: '😲',
};

const EMOTION_CLASS = {
    angry: 'emotion-angry',
    disgust: 'emotion-disgust',
    fear: 'emotion-fear',
    happy: 'emotion-happy',
    neutral: 'emotion-neutral',
    sad: 'emotion-sad',
    surprise: 'emotion-surprise',
};

let socket;
let reconnectTimer;

function getWebSocketUrl() {
    // When opened from the Raspberry Pi hostname, connect back to that same host.
    // When opened as a local file, fall back to Natalia's Pi hostname.
    const host = window.location.hostname || 'neurolens.local';
    return `ws://${host}:8765`;
}

function setStatus(label, state) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const retryBtn = document.getElementById('retryBtn');

    if (statusText) statusText.textContent = label;
    if (statusDot) statusDot.className = `status-dot ${state || ''}`.trim();
    if (retryBtn) retryBtn.style.display = state === 'disconnected' ? 'inline-block' : 'none';
}

function connect() {
    clearTimeout(reconnectTimer);

    if (socket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(socket.readyState)) {
        socket.close();
    }

    if (DEMO_MODE) {
        setStatus('Demo Mode', 'connected');
        startDemoStream();
        return;
    }

    setStatus('Connecting…', '');
    socket = new WebSocket(getWebSocketUrl());

    socket.onopen = () => setStatus('Connected', 'connected');

    socket.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            renderFaces(payload.faces || []);
        } catch (error) {
            console.error('Bad emotion payload:', error, event.data);
        }
    };

    socket.onclose = () => {
        setStatus('Disconnected', 'disconnected');
        renderFaces([]);
        reconnectTimer = setTimeout(connect, 3000);
    };

    socket.onerror = () => {
        setStatus('Disconnected', 'disconnected');
    };
}

function startDemoStream() {
    setInterval(() => renderFaces([generateFakeFace()]), 1200);
}

function generateFakeFace() {
    const emotions = Object.keys(EMOTION_EMOJI);
    const scores = {};
    let total = 0;

    emotions.forEach((emotion) => {
        const val = Math.random();
        scores[emotion] = val;
        total += val;
    });

    emotions.forEach((emotion) => {
        scores[emotion] = +(scores[emotion] / total * 100).toFixed(1);
    });

    const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return { emotion: dominant, scores, region: { x: 0, y: 0, w: 100, h: 100 } };
}

function renderFaces(faces) {
    const emptyState = document.getElementById('emptyState');
    const mainContent = document.getElementById('emotionContent');

    if (!faces || faces.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';

    updateEmotionUI(toDashboardData(faces[0]));
}

function toDashboardData(face) {
    const scores = face.scores || {};
    const primaryEmotion = (face.emotion || Object.keys(scores)[0] || 'neutral').toLowerCase();

    const sorted = Object.entries(scores)
        .map(([label, percent]) => ({
            label,
            percent: Number(percent) || 0,
            emoji: EMOTION_EMOJI[label] || '•',
        }))
        .sort((a, b) => b.percent - a.percent);

    const primary = sorted.find((item) => item.label === primaryEmotion) || sorted[0] || {
        label: 'neutral',
        percent: 0,
        emoji: EMOTION_EMOJI.neutral,
    };

    const secondary = sorted
        .filter((item) => item.label !== primary.label)
        .slice(0, 2);

    while (secondary.length < 2) {
        secondary.push({ label: '', percent: 0, emoji: '' });
    }

    return {
        primary: {
            label: primary.label,
            percent: primary.percent,
            emoji: primary.emoji,
        },
        secondary,
    };
}

function updateEmotionUI(data) {
    const circle = document.querySelector('.emotion-circle');
    if (!circle) return;

    circle.classList.remove(...Object.values(EMOTION_CLASS));

    const emotion = (data.primary.label || 'neutral').toLowerCase();
    circle.classList.add(EMOTION_CLASS[emotion] || EMOTION_CLASS.neutral);

    document.getElementById('emotionFace').textContent = data.primary.emoji || '';
    document.getElementById('emotionPercent').textContent = `${data.primary.percent}%`;
    document.getElementById('emotionLabel').textContent = data.primary.label || '';

    document.getElementById('secondaryEmotion1Emoji').textContent = data.secondary[0].emoji || '';
    document.getElementById('secondaryEmotion1Name').textContent = data.secondary[0].label || '';
    document.getElementById('secondaryEmotion1Percent').textContent = data.secondary[0].label ? `${data.secondary[0].percent}%` : '';

    document.getElementById('secondaryEmotion2Emoji').textContent = data.secondary[1].emoji || '';
    document.getElementById('secondaryEmotion2Name').textContent = data.secondary[1].label || '';
    document.getElementById('secondaryEmotion2Percent').textContent = data.secondary[1].label ? `${data.secondary[1].percent}%` : '';
}

window.addEventListener('DOMContentLoaded', connect);
