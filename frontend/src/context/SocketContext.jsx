import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    const s = io(SOCKET_URL, {
      // callback form so reconnects pick up a refreshed token
      auth: (cb) => cb({ token: localStorage.getItem('token') }),
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
