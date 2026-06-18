import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { generatePDFReport, generateExcelReport } from "../services/exportService";
import { exportToGoogleSheets } from "../services/googleSheetsService";
import {
    getOverviewData,
    getBookingData,
    getUtilizationData,
    applyDeptFilter,
    applyDateRangeFilter,
    batchFetchResourceNames
} from "../services/analyticsService";

// ─── Overview ─────────────────────────────────────────────────

export const getOverviewAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { department, startDate, endDate } = req.query as Record<string, string>;
        const data = await getOverviewData(req.supabase, { department, startDate, endDate });
        res.json({ status: "success", data });
    } catch (error: any) {
        console.error("Overview Analytics Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Bookings ─────────────────────────────────────────────────

export const getBookingAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { department, startDate, endDate } = req.query as Record<string, string>;
        const data = await getBookingData(req.supabase, { department, startDate, endDate });
        res.json({ status: "success", data });
    } catch (error: any) {
        console.error("Booking Analytics Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Resources ────────────────────────────────────────────────

export const getResourceAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const supabase = req.supabase;
        const { department, startDate, endDate } = req.query as Record<string, string>;

        // Category distribution
        let resQuery = supabase.from('resources').select('type');
        resQuery = applyDeptFilter(resQuery, department);
        const { data: resourceData } = await resQuery;
        const categoryDistribution: Record<string, number> = {};
        resourceData?.forEach((r: any) => {
            categoryDistribution[r.type] = (categoryDistribution[r.type] || 0) + 1;
        });

        // Top 5 most booked — single name fetch batch
        let bkQuery = supabase.from('bookings').select('resource_id, resources!inner(department)');
        bkQuery = applyDeptFilter(bkQuery, department, 'resources');
        bkQuery = applyDateRangeFilter(bkQuery, startDate, endDate);
        const { data: bookingData } = await bkQuery;

        const counts: Record<string, number> = {};
        bookingData?.forEach((b: any) => counts[b.resource_id] = (counts[b.resource_id] || 0) + 1);
        const top5Ids = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);

        const nameMap = await batchFetchResourceNames(supabase, top5Ids);
        const topResources = top5Ids.map(id => ({ name: nameMap[id] || "Unknown", count: counts[id] }));

        res.json({ status: "success", data: { categoryDistribution, topResources } });
    } catch (error: any) {
        console.error("Resource Analytics Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Maintenance ──────────────────────────────────────────────

export const getMaintenanceAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const supabase = req.supabase;
        const { department, startDate, endDate } = req.query as Record<string, string>;

        let mtQuery = supabase
            .from('maintenance_tickets')
            .select('status, created_at, completed_at, resource_id, resources!inner(department)');
        mtQuery = applyDeptFilter(mtQuery, department, 'resources');
        mtQuery = applyDateRangeFilter(mtQuery, startDate, endDate);
        const { data: ticketData } = await mtQuery;

        const statusDistribution: Record<string, number> = { 'OPEN': 0, 'IN_PROGRESS': 0, 'COMPLETED': 0 };
        let totalCompletionTimeMs = 0;
        let completedCount = 0;
        const resourceMaintenanceCounts: Record<string, number> = {};

        ticketData?.forEach((t: any) => {
            if (statusDistribution[t.status] !== undefined) statusDistribution[t.status]++;
            if (t.status === 'COMPLETED' && t.completed_at) {
                totalCompletionTimeMs += new Date(t.completed_at).getTime() - new Date(t.created_at).getTime();
                completedCount++;
            }
            resourceMaintenanceCounts[t.resource_id] = (resourceMaintenanceCounts[t.resource_id] || 0) + 1;
        });

        const avgCompletionTimeHours = completedCount > 0
            ? Math.round((totalCompletionTimeMs / completedCount) / (1000 * 60 * 60))
            : 0;

        const topMaintainedIds = Object.entries(resourceMaintenanceCounts)
            .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
        const nameMap = await batchFetchResourceNames(supabase, topMaintainedIds);
        const topMaintainedResources = topMaintainedIds.map(id => ({
            name: nameMap[id] || "Unknown",
            count: resourceMaintenanceCounts[id]
        }));

        res.json({ status: "success", data: { statusDistribution, avgCompletionTimeHours, topMaintainedResources } });
    } catch (error: any) {
        console.error("Maintenance Analytics Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Booking Trends ───────────────────────────────────────────

export const getBookingTrends = async (req: AuthRequest, res: Response) => {
    try {
        const supabase = req.supabase;
        const range = (req.query.range as string) || '7d';
        const { startDate, endDate, department } = req.query as Record<string, string>;

        let start = new Date();
        let interval: 'day' | 'month' = 'day';

        if (startDate) {
            start = new Date(startDate);
            if (endDate) {
                const diff = new Date(endDate).getTime() - start.getTime();
                if (diff > 1000 * 60 * 60 * 24 * 90) interval = 'month';
            }
        } else {
            if (range === '30d') { start.setDate(start.getDate() - 30); }
            else if (range === '12m') { start.setFullYear(start.getFullYear() - 1); interval = 'month'; }
            else { start.setDate(start.getDate() - 7); }
        }

        let query = supabase.from('bookings').select('created_at, resources!inner(department)');
        query = applyDeptFilter(query, department, 'resources');
        query = applyDateRangeFilter(query, startDate || start.toISOString(), endDate);
        const { data, error } = await query;
        if (error) throw error;

        const getKey = (date: Date) => interval === 'month'
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            : date.toISOString().split('T')[0];

        const trends: Record<string, number> = {};
        let current = new Date(start);
        const end = endDate ? new Date(endDate) : new Date();
        while (current <= end) {
            trends[getKey(current)] = 0;
            if (interval === 'month') current.setMonth(current.getMonth() + 1);
            else current.setDate(current.getDate() + 1);
        }

        data?.forEach((b: any) => {
            const key = getKey(new Date(b.created_at));
            if (trends[key] !== undefined) trends[key]++;
        });

        const result = Object.entries(trends)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([label, value]) => ({ label, value }));

        res.json({ status: "success", data: result });
    } catch (error: any) {
        console.error("Booking Trends Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Booking Status ───────────────────────────────────────────

export const getBookingStatus = async (req: AuthRequest, res: Response) => {
    try {
        const supabase = req.supabase;
        const { department, startDate, endDate } = req.query as Record<string, string>;

        let query = supabase.from('bookings').select('status, resources!inner(department)');
        query = applyDeptFilter(query, department, 'resources');
        query = applyDateRangeFilter(query, startDate, endDate);
        const { data, error } = await query;
        if (error) throw error;

        // Consistent status set matching getBookingData in analyticsService
        const counts: Record<string, number> = {
            'Pending': 0, 'Approved': 0, 'Completed': 0, 'Cancelled': 0, 'Rejected': 0
        };
        data?.forEach((b: any) => { if (counts[b.status] !== undefined) counts[b.status]++; });

        res.json({ status: "success", data: counts });
    } catch (error: any) {
        console.error("Booking Status Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Resource Bookings (Top 10, N+1 fixed) ───────────────────

export const getResourceBookings = async (req: AuthRequest, res: Response) => {
    try {
        const supabase = req.supabase;
        const { department, startDate, endDate } = req.query as Record<string, string>;

        let bkQuery = supabase.from('bookings').select('resource_id, resources!inner(department)');
        bkQuery = applyDeptFilter(bkQuery, department, 'resources');
        bkQuery = applyDateRangeFilter(bkQuery, startDate, endDate);
        const { data, error } = await bkQuery;
        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach((b: any) => { counts[b.resource_id] = (counts[b.resource_id] || 0) + 1; });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const ids = sorted.map(([id]) => id);
        const nameMap = await batchFetchResourceNames(supabase, ids);

        const result = sorted.map(([id, count]) => ({ name: nameMap[id] || "Unknown Resource", count }));
        res.json({ status: "success", data: result });
    } catch (error: any) {
        console.error("Resource Bookings Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Category Bookings ────────────────────────────────────────

export const getCategoryBookings = async (req: AuthRequest, res: Response) => {
    try {
        const supabase = req.supabase;
        const { department, startDate, endDate } = req.query as Record<string, string>;

        let bkQuery = supabase.from('bookings').select('resource_id, resources!inner(type, department)');
        bkQuery = applyDeptFilter(bkQuery, department, 'resources');
        bkQuery = applyDateRangeFilter(bkQuery, startDate, endDate);
        const { data, error } = await bkQuery;
        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach((b: any) => {
            const type = (b.resources as any)?.type || 'Other';
            counts[type] = (counts[type] || 0) + 1;
        });

        res.json({ status: "success", data: counts });
    } catch (error: any) {
        console.error("Category Bookings Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Resource Utilization (uses shared service) ───────────────

export const getResourceUtilization = async (req: AuthRequest, res: Response) => {
    try {
        const { department, startDate, endDate, range } = req.query as Record<string, string>;
        const result = await getUtilizationData(req.supabase, { department, startDate, endDate, range });
        res.json({ status: "success", data: result });
    } catch (error: any) {
        console.error("Resource Utilization Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Peak Usage ───────────────────────────────────────────────

export const getPeakUsage = async (req: AuthRequest, res: Response) => {
    try {
        const supabase = req.supabase;
        const { department, startDate, endDate } = req.query as Record<string, string>;

        let bkQuery = supabase
            .from('bookings')
            .select('start_time, resources!inner(department)')
            .in('status', ['Approved', 'Completed']);
        bkQuery = applyDeptFilter(bkQuery, department, 'resources');
        bkQuery = applyDateRangeFilter(bkQuery, startDate, endDate, 'start_time');
        const { data, error } = await bkQuery;
        if (error) throw error;

        const hourDistribution: Record<number, number> = {};
        const dayDistribution: Record<number, number> = {};
        for (let i = 0; i < 24; i++) hourDistribution[i] = 0;
        for (let i = 0; i < 7; i++) dayDistribution[i] = 0;

        data?.forEach((b: any) => {
            const date = new Date(b.start_time);
            hourDistribution[date.getHours()]++;
            dayDistribution[date.getDay()]++;
        });

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        res.json({
            status: "success",
            data: {
                peakHours: Object.entries(hourDistribution).map(([h, count]) => ({
                    hour: parseInt(h), label: `${h}:00`, count
                })),
                peakDays: Object.entries(dayDistribution).map(([d, count]) => ({
                    day: parseInt(d), label: days[parseInt(d)], count
                }))
            }
        });
    } catch (error: any) {
        console.error("Peak Usage Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── PDF Export ───────────────────────────────────────────────

export const exportAnalyticsPDF = async (req: AuthRequest, res: Response) => {
    try {
        const { type = 'overview', range = '7d', startDate, endDate, department } = req.query as Record<string, string>;
        const supabase = req.supabase;
        const now = new Date().toISOString();
        const dateLabel = startDate && endDate ? `${startDate} to ${endDate}` : `Range: ${range}`;
        const deptLabel = department ? `Department: ${department} | ` : '';

        res.setHeader('Content-Type', 'application/pdf');

        if (type === 'overview') {
            const data = await getOverviewData(supabase, { department, startDate, endDate });
            res.setHeader('Content-Disposition', 'attachment; filename="urms-overview-report.pdf"');
            generatePDFReport(res, {
                title: 'URMS System Overview Report',
                subtitle: `${deptLabel}${dateLabel}`,
                summaryItems: [
                    { label: 'Total Resources', value: data.totalResources },
                    { label: 'Active Bookings', value: data.activeBookings },
                    { label: 'Pending Maintenance', value: data.pendingMaintenanceTasks },
                    { label: 'Overall Utilization', value: `${data.resourceUtilization}%` }
                ],
                sections: [{
                    title: 'Quick Summary',
                    headers: ['Metric', 'Current Value'],
                    rows: [
                        ['Total Resources', data.totalResources],
                        ['Active Bookings', data.activeBookings],
                        ['Completed Bookings', data.completedBookings],
                        ['Maintenance Tasks', data.pendingMaintenanceTasks],
                        ['Resource Utilization', `${data.resourceUtilization}%`],
                        ['Most Booked Resource', data.mostBookedResource]
                    ]
                }]
            });

        } else if (type === 'bookings') {
            const bkData = await getBookingData(supabase, { department, startDate, endDate });

            let rfQuery = supabase.from('bookings').select('resource_id, resources!inner(department)');
            rfQuery = applyDeptFilter(rfQuery, department, 'resources');
            rfQuery = applyDateRangeFilter(rfQuery, startDate, endDate);
            const { data: rfRes } = await rfQuery;
            const resCounts: Record<string, number> = {};
            rfRes?.forEach((b: any) => resCounts[b.resource_id] = (resCounts[b.resource_id] || 0) + 1);
            const sorted = Object.entries(resCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
            const nameMap = await batchFetchResourceNames(supabase, sorted.map(([id]) => id));
            const topResources = sorted.map(([id, count]) => [nameMap[id] || 'Unknown', count]);

            res.setHeader('Content-Disposition', 'attachment; filename="urms-bookings-report.pdf"');
            generatePDFReport(res, {
                title: 'URMS Booking Statistics Report',
                subtitle: `${deptLabel}${dateLabel}`,
                sections: [
                    { title: 'Booking Status Distribution', headers: ['Status', 'Count'], rows: Object.entries(bkData.statusDistribution) },
                    { title: 'Top 10 Booked Resources', headers: ['Resource Name', 'Total Bookings'], rows: topResources }
                ]
            });

        } else if (type === 'utilization') {
            const utilData = await getUtilizationData(supabase, { department, startDate, endDate, range });
            const rows = utilData.map((item: any) => [item.name, item.type, item.totalBookings, `${item.totalHours}h`, `${item.utilizationRate}%`]);
            res.setHeader('Content-Disposition', 'attachment; filename="urms-utilization-report.pdf"');
            generatePDFReport(res, {
                title: 'Resource Utilization Report',
                subtitle: `${deptLabel}${dateLabel}`,
                sections: [{ title: 'Detailed Resource Usage', headers: ['Resource', 'Category', 'Total Bookings', 'Hours Used', 'Utilization %'], rows }]
            });

        } else {
            res.status(400).json({ status: "error", message: "Invalid report type. Use: overview, bookings, utilization" });
        }
    } catch (error: any) {
        console.error("PDF Export Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Excel Export ─────────────────────────────────────────────

export const exportAnalyticsExcel = async (req: AuthRequest, res: Response) => {
    try {
        const { type = 'overview', range = '7d', startDate, endDate, department } = req.query as Record<string, string>;
        const supabase = req.supabase;
        const dateLabel = startDate && endDate ? `${startDate} to ${endDate}` : `Range: ${range}`;
        const meta = [
            { 'Report Title': `URMS ${type} Report` },
            { 'Date Range': dateLabel },
            { 'Department': department || 'All' },
            { 'Generated At': new Date().toLocaleString() }
        ];

        if (type === 'overview') {
            const data = await getOverviewData(supabase, { department, startDate, endDate });
            generateExcelReport(res, 'urms-overview.xlsx', [{
                name: 'Summary',
                data: [
                    { Metric: 'Total Resources', Value: data.totalResources },
                    { Metric: 'Active Bookings', Value: data.activeBookings },
                    { Metric: 'Completed Bookings', Value: data.completedBookings },
                    { Metric: 'Pending Maintenance', Value: data.pendingMaintenanceTasks },
                    { Metric: 'Utilization Rate', Value: `${data.resourceUtilization}%` },
                    { Metric: 'Most Booked Resource', Value: data.mostBookedResource },
                    ...meta.map(m => ({ Metric: Object.keys(m)[0], Value: Object.values(m)[0] }))
                ]
            }]);

        } else if (type === 'bookings') {
            let bkQuery = supabase
                .from('bookings')
                .select('id, resource_id, start_time, end_time, status, user_id, resources!inner(name, type, department)');
            bkQuery = applyDeptFilter(bkQuery, department, 'resources');
            bkQuery = applyDateRangeFilter(bkQuery, startDate, endDate);
            const { data: bookings } = await bkQuery;
            const bookingData = bookings?.map((b: any) => ({
                'Booking ID': b.id,
                'Resource': b.resources?.name || 'Unknown',
                'Category': b.resources?.type || 'N/A',
                'Start': new Date(b.start_time).toLocaleString(),
                'End': new Date(b.end_time).toLocaleString(),
                'Status': b.status,
                'Department': b.resources?.department || 'N/A'
            })) || [];
            generateExcelReport(res, 'urms-bookings.xlsx', [{ name: 'Bookings', data: bookingData }, { name: 'Metadata', data: meta }]);

        } else if (type === 'utilization') {
            const utilData = await getUtilizationData(supabase, { department, startDate, endDate, range });
            const excelData = utilData.map((item: any) => ({
                Resource: item.name,
                Category: item.type,
                Department: item.department,
                'Total Bookings': item.totalBookings,
                'Total Hours': item.totalHours,
                'Utilization %': item.utilizationRate
            }));
            generateExcelReport(res, 'urms-utilization.xlsx', [{ name: 'Utilization', data: excelData }, { name: 'Metadata', data: meta }]);

        } else {
            res.status(400).json({ status: "error", message: "Invalid report type. Use: overview, bookings, utilization" });
        }
    } catch (error: any) {
        console.error("Excel Export Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ─── Google Sheets Export ─────────────────────────────────────

export const exportAnalyticsSheets = async (req: AuthRequest, res: Response) => {
    try {
        const { type = 'overview', range = '7d', startDate, endDate, department } = req.query as Record<string, string>;
        const supabase = req.supabase;
        const userEmail = req.user?.email;
        const dateLabel = startDate && endDate ? `${startDate} to ${endDate}` : `Range: ${range}`;

        let exportData: any[] = [];
        let title = "URMS Analytics Report";

        if (type === 'overview') {
            title = "URMS System Overview";
            const data = await getOverviewData(supabase, { department, startDate, endDate });
            exportData = [{
                name: 'Summary',
                headers: ['Metric', 'Value'],
                rows: [
                    ['Total Resources', data.totalResources],
                    ['Active Bookings', data.activeBookings],
                    ['Completed Bookings', data.completedBookings],
                    ['Pending Maintenance', data.pendingMaintenanceTasks],
                    ['Utilization Rate', `${data.resourceUtilization}%`],
                    ['Most Booked Resource', data.mostBookedResource],
                    ['Department Filter', department || 'All'],
                    ['Period', dateLabel],
                    ['Generated At', new Date().toLocaleString()]
                ]
            }];

        } else if (type === 'bookings') {
            title = "URMS Booking Statistics";
            const data = await getBookingData(supabase, { department, startDate, endDate });
            exportData = [
                { name: 'Status Distribution', headers: ['Status', 'Total'], rows: Object.entries(data.statusDistribution) },
                { name: 'Daily Trends', headers: ['Date', 'Booking Count'], rows: data.trends.map(t => [t.date, t.count]) }
            ];

        } else if (type === 'utilization') {
            title = "Resource Utilization Report";
            const utilData = await getUtilizationData(supabase, { department, startDate, endDate, range });
            exportData = [{
                name: 'Utilization',
                headers: ['Resource', 'Category', 'Total Bookings', 'Hours Used', 'Utilization %'],
                rows: utilData.map((item: any) => [item.name, item.type, item.totalBookings, item.totalHours, `${item.utilizationRate}%`])
            }];
        } else {
            return res.status(400).json({ status: "error", message: "Invalid report type." });
        }

        const result = await exportToGoogleSheets(title, exportData, userEmail);
        res.json({ status: "success", data: result });

    } catch (error: any) {
        console.error("Google Sheets Export Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};
