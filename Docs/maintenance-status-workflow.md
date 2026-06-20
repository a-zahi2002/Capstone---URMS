# Maintenance Workflow System

**Module**: Maintenance Management Module  
*(Dependency context: Relies potentially on Notification & Alert Module if hooked into external triggers)*

This document specifies the rigorous lifecycle workflow implemented for Maintenance Tickets within the URMS Application. To ensure structural consistency and prevent contradictory task tracking scenarios, specific rules are enforced systematically across the ticket lifecycle.

## Status Definitions

Maintenance tasks are constrained to the following 3 finite states:
- **`OPEN`**: The default phase assigned at ticket inception. Denotes a newly created issue that has been acknowledged but not aggressively acted upon.
- **`IN_PROGRESS`**: Signals that mechanics or IT administrators have commenced work on the problem.
- **`COMPLETED`**: Final terminal state indicating the maintenance issue has been resolved. Transitioning to this state triggers an automatic update of the linked Resource's status based on the provided outcome.

## Status Transition Lifecycle Diagram
Transitions are strictly contiguous except for defined Admin override capabilities.

```text
[ START: Ticket Generated ]
       |
       v
    [ OPEN ]
       |
       v  <-- Valid Transition
       |
[ IN_PROGRESS ]
       |
       v  <-- Valid Transition
       |
  [ COMPLETED ]
       |
       x  <-- Changes Locked (Unless Admin Override)
```

### Transition Invalidations
The system will **hard reject (400 Bad Request)** the following logic jumps:
- `COMPLETED` → `IN_PROGRESS`
- `COMPLETED` → `OPEN`
- `IN_PROGRESS` → `OPEN`
*(Note: If the requesting user bears an Administrator authority token mapping `admin: true`, transition invalidations are overridden, allowing force-fixes on incorrectly clicked ticket updates).*

## API Implementation

### Update Ticket Status
All status updates traverse a purposefully segregated endpoint to encapsulate rules effectively.

**Endpoint:** `PUT /api/maintenance-tickets/:id/status`

**Required Payload:**
```json
{
  "status": "OPEN" | "IN_PROGRESS" | "COMPLETED",
  "outcome": "Fixed" | "Faulty" | "Decommissioned" (Only required when status is COMPLETED)
}
```

### Resource Synchronization
When status is set to `COMPLETED`, the system synchronizes the linked resource:
- `outcome: "Fixed"` → Resource `availability_status = "Available"`
- `outcome: "Faulty"` → Resource `availability_status = "Under Maintenance"`
- `outcome: "Decommissioned"` → Resource `availability_status = "Inactive"`

### Error Handling & Edge Cases
The controller safeguards state anomalies with rigid HTTP metrics:
- **200 OK**: Transited state successfully.
- **400 Bad Request**: Returns detailed metrics if the jump is invalid (`"Invalid status transition from COMPLETED to IN_PROGRESS"`) or if an unrecognizable schema status is passed.
- **401 Unauthorized**: Handled natively by Firebase token logic if missing.
- **403 Forbidden**: Execution attempted by standard students/lecturers lacking the `maintenance` or `admin` RBAC signature.
- **404 Not Found**: Attempted to transit a ticket ID that returns null.
- **500 Internal Server error**: DB/Pool corruption.

## Role Permissions Constraint
Role Based Access Control is heavily utilized to govern workflows. 
- **Entity Authors (Students/Staff)**: Expressly forbidden from jumping ticket states.
- **Maintenance Staff**: Hard-bound to the linear workflow (`OPEN` → `IN_PROGRESS` → `COMPLETED`).
- **Administrators**: Possess maximum clearance inclusive of arbitrary state overrides for structural corrections.
