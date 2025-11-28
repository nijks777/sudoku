'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

console.log('🔌 Socket URL:', SOCKET_URL);

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('N/A');

  useEffect(() => {
    console.log('useSocket effect running...');

    // Initialize socket connection only once
    if (!socket) {
      console.log('Creating new socket connection to:', SOCKET_URL);
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      console.log('Socket instance created:', socket);

      // Connection event handlers
      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
        setIsConnected(true);
        setTransport(socket?.io.engine.transport.name || 'N/A');
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setIsConnected(false);
      });

      socket.io.engine.on('upgrade', (transport) => {
        console.log('🔄 Transport upgraded to:', transport.name);
        setTransport(transport.name);
      });
    } else {
      console.log('Socket already exists, checking connection status...');
      if (socket.connected) {
        console.log('Socket is already connected');
        setIsConnected(true);
      }
    }

    // Cleanup on unmount
    return () => {
      console.log('useSocket cleanup');
    };
  }, []);

  return {
    socket,
    isConnected,
    transport,
  };
};

// Export socket instance for direct access if needed
export const getSocket = () => socket;
