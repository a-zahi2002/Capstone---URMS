/**
 * smsService.ts
 * ─────────────────────────────────────────────────────────────
 * Twilio-based SMS notification service.
 * Supports duplicate prevention and asynchronous delivery logging.
 * ─────────────────────────────────────────────────────────────
 */
import { supabase } from '../config/supabaseClient';

export interface SendSMSOptions {
  toPhone: string;
  body: string;
  userId: string;
}

/**
 * Checks if a duplicate SMS was recently sent (within the last 2 minutes).
 */
async function checkDuplicate(userId: string, body: string): Promise<boolean> {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('sms_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('body', body)
      .gte('created_at', twoMinutesAgo)
      .limit(1);

    if (error) {
      console.error('[SMS] Error checking duplicate logs:', error.message);
      return false;
    }

    return (data && data.length > 0) || false;
  } catch (err) {
    console.error('[SMS] Exception during duplicate check:', err);
    return false;
  }
}

/**
 * Logs the SMS delivery status to the database.
 */
async function logSMSDelivery(
  userId: string,
  phone: string,
  body: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('sms_logs')
      .insert({
        user_id: userId,
        phone,
        body,
        status,
        error_message: errorMessage || null
      });

    if (error) {
      console.error('[SMS] Failed to write delivery log to Supabase:', error.message);
    }
  } catch (err) {
    console.error('[SMS] Exception writing delivery log:', err);
  }
}

/**
 * Sends an SMS using the Twilio API.
 * Runs asynchronously and logs the delivery status.
 */
export async function sendSMS(options: SendSMSOptions): Promise<boolean> {
  const { toPhone, body, userId } = options;

  // Clean target number (E.164 format)
  let formattedTo = toPhone.trim();
  if (!formattedTo.startsWith('+')) {
    formattedTo = '+' + formattedTo.replace(/\D/g, '');
  }

  // Twilio credentials from environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️ [SMS] Twilio credentials not configured. SMS sending is disabled.');
    await logSMSDelivery(userId, formattedTo, body, 'failed', 'Twilio credentials not configured');
    return false;
  }

  // Prevent duplicate notifications
  const isDuplicate = await checkDuplicate(userId, body);
  if (isDuplicate) {
    console.log(`[SMS] Duplicate prevention triggered. Skipping SMS to user ${userId}.`);
    return false;
  }

  // Run actual HTTP request asynchronously so it doesn't block the caller
  (async () => {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', formattedTo);
      params.append('From', fromNumber);
      params.append('Body', body);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const resData = await response.json();

      if (!response.ok) {
        const errorMsg = resData.message || 'Unknown Twilio error';
        console.error(`❌ [SMS] Twilio sending failed:`, resData);
        await logSMSDelivery(userId, formattedTo, body, 'failed', errorMsg);
        return;
      }

      console.log(`✅ [SMS] Sent to ${formattedTo} — SID: ${resData.sid}`);
      await logSMSDelivery(userId, formattedTo, body, 'sent');
    } catch (err: any) {
      console.error('❌ [SMS] Uncaught error during async send:', err.message);
      await logSMSDelivery(userId, formattedTo, body, 'failed', err.message);
    }
  })();

  // Return true immediately since the send is asynchronous (non-blocking)
  return true;
}

/**
 * Dispatches an SMS alert for High priority maintenance tickets.
 * Sends to the assigned technician if set, otherwise to all users with maintenance role.
 */
export async function triggerCriticalMaintenanceSMS(
  ticketId: string,
  assignedTo: string | null | undefined,
  resourceId: string,
  title: string,
  client: any
): Promise<void> {
  try {
    // 1. Fetch resource name
    const { data: resourceData } = await client
      .from('resources')
      .select('name')
      .eq('id', resourceId)
      .maybeSingle();
    const resourceName = resourceData?.name || 'Unknown Resource';

    const smsBody = `🚨 CRITICAL MAINTENANCE ALERT: "${title}" reported for ${resourceName}. Ticket: ${String(ticketId).slice(0, 8)}`;

    if (assignedTo) {
      // Send to assigned technician
      const { data: userData } = await client
        .from('users')
        .select('phone')
        .eq('id', assignedTo)
        .maybeSingle();

      if (userData?.phone) {
        await sendSMS({ toPhone: userData.phone, body: smsBody, userId: assignedTo });
      }
    } else {
      // Send to all maintenance staff
      const { data: staffList } = await client
        .from('users')
        .select('id, phone')
        .eq('role', 'maintenance');

      if (staffList && staffList.length > 0) {
        for (const staff of staffList) {
          if (staff.phone) {
            // Send asynchronously
            sendSMS({ toPhone: staff.phone, body: smsBody, userId: staff.id }).catch(err =>
              console.error(`[SMS] Failed to send to maintenance staff ${staff.id}:`, err)
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('[SMS] Error triggering critical maintenance SMS:', err);
  }
}

