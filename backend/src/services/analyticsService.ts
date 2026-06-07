import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper to apply department filtering to Supabase queries.
 * @param query - Supabase query builder
 * @param department - Department name or undefined (skip filter)
 * @param joinPath - If filtering via a joined table (e.g. 'resources'), provide the alias
 */
export const applyDeptFilter = (query: any, department: string | undefined, joinPath?: string) => {
    if (!department) return query;
    if (joinPath) {
        return query.eq(`${joinPath}.department`, department);
    }
    return query.eq('department', department);
};

/**
 * Helper to apply date range filtering to Supabase queries.
 * Always normalises endDate to end-of-day UTC to prevent timezone off-by-one errors.
 */
export const applyDateRangeFilter = (
    query: any,
    startDate: string | undefined,
    endDate: string | undefined,
    column = 'created_at'
) => {
    if (startDate) {
        // Normalise to start of day UTC if no time component
        const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`;
        query = query.gte(column, start);
    }
    if (endDate) {
        // Always append end-of-day UTC to include the full last day
        const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;
        query = query.lte(column, end);
    }
    return query;
};

/**
 * Batch-fetch resource names by IDs to avoid N+1 queries.
 * Returns a map of id -> name.
 */
export const batchFetchResourceNames = async (
    supabase: SupabaseClient,
    ids: string[]
): Promise<Record<string, string>> => {
    if (ids.length === 0) return {};
    const { data } = await supabase
        .from('resources')
        .select('id, name')
        .in('id', ids);
    const map: Record<string, string> = {};
    data?.forEach((r: any) => { map[r.id] = r.name; });
    return map;
};

/** ─── Overview Data ──────────────────────────────────────────── */
export const getOverviewData = async (
    supabase: SupabaseClient,
    params: { department?: string; startDate?: string; endDate?: string }
) => {
    const now = new Date().toISOString();
    const { department, startDate, endDate } = params;

    let resQuery = supabase.from('resources').select('*', { count: 'exact', head: true });
    resQuery = applyDeptFilter(resQuery, department);
    const { count: totalResources } = await resQuery;

    let maintQuery = supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('availability_status', 'Maintenance');
    maintQuery = applyDeptFilter(maintQuery, department);
    const { count: resourcesUnderMaintenance } = await maintQuery;

    let activeBookingsQuery = supabase
        .from('bookings')
        .select('*, resources!inner(department)', { count: 'exact', head: true })
        .eq('status', 'Approved')
        .gt('end_time', now);
    activeBookingsQuery = applyDeptFilter(activeBookingsQuery, department, 'resources');
    activeBookingsQuery = applyDateRangeFilter(activeBookingsQuery, startDate, endDate);
    const { count: activeBookings } = await activeBookingsQuery;

    let completedBookingsQuery = supabase
        .from('bookings')
        .select('*, resources!inner(department)', { count: 'exact', head: true })
        .eq('status', 'Completed');
    completedBookingsQuery = applyDeptFilter(completedBookingsQuery, department, 'resources');
    completedBookingsQuery = applyDateRangeFilter(completedBookingsQuery, startDate, endDate);
    const { count: completedBookings } = await completedBookingsQuery;

    let totalMaintQuery = supabase
        .from('maintenance_tickets')
        .select('*, resources!inner(department)', { count: 'exact', head: true });
    totalMaintQuery = applyDeptFilter(totalMaintQuery, department, 'resources');
    totalMaintQuery = applyDateRangeFilter(totalMaintQuery, startDate, endDate);
    const { count: totalMaintenanceTickets } = await totalMaintQuery;

    let pendingMaintQuery = supabase
        .from('maintenance_tickets')
        .select('*, resources!inner(department)', { count: 'exact', head: true })
        .in('status', ['OPEN', 'IN_PROGRESS']);
    pendingMaintQuery = applyDeptFilter(pendingMaintQuery, department, 'resources');
    pendingMaintQuery = applyDateRangeFilter(pendingMaintQuery, startDate, endDate);
    const { count: pendingMaintenanceTasks } = await pendingMaintQuery;

    // Most booked resource — single batch query
    let mbQuery = supabase.from('bookings').select('resource_id, resources!inner(department)');
    mbQuery = applyDeptFilter(mbQuery, department, 'resources');
    mbQuery = applyDateRangeFilter(mbQuery, startDate, endDate);
    const { data: bookingData } = await mbQuery;

    let mostBookedResource = "N/A";
    if (bookingData && bookingData.length > 0) {
        const counts: Record<string, number> = {};
        bookingData.forEach((b: any) => counts[b.resource_id] = (counts[b.resource_id] || 0) + 1);
        const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (topEntry) {
            const nameMap = await batchFetchResourceNames(supabase, [topEntry[0]]);
            mostBookedResource = nameMap[topEntry[0]] || "Unknown";
        }
    }

    // Resource utilization: percentage of resources that had at least one active booking
    // More accurate: (activeBookings / totalResources) * 100 represents booking density
    const utilization = totalResources ? Math.min(100, Math.round(((activeBookings || 0) / totalResources) * 100)) : 0;

    return {
        totalResources: totalResources || 0,
        activeBookings: activeBookings || 0,
        completedBookings: completedBookings || 0,
        resourcesUnderMaintenance: resourcesUnderMaintenance || 0,
        mostBookedResource,
        totalMaintenanceTickets: totalMaintenanceTickets || 0,
        pendingMaintenanceTasks: pendingMaintenanceTasks || 0,
        resourceUtilization: utilization
    };
};

/** ─── Booking Data ───────────────────────────────────────────── */
export const getBookingData = async (
    supabase: SupabaseClient,
    params: { department?: string; startDate?: string; endDate?: string }
) => {
    const { department, startDate, endDate } = params;

    // Status distribution — consistent set of statuses
    let statusQuery = supabase
        .from('bookings')
        .select('status, resources!inner(department)');
    statusQuery = applyDeptFilter(statusQuery, department, 'resources');
    statusQuery = applyDateRangeFilter(statusQuery, startDate, endDate);
    const { data: statusData } = await statusQuery;

    const statusDistribution: Record<string, number> = {
        'Pending': 0,
        'Approved': 0,
        'Completed': 0,
        'Cancelled': 0,
        'Rejected': 0
    };
    statusData?.forEach((b: any) => {
        if (statusDistribution[b.status] !== undefined) {
            statusDistribution[b.status]++;
        }
    });

    // Trend calculation — use the shared date range filter
    let start = new Date();
    if (startDate) {
        start = new Date(startDate);
    } else {
        start.setDate(start.getDate() - 7);
    }

    let end = new Date();
    if (endDate) {
        end = new Date(endDate);
    }

    let trendQuery = supabase
        .from('bookings')
        .select('created_at, resources!inner(department)');
    // Apply department filter (critical: was missing here)
    trendQuery = applyDeptFilter(trendQuery, department, 'resources');
    trendQuery = applyDateRangeFilter(trendQuery, startDate || start.toISOString(), endDate);

    const { data: trendData } = await trendQuery;

    const trends: Record<string, number> = {};
    let current = new Date(start);
    while (current <= end) {
        trends[current.toISOString().split('T')[0]] = 0;
        current.setDate(current.getDate() + 1);
    }

    trendData?.forEach((b: any) => {
        const date = b.created_at.split('T')[0];
        if (trends[date] !== undefined) trends[date]++;
    });

    const sortedTrends = Object.entries(trends)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

    return {
        statusDistribution,
        trends: sortedTrends
    };
};

/** ─── Shared Utilization Query ──────────────────────────────── */
/**
 * Shared utilization data gathering — used by getResourceUtilization endpoint
 * AND by all three export handlers (PDF, Excel, Sheets) to eliminate copy-paste.
 */
export const getUtilizationData = async (
    supabase: SupabaseClient,
    params: {
        department?: string;
        startDate?: string;
        endDate?: string;
        range?: string;
    }
) => {
    const { department, startDate, endDate, range } = params;

    let days = 30;
    let start = new Date();
    const end = new Date();

    if (startDate) {
        start = new Date(startDate);
        if (endDate) {
            days = Math.max(1, Math.ceil((new Date(endDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        } else {
            days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        }
    } else {
        if (range === '7d') days = 7;
        else if (range === '12m') days = 365;
        start.setDate(start.getDate() - days);
    }

    let resQuery = supabase.from('resources').select('id, name, type, department');
    resQuery = applyDeptFilter(resQuery, department);
    const { data: resources, error: resError } = await resQuery;
    if (resError) throw resError;

    let bkQuery = supabase
        .from('bookings')
        .select('resource_id, start_time, end_time, resources!inner(department)')
        .in('status', ['Approved', 'Completed']);
    bkQuery = applyDeptFilter(bkQuery, department, 'resources');
    bkQuery = applyDateRangeFilter(bkQuery, startDate || start.toISOString(), endDate, 'start_time');
    const { data: bookings, error: bkError } = await bkQuery;
    if (bkError) throw bkError;

    // Use business hours (8h/day) as the available window per resource for realistic utilization
    const availableHoursPerResource = days * 8;

    const utilizationMap: Record<string, any> = {};
    resources?.forEach((r: any) => {
        utilizationMap[r.id] = {
            id: r.id,
            name: r.name,
            type: r.type,
            department: r.department,
            totalBookings: 0,
            totalHours: 0,
            utilizationRate: 0
        };
    });

    bookings?.forEach((b: any) => {
        if (utilizationMap[b.resource_id]) {
            const bStart = new Date(b.start_time);
            const bEnd = new Date(b.end_time);
            const durationHours = Math.max(0, (bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60));
            utilizationMap[b.resource_id].totalBookings++;
            utilizationMap[b.resource_id].totalHours += durationHours;
        }
    });

    return Object.values(utilizationMap).map((item: any) => {
        item.utilizationRate = availableHoursPerResource > 0
            ? Math.min(100, Math.round((item.totalHours / availableHoursPerResource) * 100))
            : 0;
        item.totalHours = Math.round(item.totalHours * 10) / 10;
        return item;
    }).sort((a, b) => b.utilizationRate - a.utilizationRate);
};
