import React from 'react';
import { CheckCircle2, Clock, Wrench, AlertCircle } from 'lucide-react';

export interface MaintenanceRecord {
    maintenance_id: string;
    resource_id: string;
    description: string;
    date: string;
    status: string; // e.g. 'Pending', 'In Progress', 'Completed'
}

interface MaintenanceTimelineProps {
    records: MaintenanceRecord[];
    resourceName?: string;
}

const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed':
            return {
                icon: <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />,
                badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                iconContainer: 'text-emerald-600 bg-emerald-100',
            };
        case 'in progress':
            return {
                icon: <Wrench className="w-4 h-4 md:w-5 md:h-5" />,
                badge: 'text-blue-700 bg-blue-50 border-blue-200',
                iconContainer: 'text-blue-600 bg-blue-100',
            };
        case 'pending':
        default:
            return {
                icon: <Clock className="w-4 h-4 md:w-5 md:h-5" />,
                badge: 'text-amber-700 bg-amber-50 border-amber-200',
                iconContainer: 'text-amber-600 bg-amber-100',
            };
    }
};

export default function MaintenanceTimeline({ records, resourceName }: MaintenanceTimelineProps) {
    if (!records || records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-2xl w-full">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-200">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">No maintenance history</h3>
                <p className="text-xs text-slate-500 mt-1 text-center max-w-sm">
                    {resourceName 
                        ? `There are no maintenance records available for ${resourceName}.` 
                        : 'There are no maintenance records recorded at this time.'}
                </p>
            </div>
        );
    }

    // Ensure records are sorted chronologically (latest first)
    const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm w-full">
            <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-600" />
                    Maintenance History
                </h2>
                {resourceName && (
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        Timeline for <span className="text-slate-700">{resourceName}</span>
                    </p>
                )}
            </div>

            <div className="relative space-y-6 md:space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 before:z-0">
                {sortedRecords.map((record) => {
                    const statusConfig = getStatusConfig(record.status);
                    
                    return (
                        <div key={record.maintenance_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active z-10">
                            {/* Timeline Icon */}
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${statusConfig.iconContainer}`}>
                                {statusConfig.icon}
                            </div>
                            
                            {/* Record Card */}
                            <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.badge} shadow-sm`}>
                                        {record.status}
                                    </span>
                                    <time className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        {new Date(record.date).toLocaleDateString(undefined, { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </time>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {record.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
