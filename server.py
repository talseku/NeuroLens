import asyncio
import websockets

async def echo(websocket):
    # Iterate over incoming messages
    async for message in websocket:
        print(f"Received: {message}")
        # Send the same message back
        await websocket.send(f"Echo: {message}")

async def main():
    # Start the server on localhost:8765
    async with websockets.serve(echo, "localhost", 8080):
        print("Echo server running on ws://localhost:8080")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
