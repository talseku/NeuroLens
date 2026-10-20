<h1 align="center"> NeuroLens </h1>

<p align="center">
Facial expressions are a small part of a conversation, but they can carry a lot of meaning. For neurodivergent individuals, especially younger users, interpreting those cues while following a conversation can be challenging. NeuroLens is an assistive smart glasses project that uses computer vision to make facial expressions easier to recognize. A Raspberry Pi camera captures faces, an emotion recognition model analyzes their expressions, and a companion web app presents the results through simple emojis, colors, and percentage scores.
</p>

---

## Features ✅

- **Live Emotion Detection** → Facial expressions classified from the Raspberry Pi camera feed.
- **Emotion Dashboard** → A central ring with the leading prediction, an emoji, and its percentage score.
- **Secondary Expressions** → Two additional predictions displayed below the main result.
- **Connection Feedback** → Live status, automatic reconnection on Home, and a manual retry button.
- **High-Contrast Mode** → A display preference saved in the browser across the main pages.

The model recognizes seven expression categories:

**Happy · Sad · Angry · Fear · Surprise · Disgust · Neutral**

---

## How It Works 🔍

```text
Camera on glasses
       │
       ▼
Raspberry Pi
  OpenCV face detection
  48 × 48 grayscale face crops
  NumPy emotion inference
       │
       │  WebSocket · port 8765
       ▼
Browser dashboard
  Primary expression + two secondary scores
```

Face detection uses OpenCV's Haar cascade. Each detected face is cropped, contrast-adjusted, and resized before passing through a convolutional neural network implemented with NumPy. The server sends expression labels, percentage scores, and face coordinates as JSON; the current stream carries results rather than camera images.

---

## Tech Stack 💻

<details>
<summary><strong>📱 Frontend</strong></summary>

- **HTML & CSS** → Landing page, account screens, live dashboards, and settings.
- **JavaScript** → Live dashboard updates and saved display preferences.
- **WebSockets** → Receives expression results from the Pi without refreshing the page.

</details>

<details>
<summary><strong>👀 Vision & Recognition</strong></summary>

- **Python** → Camera processing and the WebSocket server.
- **OpenCV** → Haar cascade face detection and image preprocessing.
- **NumPy** → Convolutional neural network inference and expression scores.

</details>

<details>
<summary><strong>🔌 Hardware</strong></summary>

- **Raspberry Pi** → Runs face detection and emotion inference.
- **Camera Module** → Captures the faces in view of the glasses.
- **Picamera2** → Connects the camera to the Python backend.

</details>

<details>
<summary><strong>🎨 Interface Design</strong></summary>

- **Comfortaa** → Rounded typography throughout the app.
- **Lucide** → Navigation icons.
- **CSS** → Rose-to-blue backgrounds, emotion colors, and responsive layouts.
- **High-Contrast Theme** → An optional display setting saved in the browser.

</details>

---

## Project Structure 📂

<details>
<summary><strong>Around the repository</strong></summary>

```text
NeuroLens/
├── backend/
│   ├── server.py                       # Camera, inference, and WebSocket server
│   └── haarcascade_frontalface_default.xml
├── frontend/
│   ├── pages/
│   │   ├── index.html                  # Landing page
│   │   ├── signin.html
│   │   ├── signup.html
│   │   ├── home.html                   # Main live dashboard
│   │   ├── emotion_display.html        # Alternate live dashboard
│   │   └── settings.html
│   ├── styles/                        # Page styles and high-contrast theme
│   ├── home.js                        # Main dashboard client
│   ├── emotion_client.js              # Alternate dashboard client
│   ├── contrast.js                    # Saved display preference
│   └── index.js                       # Earlier image-upload client
├── RUN_ON_PI.md
└── setup.py
```

</details>

---

## Getting Started 🚀

For live detection, you'll need a Raspberry Pi running Raspberry Pi OS, a camera supported by Picamera2, and a browser on the same network.

<details>
<summary><strong>🔧 Run on the Raspberry Pi</strong></summary>

### 1. Add the model

The trained weights are **not included in this repository**. Place the compatible model file here before starting the backend:

```text
backend/emotion_weights.npy
```

### 2. Prepare the Pi

From your local copy of the repository:

```bash
sudo apt update
sudo apt install -y python3-picamera2 python3-opencv python3-venv
python3 -m venv --system-site-packages .venv
source .venv/bin/activate
python -m pip install numpy websockets
```

The virtual environment uses the system packages so it can access Picamera2 and OpenCV installed through `apt`.

### 3. Start the live feed

From the repository root, with the environment activated:

```bash
python backend/server.py
```

In a second terminal, also from the repository root, serve the frontend:

```bash
python3 -m http.server 8080 --directory frontend
```

Open `http://<raspberry-pi-ip>:8080/pages/home.html` in your browser, replacing `<raspberry-pi-ip>` with your Pi's address. You can also use `http://neurolens.local:8080/pages/home.html` if your Pi is configured with that hostname.

The dashboard connects to the same host on port `8765`. The landing page is at `/pages/index.html`, and the alternate live display is at `/pages/emotion_display.html`.

</details>

<details>
<summary><strong>🖥️ Preview without the hardware</strong></summary>

From the repository root, serve the frontend:

```bash
python3 -m http.server 8080 --directory frontend
```

Set `DEMO_MODE` to `true` in `frontend/home.js`, then open `http://localhost:8080/pages/home.html`. Demo mode generates random scores for layout previews. Set it back to `false` for live detection.

</details>

---

## Project Notes 📝

- Both live dashboards display the first face returned by the detector.
- Expression scores represent the model's predictions; a facial expression alone does not establish what someone feels.
- Sign-in and sign-up are demonstration screens that navigate to Home. Account authentication and database storage are outside the delivered scope.
- The trained model weights must be supplied separately to run live detection.
