import MaintenanceTimeline from '@/components/MaintenanceTimeline';

// Example Mock Data for previewing the Timeline UI
const staticRecords = [
  {
    maintenance_id: 'm_101',
    resource_id: 'res_01',
    description: 'Routine AC server room filter replacement',
    date: '2026-04-18T10:00:00Z',
    status: 'Completed'
  },
  {
    maintenance_id: 'm_102',
    resource_id: 'res_01',
    description: 'Network gateway connectivity troubleshooting',
    date: '2026-04-20T14:30:00Z',
    status: 'In Progress'
  },
  {
    maintenance_id: 'm_103',
    resource_id: 'res_01',
    description: 'Annual electrical safety inspection',
    date: '2026-04-25T09:00:00Z',
    status: 'Pending'
  }
];

export default function MaintenanceTimelinePreview() {
  return (
    <div className="p-8 max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 border-b pb-2">
        Component Preview: Maintenance Timeline
      </h1>
      <MaintenanceTimeline 
        records={staticRecords} 
        resourceName="Main Server Rack" 
      />
    </div>
  );
}
