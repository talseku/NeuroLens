# Run NeuroLens on the Raspberry Pi

This branch is wired so the Raspberry Pi backend streams emotion results over WebSocket and the Home page updates live.

## 1. Required files

`backend/server.py` expects this model file:

```text
backend/emotion_weights.npy
```

That file was not included in either zip I received. Copy it into `backend/` before running.

## 2. Install dependencies

On Raspberry Pi OS:

```bash
sudo apt update
sudo apt install -y python3-picamera2 python3-opencv
python3 -m pip install numpy websockets
```

## 3. Start the backend

```bash
cd NeuroLens-wired
python3 backend/server.py
```

The backend listens on:

```text
ws://0.0.0.0:8765
```

## 4. Open the frontend

Serve the frontend folder from the Pi:

```bash
cd frontend
python3 -m http.server 8080
```

Then open one of these in a browser on the same network:

```text
http://neurolens.local:8080/pages/home.html
http://<raspberry-pi-ip>:8080/pages/home.html
```

The frontend connects back to the same hostname on port `8765`, so it works with either `neurolens.local` or the Pi IP address.

## What changed

- Replaced the placeholder `home.js` with Natalia's working WebSocket-driven update flow.
- The Home page now reads backend payloads shaped like:

```json
{
  "faces": [
    {
      "emotion": "happy",
      "scores": { "happy": 71.2, "neutral": 18.1 },
      "region": { "x": 10, "y": 20, "w": 100, "h": 100 }
    }
  ]
}
```

- Added live connection status and retry button.
- Kept Natalia's full `emotion_display.html` and `emotion_client.js` as an alternate live dashboard page.
