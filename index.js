const ws = new WebSocket("ws://localhost:8080");


ws.onopen = () => {
    console.log("Connected to the WebSocket server");
};

ws.onmessage = (event) => {
    const chatbox = document.getElementById("chatbox");
    const message = document.createElement("div");
    message.textContent = event.data;
    chatbox.appendChild(message);
};

function sendMessage() {
    const input = document.getElementById("message");
    ws.send(input.value);
    input.value = "";
}