<div align="center">

# 👓 NeuroLens

A smart glasses companion that turns facial expressions into simple, live visual cues.<br>
Designed with neurodivergent people, especially younger users, in mind.

**Python** &nbsp; / &nbsp; **OpenCV** &nbsp; / &nbsp; **Raspberry Pi** &nbsp; / &nbsp; **WebSockets**

</div>

---

## About the Project 🌱

Conversations move quickly. A smile, a raised eyebrow, or a change in expression can carry meaning before anyone says a word. Those cues can be difficult to interpret, especially while keeping up with the conversation itself.

NeuroLens explores how a camera module mounted on glasses and a companion app can make those cues easier to follow. The Raspberry Pi processes camera frames and sends facial expression estimates to a browser, where an emoji, a color, and a percentage make the results easy to glance at.

The project is a prototype. Its scores describe the model's interpretation of a facial expression; they don't establish what someone actually feels.

## Features ✅

- **Live Emotion Detection** → Facial expressions classified from the Raspberry Pi camera feed.
- **Emotion Dashboard** → A central ring with the leading prediction, an emoji, and its percentage score.
- **Secondary Expressions** → Two additional predictions displayed below the main result.
- **Connection Feedback** → Live status, automatic reconnection on Home, and a manual retry button.
- **High-Contrast Mode** → A display preference saved in the browser across the main pages.

The model recognizes seven expression categories:

**Happy · Sad · Angry · Fear · Surprise · Disgust · Neutral**

The interface currently carries the name **NeuroGlasses**. Both live dashboards display the first face returned by the detector.

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

## Tech Stack 💻

| Area | Technologies |
| :--- | :--- |
| **Frontend** | HTML, CSS, JavaScript |
| **Vision & Inference** | Python, OpenCV, NumPy |
| **Hardware** | Raspberry Pi, Picamera2-compatible camera |
| **Live Communication** | WebSockets, JSON |
| **Interface Design** | Comfortaa typography, Lucide icons, high-contrast theme |

The frontend uses a soft rose-to-blue palette and runs without a build step.

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

## Getting Started 🚀

For live detection, you'll need a Raspberry Pi running Raspberry Pi OS, a camera supported by Picamera2, and a browser on the same network.

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

### Preview without the hardware

You can serve the frontend on your computer using the same HTTP server command. To preview the Home dashboard without a Pi or model, set `DEMO_MODE` to `true` in `frontend/home.js`, then open `http://localhost:8080/pages/home.html`. Demo mode generates random scores for layout previews. Set it back to `false` for live detection.
