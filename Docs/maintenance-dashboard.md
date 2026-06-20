# Maintenance Dashboard & Overdue Alerts

## Feature Overview
The **Admin Maintenance Dashboard** is a comprehensive UI component designed to provide administrators and facility managers with a high-level overview of maintenance tasks. This aligns with the **Maintenance Management Module** for tracking resources, and the **Notification & Alert Module** for identifying overdue maintenance tasks. 

It provides real-time statistics, active task filtering, and critical visual highlights for requests that have exceeded their designated due dates.

## Dashboard Components Description
- **Header Console**: A premium, visually distinct header serving as the entry point, featuring large typography and a conditional critical alert summary if tasks are overdue.
- **Statistical Summary Cards**: Four prominent metric cards showing:
  - **Total Requests**: The complete sum of maintenance tasks.
  - **Active / Pending**: Tasks that are either newly logged or currently in progress.
  - **Tasks Completed**: Successfully resolved maintenance issues.
  - **Overdue Tasks**: Tasks past their due date, distinctly styled in red with pulsing animations when active.
- **Interactive Data Table**: A robust list view of all maintenance tasks with:
  - **Status Indicators (Badges)**: Clear visual cues indicating whether a task is Pending, In Progress, Completed, or Overdue.
  - **Row Highlights**: Tasks that are overdue feature a persistent red-tinted background so that they remain highly visible.
- **Dynamic Filtering Engine**: Actionable filter tabs allowing administrators to quickly narrow down the list view by `All`, `Pending`, `Completed`, and `Overdue`.

## Overdue Logic Explanation
A maintenance task is flagged as **Overdue** dynamically on the frontend based on the following algorithm:
1. Ensure the task has an assigned **Due Date**.
2. Ensure the task is **NOT** marked as `Completed`.
3. Compare the current date against the due date.

```typescript
const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'Completed') return false;
  return task.dueDate < todayStr; // todayStr is formatted as YYYY-MM-DD
};
```
When this evaluates to `true`, the UI adapts by attaching an overdue badge, triggering pulse animations, and including the task in the Overdue filter count.

## API Usage
Currently, the module relies solely on frontend mock data to satisfy the criteria of computing safely on the frontend. No new backend services or database schemas were created to strictly abide by scope limitations. The module is built generically to easily drop in a JSON returned payload from an existing endpoint in the future.

## Assumptions Made
- **Mock Data Handling**: It is assumed that since the frontend `maintenance` pages (timeline, assignment) relied on static records, it was acceptable and intended to compute metrics securely over an array of mocked tasks for the dashboard view.
- **In Progress vs Pending**: For filtering purposes, "In Progress" and "Pending" tasks are grouped logically under the "Pending / Active" umbrella metric (as they both require follow-up). 

## Limitations
- **No Persistence**: The tasks and filtering states are held in React state; a page refresh resets configurations and mock data.
- **No Email/SMS System**: As per restrictions, no external notification infrastructure (Twilio, Email servers) has been implemented; alerts are purely dashboard-level UI indicators.
- **No Write Operations**: The administration view assumes another feature handles task creation and assignment workflows; this view provides strictly Read-Only analysis and aggregation.
