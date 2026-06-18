export interface ReportSchedule {
    id: string;
    report_types: string[]; // ['booking', 'usage', 'maintenance', 'overview']
    recipients: string[];   // Array of emails or user IDs
    delivery_day: number;   // 0 (Sunday) to 6 (Saturday)
    delivery_time: string;  // 'HH:mm:ss'
    format: 'pdf' | 'excel';
    is_enabled: boolean;
    last_run_at: string | null;
    created_at: string;
    updated_at: string;
}
