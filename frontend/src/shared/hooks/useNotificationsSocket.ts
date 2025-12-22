import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

export function useNotificationsSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(`${WEBSOCKET_URL}/notifications`, {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socket.on('notification', (notification) => {
      // Trigger custom event for notification component
      window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
    });

    socket.on('notificationRead', (notificationId) => {
      window.dispatchEvent(new CustomEvent('notificationRead', { detail: notificationId }));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected, socket: socketRef.current };
}
