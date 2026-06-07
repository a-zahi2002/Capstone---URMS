import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS
                ? process.env.ALLOWED_ORIGINS.split(',')
                : ['http://localhost:3000', 'http://127.0.0.1:3000'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // Client joins a specific room based on user ID to receive targeted notifications
        socket.on('join_user_room', (userId: string) => {
            const roomName = `user_${userId}`;
            socket.join(roomName);
            console.log(`[Socket] Client ${socket.id} joined room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized!');
    }
    return io;
};

/**
 * Send a notification to a specific user
 */
export const sendNotificationToUser = (userId: string, event: string, payload: any) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, payload);
    }
};

/**
 * Send a notification to all connected clients
 */
export const broadcastNotification = (event: string, payload: any) => {
    if (io) {
        io.emit(event, payload);
    }
};
