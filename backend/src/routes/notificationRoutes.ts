import { Router, Request, Response } from 'express';
import { sendNotificationToUser, broadcastNotification } from '../services/socketService';

const router = Router();

// Test endpoint to trigger a notification to a specific user
router.post('/test', (req: Request, res: Response) => {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message) {
         res.status(400).json({ error: 'Missing required fields: userId, title, message' });
         return;
    }

    sendNotificationToUser(userId, 'notification', {
        id: new Date().getTime().toString(),
        title,
        message,
        type: type || 'info',
        createdAt: new Date().toISOString(),
        read: false
    });

    res.status(200).json({ success: true, message: `Notification sent to user ${userId}` });
});

// Test endpoint to broadcast a notification to all users
router.post('/broadcast', (req: Request, res: Response) => {
    const { title, message, type } = req.body;

    if (!title || !message) {
         res.status(400).json({ error: 'Missing required fields: title, message' });
         return;
    }

    broadcastNotification('notification', {
        id: new Date().getTime().toString(),
        title,
        message,
        type: type || 'info',
        createdAt: new Date().toISOString(),
        read: false
    });

    res.status(200).json({ success: true, message: 'Notification broadcasted to all users' });
});

export default router;
