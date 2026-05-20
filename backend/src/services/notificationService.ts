import { SupabaseClient } from "@supabase/supabase-js";

export const sendNotification = async (supabase: SupabaseClient, userId: string, message: string, type: string = 'info', title?: string) => {
    try {
        const payload: any = {
            user_id: userId,
            message,
            type,
            timestamp: new Date().toISOString()
        };
        
        if (title) {
            payload.title = title;
        }

        const { data, error } = await supabase
            .from('notifications')
            .insert([payload])
            .select();
        
        if (error) {
            // Handle case where title column doesn't exist on older db schemas
            if (error.code === '42703' && title) {
                console.warn("Table notifications lacks 'title' column. Retrying insert without 'title'...");
                const fallbackPayload = { ...payload };
                delete fallbackPayload.title;
                const { data: fallbackData, error: retryError } = await supabase
                    .from('notifications')
                    .insert([fallbackPayload])
                    .select();
                if (retryError) throw retryError;
                console.log(`Notification sent to ${userId}: ${message}`);
                return fallbackData?.[0] || null;
            } else {
                throw error;
            }
        }
        console.log(`Notification sent to ${userId}: ${message}`);
        return data?.[0] || null;
    } catch (error) {
        console.error("Error sending notification:", error);
        return null;
    }
};

export const logEmailDelivery = (recipient: string, subject: string, body: string, attachmentName?: string) => {
    console.log(`
======== MOCK EMAIL DELIVERY ========
To: ${recipient}
Subject: ${subject}
Attachment: ${attachmentName || 'None'}
-------------------------------------
${body}
=====================================
`);
};
