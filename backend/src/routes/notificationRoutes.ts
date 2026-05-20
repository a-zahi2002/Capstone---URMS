import { Router, Request, Response } from 'express';
import { sendNotificationToUser, broadcastNotification } from '../services/socketService';
import {
    sendEmail,
    sendWelcomeEmail,
    sendBookingConfirmationEmail,
    sendTicketUpdateEmail,
    sendSystemAlertEmail,
} from '../services/emailService';

const router = Router();

// ─── WebSocket Notification Routes ───────────────────────────

// Trigger a real-time notification to a specific user
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
        read: false,
    });

    res.status(200).json({ success: true, message: `Notification sent to user ${userId}` });
});

// Broadcast a real-time notification to all connected users
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
        read: false,
    });

    res.status(200).json({ success: true, message: 'Notification broadcasted to all users' });
});

// ─── Email Notification Routes ────────────────────────────────

// Send a raw test email
router.post('/email/test', async (req: Request, res: Response) => {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
        res.status(400).json({ error: 'Missing required fields: to, subject, message' });
        return;
    }

    const ok = await sendEmail({
        to,
        subject,
        html: `<p style="font-family:sans-serif;font-size:15px;color:#334155;">${message}</p>`,
    });

    res.status(ok ? 200 : 500).json({
        success: ok,
        message: ok ? `Test email sent to ${to}` : 'Failed to send email — check SMTP config in backend/.env',
    });
});

// Send a welcome email
router.post('/email/welcome', async (req: Request, res: Response) => {
    const { to, userName } = req.body;

    if (!to || !userName) {
        res.status(400).json({ error: 'Missing required fields: to, userName' });
        return;
    }

    const ok = await sendWelcomeEmail(to, userName);
    res.status(ok ? 200 : 500).json({
        success: ok,
        message: ok ? `Welcome email sent to ${to}` : 'Failed to send welcome email',
    });
});

// Send a booking confirmation email
router.post('/email/booking-confirmation', async (req: Request, res: Response) => {
    const { to, userName, resourceName, bookingDate, bookingTime } = req.body;

    if (!to || !userName || !resourceName || !bookingDate || !bookingTime) {
        res.status(400).json({ error: 'Missing required fields: to, userName, resourceName, bookingDate, bookingTime' });
        return;
    }

    const ok = await sendBookingConfirmationEmail(to, userName, resourceName, bookingDate, bookingTime);
    res.status(ok ? 200 : 500).json({
        success: ok,
        message: ok ? `Booking confirmation sent to ${to}` : 'Failed to send booking confirmation email',
    });
});

// Send a maintenance ticket status update email
router.post('/email/ticket-update', async (req: Request, res: Response) => {
    const { to, userName, ticketTitle, newStatus, note } = req.body;

    if (!to || !userName || !ticketTitle || !newStatus) {
        res.status(400).json({ error: 'Missing required fields: to, userName, ticketTitle, newStatus' });
        return;
    }

    const ok = await sendTicketUpdateEmail(to, userName, ticketTitle, newStatus, note);
    res.status(ok ? 200 : 500).json({
        success: ok,
        message: ok ? `Ticket update email sent to ${to}` : 'Failed to send ticket update email',
    });
});

// Send a system alert email (to one or multiple recipients)
router.post('/email/system-alert', async (req: Request, res: Response) => {
    const { to, alertTitle, alertMessage, severity } = req.body;

    if (!to || !alertTitle || !alertMessage) {
        res.status(400).json({ error: 'Missing required fields: to, alertTitle, alertMessage' });
        return;
    }

    const ok = await sendSystemAlertEmail(to, alertTitle, alertMessage, severity || 'info');
    res.status(ok ? 200 : 500).json({
        success: ok,
        message: ok ? 'System alert email sent' : 'Failed to send system alert email',
    });
});

export default router;
