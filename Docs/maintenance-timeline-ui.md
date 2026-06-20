# Maintenance Timeline UI Documentation

## Overview
This document outlines the implementation details for the **Resource Maintenance History Timeline** story, part of the **Maintenance Management Module** for the UniLink – URMS project.

The newly created `MaintenanceTimeline` component serves as a READ-ONLY visualization of past maintenance activities for a specifically selected resource. It provides a visual sequence of events, in chronological order, showing exactly what happened to the resource over time.

## Objective
The primary goal of this feature was to build a clean, responsive, and reusable Next.js (React) component that renders the maintenance history of a specific resource as a vertical timeline using Tailwind CSS. 

## Component Spec: `MaintenanceTimeline.tsx`

**Path:** `components/MaintenanceTimeline.tsx`

### Props defined:
```tsx
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
```

### Features Implemented:
1. **Chronological Sorting:** The timeline sorts incoming raw records, prioritizing the *latest dates first* internally so the parent component does not need to handle sorting arrays for this specific visualization.
2. **Dynamic Theming:** Visual badges and icons dynamically adjust based on the current status of the maintenance record:
   - `Completed`: Emerald (Green) check circle indicator.
   - `In Progress`: Blue wrench action indicator.
   - `Pending/Other`: Amber (Yellow/Orange) clock indicator.
3. **Empty Data State:** A dedicated "fallback" layout appears when an empty array or undefined prop is passed, providing an explicit graphic to let users know there is no recorded maintenance for this resource.
4. **Responsive Strategy:**
   - **Mobile (sm):** Operates as a left-aligned vertical list. Event cards sit adjacent to their indicator node.
   - **Desktop (md+):** Flexes out into an alternating layout where event cards snake down the center line left/right alternately for better wide-screen space utilization.

## strict Data Limitations Observed
As explicitly mandated by the sprint constraints, this task **does strictly guarantee**:
- No APIs were created or modified. 
- The data is assumed to be fully piped in through as component `props`.
- Zero user interactions (like clicking to edit/delete) were bound.
- Component state logic remains purely presentational (stateless implementation).

## Usage Example
```tsx
import MaintenanceTimeline from '@/components/MaintenanceTimeline';

// Example Mock Data
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
  }
];

export default function MaintenancePage() {
  return (
    <div className="p-8">
      <MaintenanceTimeline 
        records={staticRecords} 
        resourceName="Main Server Rack" 
      />
    </div>
  );
}
```
