import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'];

    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (/\.vercel\.app$/.test(origin)) return callback(null, true);
                if (allowedOrigins.includes(origin)) return callback(null, true);
                return callback(new Error(`CORS: Origin '${origin}' not allowed`));
            },
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

// Trigger nodemon restart
