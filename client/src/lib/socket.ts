// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        // console.error('Token not available in sessionStorage');
        return;
    } else {
        // console.log('TOKEN initialized')
    }

    socket = io("http://localhost:3000", {
        auth: {
            token: token,
        },
        transports: ["websocket"],
        withCredentials: true,
        reconnectionAttempts: 5,
        timeout: 10000,
    });

    socket.on('connect', () => {
        // console.log('Socket connected');
    });

    socket.on('disconnect', () => {
        // console.log('Socket disconnected');
    });

    return socket;
};

export const getAnonymousSocket = () : Socket | null => {
    const anonymousSocket : Socket = io("http://localhost:3000", {
        transports: ["websocket"],
        withCredentials: true,
        reconnectionAttempts: 5,
        timeout: 10000,
    });
    return anonymousSocket;
}

export const getSocket = (): Socket | null => {
    return socket;
};