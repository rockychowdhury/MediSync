from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.websocket_manager import ws_manager
from app.api.deps import get_current_user_ws

router = APIRouter()


@router.websocket("/{channel}")
async def websocket_endpoint(
    websocket: WebSocket, 
    channel: str,
    user_payload: dict | None = Depends(get_current_user_ws)
):

    """
    Connect to a specific WebSocket channel.
    Available channels:
    - provider:{id}
    - queue:{id}
    - waitlist:{service_id}
    - dashboard:global
    """
    await ws_manager.subscribe(websocket, channel)
    
    if user_payload is None:
        # Auth failed (logged in deps.py); close with policy violation
        from fastapi import status
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        await ws_manager.unsubscribe(websocket, channel)
        return

    try:

        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data.lower() == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.unsubscribe(websocket, channel)
