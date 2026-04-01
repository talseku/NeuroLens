import asyncio
import websockets

# initialize empty set of websocket clients
ws_clients = set()

async def ws_handler(websocket):
    ws_clients.add(websocket)
    print(f"Client connected ({len(ws_clients)} total)")
    
    try:
        async for message in websocket:
            # Just relay messages to all other clients
            for client in ws_clients:
                if client != websocket:
                    await client.send(message)
    finally:
        ws_clients.remove(websocket)
        print(f"Client disconnected ({len(ws_clients)} total)")

async def main():
    async with websockets.serve(ws_handler, "0.0.0.0", 8765):
        print("WebSocket server started on ws://0.0.0.0:8765")
        await asyncio.Future()

asyncio.run(main())
