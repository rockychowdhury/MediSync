import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


import asyncio

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ConnectionManager:
    """
    Manages WebSocket connections and broadcasts real-time events.
    """
    def __init__(self):
        # Maps channel_name -> set of connected WebSockets
        self.channels: dict[str, set[WebSocket]] = defaultdict(set)
        self.main_loop: asyncio.AbstractEventLoop | None = None

    async def _capture_loop(self):
        if self.main_loop is None:
            self.main_loop = asyncio.get_running_loop()

    async def subscribe(self, websocket: WebSocket, channel: str):
        await self._capture_loop()
        await websocket.accept()
        self.channels[channel].add(websocket)
        logger.debug(f"Client connected to channel: {channel}. Total clients: {len(self.channels[channel])}")

    async def unsubscribe(self, websocket: WebSocket, channel: str):
        if websocket in self.channels[channel]:
            self.channels[channel].discard(websocket)
            logger.debug(f"Client disconnected from channel: {channel}")
            
        # Clean up empty channels
        if not self.channels[channel]:
            del self.channels[channel]

    async def _send_to_socket(self, ws: WebSocket, message: dict) -> bool:
        try:
            await ws.send_text(json.dumps(message, default=str))
            return True
        except WebSocketDisconnect:
            return False
        except Exception as e:
            logger.error(f"Error sending message to WebSocket: {e}")
            return False

    async def broadcast(self, channel: str, event: str, data: dict[str, Any]):
        """
        Broadcast an event to all clients subscribed to a specific channel.
        """
        message = {
            "event": event,
            "data": data,
            "timestamp": utcnow().isoformat(),
            "channel": channel
        }
        
        dead_sockets = []
        for ws in self.channels.get(channel, set()):
            success = await self._send_to_socket(ws, message)
            if not success:
                dead_sockets.append(ws)
                
        # Remove disconnected sockets
        for ws in dead_sockets:
            await self.unsubscribe(ws, channel)

    async def broadcast_multi(self, channels: list[str], event: str, data: dict[str, Any]):
        """
        Broadcast an event to multiple channels simultaneously.
        """
        for channel in channels:
            await self.broadcast(channel, event, data)

    def broadcast_sync(self, channel: str, event: str, data: dict[str, Any]):
        """
        Safely fire a broadcast from a synchronous context (e.g. SQLAlchemy CRUD in a threadpool).
        """
        coro = self.broadcast(channel, event, data)
        try:
            # If we are already in an async context, just create a task
            loop = asyncio.get_running_loop()
            loop.create_task(coro)
        except RuntimeError:
            # We are in a sync thread. Send coroutine to the main event loop
            if self.main_loop and self.main_loop.is_running():
                asyncio.run_coroutine_threadsafe(coro, self.main_loop)


# Singleton instance to be used across the application
ws_manager = ConnectionManager()
