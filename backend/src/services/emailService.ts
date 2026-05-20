/**
 * emailService.ts
 * ─────────────────────────────────────────────────────────────
 * Nodemailer-based email notification service.
 * Configure SMTP credentials in backend/.env before use.
 * ─────────────────────────────────────────────────────────────
 */
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';

// ─── Transporter singleton ────────────────────────────────────
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        console.warn('⚠️  [Email] SMTP credentials not configured. Emails will not be sent.');
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }, // allows self-signed certs in dev
    });

    return transporter;
}

// ─── Types ────────────────────────────────────────────────────
export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

// ─── Base sender ─────────────────────────────────────────────
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
        const transport = getTransporter();
        const from = process.env.EMAIL_FROM || 'URMS UniLink <no-reply@urms.edu>';

        const info: SentMessageInfo = await transport.sendMail({
            from,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || stripHtml(options.html),
        });

        console.log(`✅ [Email] Sent to ${options.to} — MessageId: ${info.messageId}`);
        return true;
    } catch (err) {
        console.error('❌ [Email] Failed to send email:', err);
        return false;
    }
}

// ─── HTML Helpers ─────────────────────────────────────────────
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/** Wraps content in the shared branded shell */
function emailLayout(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>URMS UniLink</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                Uni<span style="color:#a5b4fc;">Link</span>
              </h1>
              <p style="margin:6px 0 0;color:#c7d2fe;font-size:12px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">
                University Resource Management System
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                This email was sent by the URMS UniLink system.<br/>
                If you did not expect this email, please ignore it or contact support.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ─── Template: Welcome ────────────────────────────────────────
export async function sendWelcomeEmail(
    to: string,
    userName: string
): Promise<boolean> {
    const content = `
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:700;">
            Welcome to UniLink, ${userName}! 🎉
        </h2>
        <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
            Your account has been successfully created. You can now log in and start
            browsing and booking university resources.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#2563eb);border-radius:10px;padding:1px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login"
                       style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#4f46e5,#2563eb);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                        Sign In to UniLink →
                    </a>
                </td>
            </tr>
        </table>
        <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
            If you have any questions, reach out to your system administrator.
        </p>`;

    return sendEmail({
        to,
        subject: `Welcome to UniLink, ${userName}!`,
        html: emailLayout(content),
    });
}

// ─── Template: Booking Confirmation ──────────────────────────
export async function sendBookingConfirmationEmail(
    to: string,
    userName: string,
    resourceName: string,
    bookingDate: string,
    bookingTime: string
): Promise<boolean> {
    const content = `
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:700;">
            Booking Confirmed ✅
        </h2>
        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
            Hi ${userName}, your resource booking has been confirmed!
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Resource</p>
                <p style="margin:4px 0 0;color:#1e293b;font-size:16px;font-weight:700;">${resourceName}</p>
            </td></tr>
            <tr><td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Date</p>
                <p style="margin:4px 0 0;color:#1e293b;font-size:16px;font-weight:700;">${bookingDate}</p>
            </td></tr>
            <tr><td style="padding:20px 24px;">
                <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Time Slot</p>
                <p style="margin:4px 0 0;color:#1e293b;font-size:16px;font-weight:700;">${bookingTime}</p>
            </td></tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings"
           style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
            View My Bookings
        </a>`;

    return sendEmail({
        to,
        subject: `Booking Confirmed: ${resourceName} on ${bookingDate}`,
        html: emailLayout(content),
    });
}

// ─── Template: Maintenance Ticket Update ─────────────────────
export async function sendTicketUpdateEmail(
    to: string,
    userName: string,
    ticketTitle: string,
    newStatus: string,
    message?: string
): Promise<boolean> {
    const statusColors: Record<string, string> = {
        open:        '#f59e0b',
        'in-progress': '#3b82f6',
        resolved:    '#10b981',
        closed:      '#6b7280',
    };
    const color = statusColors[newStatus.toLowerCase()] || '#4f46e5';

    const content = `
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:700;">
            Maintenance Ticket Updated 🔧
        </h2>
        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
            Hi ${userName}, your maintenance ticket status has changed.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ticket</p>
                <p style="margin:4px 0 0;color:#1e293b;font-size:16px;font-weight:700;">${ticketTitle}</p>
            </td></tr>
            <tr><td style="padding:20px 24px;${message ? 'border-bottom:1px solid #e2e8f0;' : ''}">
                <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">New Status</p>
                <span style="display:inline-block;margin-top:6px;padding:4px 14px;background:${color}20;color:${color};font-size:13px;font-weight:700;border-radius:999px;text-transform:capitalize;">
                    ${newStatus}
                </span>
            </td></tr>
            ${message ? `<tr><td style="padding:20px 24px;">
                <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Note from Team</p>
                <p style="margin:4px 0 0;color:#1e293b;font-size:15px;line-height:1.6;">${message}</p>
            </td></tr>` : ''}
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/maintenance"
           style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
            View Ticket
        </a>`;

    return sendEmail({
        to,
        subject: `Ticket Update: "${ticketTitle}" is now ${newStatus}`,
        html: emailLayout(content),
    });
}

// ─── Template: System Alert ───────────────────────────────────
export async function sendSystemAlertEmail(
    to: string | string[],
    alertTitle: string,
    alertMessage: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
): Promise<boolean> {
    const severityMap = {
        info:     { color: '#3b82f6', bg: '#eff6ff', label: 'Information',  icon: 'ℹ️' },
        warning:  { color: '#f59e0b', bg: '#fffbeb', label: 'Warning',      icon: '⚠️' },
        critical: { color: '#ef4444', bg: '#fef2f2', label: 'Critical Alert', icon: '🚨' },
    };
    const s = severityMap[severity];

    const content = `
        <div style="background:${s.bg};border-left:4px solid ${s.color};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:${s.color};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                ${s.icon} ${s.label}
            </p>
        </div>
        <h2 style="margin:0 0 12px;color:#1e293b;font-size:22px;font-weight:700;">${alertTitle}</h2>
        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">${alertMessage}</p>
        <p style="margin:0;color:#94a3b8;font-size:13px;">
            Sent at ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
        </p>`;

    return sendEmail({
        to,
        subject: `[URMS ${s.label}] ${alertTitle}`,
        html: emailLayout(content),
    });
}

// ─── Verify SMTP on startup ───────────────────────────────────
export async function verifyEmailConfig(): Promise<void> {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
        console.log('📧 [Email] SMTP not configured — email sending is disabled.');
        return;
    }
    try {
        await getTransporter().verify();
        console.log('✅ [Email] SMTP connection verified successfully.');
    } catch (err) {
        console.warn('⚠️  [Email] SMTP verification failed. Check SMTP credentials in .env:', (err as Error).message);
    }
}
