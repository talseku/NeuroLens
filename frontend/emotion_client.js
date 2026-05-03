const DEMO_MODE = false;

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
    angry:    '#ff5a6a', // warm coral red, less harsh than pure red
    disgust:  '#6fcf97', // muted mint green, slightly earthy
    fear:     '#8b7cf6', // lavender-indigo, keeps it airy not heavy
    happy:    '#ffd166', // soft golden amber, sunny but not neon
    neutral:  '#a7b0b8', // cool fog gray-blue, unobtrusive anchor
    sad:      '#5fa8d3', // softened sky blue, emotional but calm
    surprise: '#ff9f68', // peach-orange glow, more “spark” than “alarm”
};

let socket;

function connect() {
    const dot  = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const btn  = document.getElementById('retryBtn');

    if (DEMO_MODE) {
        text.textContent = 'Demo Mode';
        dot.className = 'status-dot connected';
        btn.style.display = 'none';
        startDemoStream();
        return;
    }

    text.textContent = 'Connecting…';
    dot.className = 'status-dot';

    socket = new WebSocket(`ws://${window.location.hostname || 'neurolens.local'}:8765`);

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

function startDemoStream() {
    setInterval(() => {
        renderFaces([generateFakeFace()]);
    }, 1200);
}

function generateFakeFace() {
    const emotions = ['angry','disgust','fear','happy','neutral','sad','surprise'];
    const scores = {};
    let total = 0;

    emotions.forEach(e => {
        const val = Math.random();
        scores[e] = val;
        total += val;
    });

    emotions.forEach(e => {
        scores[e] = +(scores[e] / total * 100).toFixed(1);
    });

    const dominant = Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0];

    return { emotion: dominant, scores, region: { x:0, y:0, w:100, h:100 } };
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
    container.innerHTML = buildDashboard(faces[0]);
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function buildDashboard(face) {
    const { emotion, scores } = face;
    const emoji = EMOTION_EMOJI[emotion] || '❓';
    const color = EMOTION_COLOR[emotion] || '#aaa';
    const dominantPct = scores[emotion] || 0;

    const others = Object.entries(scores)
        .filter(([name]) => name !== emotion)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

    const otherHTML = others.map(([name, pct]) => {
        // proximity 0–1: how close this emotion is to the dominant score
        const proximity = dominantPct > 0 ? pct / dominantPct : 0;
        // background alpha ramps from 0.08 (far) to 0.45 (nearly tied)
        const alpha = (0.08 + proximity * 0.37).toFixed(2);
        const pillColor = hexToRgba(EMOTION_COLOR[name] || '#aaa', alpha);
        // border opacity also scales so the pill edge gets more vivid when close
        const borderAlpha = (0.2 + proximity * 0.6).toFixed(2);
        const borderColor = hexToRgba(EMOTION_COLOR[name] || '#aaa', borderAlpha);
        return `
        <div class="emotion-pill" style="background:${pillColor}; border: 1.5px solid ${borderColor};">
            <span>${EMOTION_EMOJI[name] || '•'} ${name}</span>
            <span>${pct}%</span>
        </div>`;
    }).join('');

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
