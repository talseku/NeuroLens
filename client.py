import asyncio
import websockets

async def connect_and_send():
    uri = "ws://localhost:8080"
    async with websockets.connect(uri) as websocket:
        message = "Hello, World!"
        await websocket.send(message)
        print(f"Sent: {message}")

        response = await websocket.recv()
        print(f"Received: {response}")

if __name__ == "__main__":
    asyncio.run(connect_and_send())
