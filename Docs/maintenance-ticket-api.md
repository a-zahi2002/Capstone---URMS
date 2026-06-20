# Maintenance Ticket API Documentation

**Module**: Maintenance Management Module  
**Scope**: REST API endpoints for tracking and managing maintenance requests

This document details the backend REST API implementation for the Maintenance Ticket system within the URMS. 

## Authentication & Role-Based Access Control (RBAC)
- **Firebase JWT Authentication**: All endpoints require a valid Firebase ID token passed as a Bearer token in the `Authorization` header (`Authorization: Bearer <token>`).
- **Development Bypass**: In a development environment or via `dev-token`, the system bypasses this check but injects a mock user context.
- **RBAC Policy**: 
  - *Admin / Maintenance Staff*: Permitted to create, view all, update status/priority, and delete any maintenance tickets. 
  - *Standard Users (Students/Lecturers)*: Restricted exclusively to creating tickets and fetching/viewing solely their own tickets. Updating and deleting is securely forbidden.

## Database Mapping

Tickets align with the SQL table `maintenance_tickets` if strictly modeled, or rely on a fallback static mocked pool mimicking the same behavior for structural redundancy. 

**Structure (`Partial` Entity):**
- `id` (Number/Auto-increment PK)
- `resourceId` (Number - FK referencing `resources.id`)
- `title` (String - Core issue abstract)
- `description` (String - Full details)
- `priority` (Enum: `Low` | `Medium` | `High`)
- `status` (Enum: `Pending` | `In Progress` | `Completed`) 
- `createdBy` (UUID/UID String - FK referencing Auth System)
- `assignedTo` (UUID/UID String - Optional assigned technician)
- `created_at` (Timestamp)

---

## API Endpoint List

### 1. Create Maintenance Ticket
- **Endpoint**: `POST /api/maintenance-tickets`
- **Access**: All Authenticated Users

**Request Payload:**
```json
{
  "resourceId": 2,
  "title": "AC Not Cooling",
  "description": "The AC in Lecture Hall A is blowing warm air.",
  "priority": "High"
}
```

**Success Response (201 Created):**
```json
{
  "message": "Maintenance ticket created successfully",
  "ticketId": 3
}
```

**Error Responses:**
- `400 Bad Request`: `{"message": "Validation error: resourceId, title, and priority are required"}`
- `401 Unauthorized`: Missing or invalid Bearer token.

---

### 2. Get All Maintenance Tickets
- **Endpoint**: `GET /api/maintenance-tickets`
- **Access**: All Authenticated Users (Non-staff receive only tickets they created).
- **Optional Query Params**: `?status=Pending`, `?priority=High`, `?resourceId=2`

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "resourceId": 1,
    "title": "Projector Issue",
    "description": "Screen flickering",
    "priority": "High",
    "status": "Pending",
    "createdBy": "dev-user",
    "assignedTo": null,
    "created_at": "2026-04-22T10:00:00.000Z"
  }
]
```

---

### 3. Get Single Maintenance Ticket
- **Endpoint**: `GET /api/maintenance-tickets/:id`
- **Access**: Standard users limited to viewing their own. Staff can view all.

**Success Response (200 OK):**
```json
{
  "id": 1,
  "resourceId": 1,
  "title": "Projector Issue",
  ...
}
```

**Error Responses:**
- `403 Forbidden`: `{"message": "Forbidden: You can only view your own tickets"}`
- `404 Not Found`: `{"message": "Maintenance ticket not found"}`

---

### 4. Update Ticket
- **Endpoint**: `PUT /api/maintenance-tickets/:id`
- **Access**: Restricted strictly to Admins / Maintenance Staff.

**Request Payload:**
```json
{
  "status": "In Progress",
  "priority": "High",
  "assignedTo": "tech-1"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Maintenance ticket updated successfully"
}
```

**Error Responses:**
- `403 Forbidden`: `{"message": "Forbidden: Only administrators or maintenance staff can update tickets"}`
- `404 Not Found`: Ticket ID doesn't exist.

---

### 5. Delete Ticket
- **Endpoint**: `DELETE /api/maintenance-tickets/:id`
- **Access**: Restricted strictly to Admins / Maintenance Staff.
- **Protocol**: Executes a hard delete query removing the ticket from tracking pools.

**Success Response (200 OK):**
```json
{
  "message": "Maintenance ticket deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Insufficient privileges.
- `404 Not Found`: Ticket missing.
