import supabase from '../config/supabaseClient';
import { getOverviewData, getBookingData } from './analyticsService';
import { generatePDFBuffer, generateExcelBuffer } from './exportService';
import { sendNotification, logEmailDelivery } from './notificationService';
import { ReportSchedule } from '../models/reportSchedule.model';

/**
 * Weekly Report Scheduler
 * Checks every hour for pending reports.
 */
export const startReportScheduler = () => {
    // Run every hour
    const INTERVAL = 60 * 60 * 1000;

    console.log('✅ Automated Weekly Report Scheduler initialized.');

    // Run once on startup after 10 seconds
    setTimeout(() => checkAndRunSchedules(), 10000);

    setInterval(() => {
        checkAndRunSchedules();
    }, INTERVAL);
};

const checkAndRunSchedules = async () => {
    try {
        const now = new Date();
        const currentDay = now.getDay(); // 0-6
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:mm"

        // Fetch enabled schedules
        const { data: schedules, error } = await supabase
            .from('report_schedules')
            .select('*')
            .eq('is_enabled', true);

        if (error) {
            console.error('Error fetching schedules:', error);
            return;
        }

        for (const schedule of (schedules as ReportSchedule[])) {
            // Check if day matches
            if (schedule.delivery_day !== currentDay) continue;

            // Check if time matches (or is past and hasn't run today)
            const scheduleTimePrefix = schedule.delivery_time.substring(0, 5); // HH:mm
            
            // Exact HH:mm match — prevents triggering in the wrong minute of the scheduled hour
            const lastRunDate = schedule.last_run_at ? new Date(schedule.last_run_at).toDateString() : null;
            const today = now.toDateString();

            if (currentTime === scheduleTimePrefix && lastRunDate !== today) {
                console.log(`🚀 Executing scheduled report: ${schedule.id}`);
                await executeSchedule(schedule);
            }
        }
    } catch (error) {
        console.error('Scheduler main loop error:', error);
    }
};

const executeSchedule = async (schedule: ReportSchedule) => {
    try {
        // Calculate date range (previous 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        const rangeLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        const startDateIso = startDate.toISOString();
        const endDateIso = endDate.toISOString();

        for (const type of schedule.report_types) {
            let buffer: Buffer | null = null;
            let filename = `urms-${type}-report-${new Date().toISOString().split('T')[0]}`;

            if (type === 'overview') {
                const data = await getOverviewData(supabase, { startDate: startDateIso, endDate: endDateIso });
                if (schedule.format === 'pdf') {
                    buffer = await generatePDFBuffer({
                        title: 'Weekly System Overview',
                        subtitle: `Period: ${rangeLabel}`,
                        summaryItems: [
                            { label: 'Total Resources', value: data.totalResources },
                            { label: 'Active Bookings', value: data.activeBookings },
                            { label: 'Pending Maintenance', value: data.pendingMaintenanceTasks },
                            { label: 'Resource Utilization', value: `${data.resourceUtilization}%` }
                        ],
                        sections: []
                    });
                    filename += '.pdf';
                } else {
                    buffer = generateExcelBuffer([{
                        name: 'Overview',
                        data: [
                            { Metric: 'Total Resources', Value: data.totalResources },
                            { Metric: 'Active Bookings', Value: data.activeBookings },
                            { Metric: 'Pending Maintenance', Value: data.pendingMaintenanceTasks },
                            { Metric: 'Utilization', Value: data.resourceUtilization }
                        ]
                    }]);
                    filename += '.xlsx';
                }
            } else if (type === 'booking') {
                const data = await getBookingData(supabase, { startDate: startDateIso, endDate: endDateIso });
                if (schedule.format === 'pdf') {
                    buffer = await generatePDFBuffer({
                        title: 'Weekly Booking Statistics',
                        subtitle: `Period: ${rangeLabel}`,
                        sections: [
                            {
                                title: 'Status Distribution',
                                headers: ['Status', 'Count'],
                                rows: Object.entries(data.statusDistribution)
                            }
                        ]
                    });
                    filename += '.pdf';
                } else {
                    buffer = generateExcelBuffer([{
                        name: 'Trends',
                        data: data.trends
                    }]);
                    filename += '.xlsx';
                }
            }

            // Delivery
            if (buffer) {
                for (const recipientId of schedule.recipients) {
                    try {
                        if (recipientId.includes('@')) {
                            // Mock email delivery — replace with nodemailer in production
                            logEmailDelivery(recipientId, `Scheduled Report: ${type}`, `Hello, your weekly ${type} report is attached.`, filename);
                        } else {
                            await sendNotification(supabase, recipientId, `Your scheduled ${type} report for ${rangeLabel} has been generated.`, 'info');
                        }
                    } catch (deliveryErr) {
                        console.error(`Failed to deliver report to ${recipientId}:`, deliveryErr);
                    }
                }
            } else {
                console.warn(`Schedule ${schedule.id}: no buffer generated for type '${type}' — skipping delivery.`);
            }
        }

        // Update last run at
        await supabase
            .from('report_schedules')
            .update({ last_run_at: new Date().toISOString() })
            .eq('id', schedule.id);

        console.log(`✅ Schedule ${schedule.id} completed.`);
    } catch (error) {
        console.error(`Error executing schedule ${schedule.id}:`, error);
    }
};
