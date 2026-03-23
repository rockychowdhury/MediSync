from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import ws_manager

router = APIRouter()


@router.websocket("/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    """
    Connect to a specific WebSocket channel.
    Available channels:
    - provider:{id}
    - queue:{id}
    - waitlist:{service_id}
    - dashboard:global
    """
    await ws_manager.subscribe(websocket, channel)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data.lower() == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.unsubscribe(websocket, channel)
