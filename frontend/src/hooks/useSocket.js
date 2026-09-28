import { useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';

export const useSocket = () => useContext(SocketContext);

// Subscribe to one or more socket events; handler always sees latest closure
export const useSocketEvents = (events, handler) => {
  const socket = useSocket();
  const ref = useRef(handler);
  ref.current = handler;
  const key = [].concat(events).join('|');

  useEffect(() => {
    if (!socket) return undefined;
    const list = key.split('|');
    const fn = (payload) => ref.current(payload);
    list.forEach((e) => socket.on(e, fn));
    return () => list.forEach((e) => socket.off(e, fn));
  }, [socket, key]);
};
