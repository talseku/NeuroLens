const EMOTION_EMOJI = {
    angry:    '😠',
    disgust:  '🤢',
    fear:     '😨',
    happy:    '😊',
    neutral:  '😐',
    sad:      '😢',
    surprise: '😲',
};

const EMOTION_COLOR = {
    angry:    '#e05c5c',
    disgust:  '#6dbf7e',
    fear:     '#9b7fd4',
    happy:    '#f5c842',
    neutral:  '#9eaab5',
    sad:      '#5b8fcf',
    surprise: '#f0904a',
};

let socket;

function connect() {
    const dot  = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const btn  = document.getElementById('retryBtn');

    text.textContent = 'Connecting…';
    dot.className = 'status-dot';

    socket = new WebSocket('ws://localhost:8765');

    socket.onopen = () => {
        text.textContent = 'Connected';
        dot.className = 'status-dot connected';
        btn.style.display = 'none';
    };

    socket.onmessage = (event) => {
        const { faces } = JSON.parse(event.data);
        renderFaces(faces);
    };

    socket.onclose = socket.onerror = () => {
        text.textContent = 'Disconnected';
        dot.className = 'status-dot disconnected';
        btn.style.display = 'inline-block';
        renderFaces([]);
    };
}

function renderFaces(faces) {
    const container = document.getElementById('facesContainer');
    const empty     = document.getElementById('emptyState');

    if (!faces || faces.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';

    // Use first detected face as primary
    const face = faces[0];
    container.innerHTML = buildDashboard(face);
}

function buildDashboard(face) {
    const { emotion, scores } = face;

    const emoji = EMOTION_EMOJI[emotion] || '❓';
    const color = EMOTION_COLOR[emotion] || '#aaa';
    const dominantPct = scores[emotion] || 0;

    // Sort other emotions (excluding dominant)
    const others = Object.entries(scores)
        .filter(([name]) => name !== emotion)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2); // show top 2

    const otherHTML = others.map(([name, pct]) => `
        <div class="emotion-pill">
            <span>${EMOTION_EMOJI[name] || '•'} ${name}</span>
            <span>${pct}%</span>
        </div>
    `).join('');

    return `
    <div class="dashboard">

        <h1 class="title">Home</h1>
        <p class="subtitle">Overview of your current emotion</p>

        <div class="emotion-ring" style="--accent:${color};">
            <div class="ring-inner">
                <div class="emoji">${emoji}</div>
                <div class="percent">${dominantPct}%</div>
            </div>
        </div>

        <div class="dominant-label">${emotion}</div>

        <div class="other-section">
            <h3>Other Emotions</h3>
            ${otherHTML}
        </div>

    </div>`;
}

window.addEventListener('DOMContentLoaded', connect);