# Resource Condition Update After Maintenance

## Feature Description
This feature ensures that when a maintenance task is completed, the system automatically synchronizes the status of the related resource. It links the maintenance lifecycle directly to resource availability, ensuring data consistency across the Resource Management and Maintenance Management modules.

## Workflow Explanation
1. **Trigger Phase**: A maintenance staff member or administrator updates a maintenance ticket's status to `COMPLETED`.
2. **Outcome selection**: The user provides an `outcome` for the maintenance (Fixed, Faulty, or Decommissioned).
3. **Record Update**: The system updates the maintenance ticket with the `COMPLETED` status and captures the current timestamp as the completion time.
4. **Synchronization Phase**: 
    - If outcome is **Fixed**: Resource `availability_status` is set to `Available`.
    - If outcome is **Faulty**: Resource `availability_status` remains/is set to `Under Maintenance`.
    - If outcome is **Decommissioned**: Resource `availability_status` is set to `Inactive`.

## API Changes

### Update Ticket Status
**Endpoint**: `PUT /api/maintenance-tickets/:id/status`

**Updated Request Body**:
```json
{
  "status": "COMPLETED",
  "outcome": "Fixed" | "Faulty" | "Decommissioned"
}
```

**Response**:
Includes `resourceUpdated: true` when a status logic trigger was executed.

## Database Impact
- **Table `maintenance_tickets`**:
    - `completed_at` (TIMESTAMP/DATETIME): Captured when status transitions to `COMPLETED`.
    - `outcome` (VARCHAR): Stores the resolution result of the maintenance task.
- **Table `resources`**:
    - `availability_status` (VARCHAR): Automatically updated based on the maintenance outcome.

## Edge Cases Handled
- **Missing Outcome**: Defaults to `Fixed` -> `Available` if no outcome is provided during completion to ensure the resource isn't stuck in maintenance.
- **Invalid Transitions**: Resource status only updates on successful transition to `COMPLETED`. Retrying completion or admin overrides will re-trigger the sync.
- **Unauthorized Updates**: Only users with `maintenance` or `admin` roles can trigger these updates, preventing unauthorized status manipulation.
- **Non-existent Resources**: If a ticket is linked to a deleted or non-existent resource ID, the maintenance update completes but the resource sync fails gracefully with an error log.
