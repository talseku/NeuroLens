let socket;

function connect() {
    socket = new WebSocket('ws://localhost:8765');

    socket.onopen = () => {
        document.getElementById('status').textContent = 'Connected';
        document.getElementById('retryBtn').style.display = 'none';
    };

    socket.onmessage = (event) => {
        const { faces } = JSON.parse(event.data);
        const img = document.getElementById('preview');
        img.complete ? drawRectangles(faces) : (img.onload = () => drawRectangles(faces));
        document.getElementById('faces').innerHTML = faces.map((f, i) =>
            `<img src="data:image/jpeg;base64,${f.crop}" width="100" alt="Face ${i + 1}">`
        ).join('');
    };

    socket.onclose = socket.onerror = () => {
        document.getElementById('status').textContent = 'Disconnected';
        document.getElementById('retryBtn').style.display = 'inline';
    };
}

function drawRectangles(faces) {
    const img = document.getElementById('preview');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width  = img.clientWidth;
    canvas.height = img.clientHeight;

    const scaleX = img.clientWidth  / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    faces.forEach(({ x, y, w, h }) => ctx.strokeRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY));
}

function previewImage() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) return;
    document.getElementById('preview').src = URL.createObjectURL(file);
    document.getElementById('previewSection').style.display = 'block';
}

function removeImage() {
    const canvas = document.getElementById('canvas');

    document.getElementById('fileInput').value = '';
    document.getElementById('preview').src = '';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('faces').innerHTML = '';
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

async function uploadImage() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) return alert('Select an image first');
    await fetch('http://localhost:8766', { method: 'POST', body: file });
}

window.addEventListener('DOMContentLoaded', connect);
