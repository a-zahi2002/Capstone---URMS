import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

const VALID_REPORT_TYPES = ['overview', 'booking', 'utilization', 'maintenance'];
const VALID_FORMATS = ['pdf', 'excel'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm

/**
 * GET /api/admin/reports/schedules
 */
export const getSchedules = async (req: AuthRequest, res: Response) => {
    try {
        const { data, error } = await req.supabase
            .from('report_schedules')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ status: "success", data });
    } catch (error: any) {
        console.error("Get Schedules Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * POST /api/admin/reports/schedules
 */
export const createSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { report_types, recipients, delivery_day, delivery_time, format, is_enabled } = req.body;

        // ── Validation ────────────────────────────────────────
        if (!Array.isArray(report_types) || report_types.length === 0) {
            return res.status(400).json({ status: "error", message: "report_types must be a non-empty array." });
        }
        const invalidTypes = report_types.filter((t: string) => !VALID_REPORT_TYPES.includes(t));
        if (invalidTypes.length > 0) {
            return res.status(400).json({ status: "error", message: `Invalid report types: ${invalidTypes.join(', ')}. Valid: ${VALID_REPORT_TYPES.join(', ')}` });
        }
        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ status: "error", message: "recipients must be a non-empty array." });
        }
        const deliveryDayNum = parseInt(delivery_day, 10);
        if (isNaN(deliveryDayNum) || deliveryDayNum < 0 || deliveryDayNum > 6) {
            return res.status(400).json({ status: "error", message: "delivery_day must be an integer 0–6 (Sunday=0, Saturday=6)." });
        }
        if (!delivery_time || !TIME_REGEX.test(delivery_time.substring(0, 5))) {
            return res.status(400).json({ status: "error", message: "delivery_time must be in HH:mm or HH:mm:ss format." });
        }
        if (!VALID_FORMATS.includes(format)) {
            return res.status(400).json({ status: "error", message: `format must be one of: ${VALID_FORMATS.join(', ')}` });
        }

        const { data, error } = await req.supabase
            .from('report_schedules')
            .insert([{
                report_types,
                recipients,
                delivery_day: deliveryDayNum,
                delivery_time: delivery_time.length === 5 ? `${delivery_time}:00` : delivery_time,
                format,
                is_enabled: typeof is_enabled === 'boolean' ? is_enabled : true
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ status: "success", data });
    } catch (error: any) {
        console.error("Create Schedule Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * PATCH /api/admin/reports/schedules/:id
 * Whitelist-protected to prevent mass assignment.
 */
export const updateSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // ── Whitelist allowed update fields ───────────────────
        const allowedFields = ['report_types', 'recipients', 'delivery_day', 'delivery_time', 'format', 'is_enabled'];
        const updates: Record<string, any> = { updated_at: new Date().toISOString() };

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // Validate changed fields
        if (updates.delivery_day !== undefined) {
            const day = parseInt(updates.delivery_day, 10);
            if (isNaN(day) || day < 0 || day > 6) {
                return res.status(400).json({ status: "error", message: "delivery_day must be 0–6." });
            }
            updates.delivery_day = day;
        }
        if (updates.delivery_time !== undefined && !TIME_REGEX.test(updates.delivery_time.substring(0, 5))) {
            return res.status(400).json({ status: "error", message: "delivery_time must be in HH:mm or HH:mm:ss format." });
        }
        if (updates.format !== undefined && !VALID_FORMATS.includes(updates.format)) {
            return res.status(400).json({ status: "error", message: `format must be one of: ${VALID_FORMATS.join(', ')}` });
        }
        if (updates.report_types !== undefined) {
            const invalid = updates.report_types.filter((t: string) => !VALID_REPORT_TYPES.includes(t));
            if (invalid.length > 0) return res.status(400).json({ status: "error", message: `Invalid report types: ${invalid.join(', ')}` });
        }

        const { data, error } = await req.supabase
            .from('report_schedules')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ status: "success", data });
    } catch (error: any) {
        console.error("Update Schedule Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * DELETE /api/admin/reports/schedules/:id
 */
export const deleteSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await req.supabase
            .from('report_schedules')
            .delete()
            .eq('id', id);
        if (error) throw error;
        res.json({ status: "success", message: "Schedule deleted successfully" });
    } catch (error: any) {
        console.error("Delete Schedule Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};
