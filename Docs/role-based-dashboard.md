# Role-Based Dashboard System

## Feature Overview
The **Role-Based Dashboard System** is a comprehensive architectural upgrade to the URMS UniLink platform that replaces the monolithic dashboard page with a modular, role-aware layout. Each of the four user roles — **Student**, **Lecturer**, **Maintenance**, and **Admin** — now receives a completely unique dashboard experience with dedicated sidebar navigation, tailored widgets, and role-specific functionality.

This feature aligns with the **User Management Module** (role-based access control), the **Resource Booking Module** (booking overviews), the **Maintenance Management Module** (ticket queues), and the **Notification & Alert Module** (status alerts).

## Architecture

### Component Hierarchy
```
app/dashboard/page.tsx                    ← Slim orchestrator (11 lines)
  └── ProtectedRoute                      ← Auth guard + role redirect
       └── DashboardLayout                ← Sidebar + top bar + content
            ├── DashboardSidebar          ← Role-aware collapsible sidebar
            └── {Role}Dashboard           ← One of four sub-dashboards
                 ├── StudentDashboard
                 ├── LecturerDashboard
                 ├── MaintenanceDashboard
                 └── AdminDashboard
```

### Data Flow
1. User navigates to `/dashboard`.
2. `LayoutShell` detects the dashboard route and **skips** global Navbar/Footer.
3. `ProtectedRoute` verifies authentication; redirects to `/login` if unauthenticated.
4. `DashboardLayout` reads `profile.role` from the auth context.
5. The correct sub-dashboard component and sidebar nav items render based on the role.

---

## New File Structure
```
components/
  dashboard/
    DashboardSidebar.tsx          ← Role-aware collapsible sidebar
    DashboardLayout.tsx           ← Main layout (sidebar + top bar + content)
    StudentDashboard.tsx          ← Student-specific dashboard view
    LecturerDashboard.tsx         ← Lecturer-specific dashboard view
    MaintenanceDashboard.tsx      ← Maintenance-specific dashboard view
    AdminDashboard.tsx            ← Admin-specific dashboard view

app/
  dashboard/
    layout.tsx                    ← Route-level layout (skips global nav)
    page.tsx                      ← Refactored to slim orchestrator
```

---

## Component Descriptions

### DashboardSidebar (`components/dashboard/DashboardSidebar.tsx`)
A premium collapsible sidebar component that dynamically renders navigation items based on the authenticated user's role.

**Role-Specific Navigation Items:**

| Role | Navigation Items |
|------|-----------------|
| **Student** | Dashboard, My Bookings, Reserve Resources, Booking Status, Notifications |
| **Lecturer** | Dashboard, Dept. Resources, Approval Queue, Schedule Overview, My Bookings, Notifications |
| **Maintenance** | Dashboard, Ticket Queue, Update Resources, Maint. Schedule, Reports |
| **Admin** | Dashboard, System Analytics, User Management, Resource Catalog, All Bookings, Maintenance, Settings |

**Features:**
- **Collapsible Mode**: Toggles between full-width (260px) and icon-only (72px) mode on desktop using Framer Motion spring animations.
- **Tooltip System**: In collapsed mode, hovering over icons reveals tooltips with the full label.
- **Active Route Indicator**: Uses Framer Motion `layoutId` for a smooth sliding active bar animation.
- **Role Color Accents**: Each role has a distinct color theme — purple (Admin), emerald (Lecturer), blue (Student), amber (Maintenance).
- **Mobile Drawer**: On screens below `lg` breakpoint, the sidebar becomes a slide-over drawer with backdrop overlay.
- **User Card**: Displays avatar initials, user name, email, and role badge at the bottom.
- **Sign Out**: Integrated sign out button at the bottom of the sidebar.

**Props Interface:**
```typescript
interface DashboardSidebarProps {
    collapsed: boolean;        // Whether sidebar is in collapsed mode
    onToggle: () => void;      // Toggle collapse state
    mobileOpen: boolean;       // Whether mobile drawer is open
    onMobileClose: () => void; // Close mobile drawer
}
```

---

### DashboardLayout (`components/dashboard/DashboardLayout.tsx`)
The main layout wrapper component that orchestrates the sidebar, top bar, and role-specific content area.

**Features:**
- **Top Bar**: Contains a hamburger menu (mobile), breadcrumb trail (`UniLink / Dashboard`), notification bell, and theme toggle.
- **Role Routing**: Uses a `switch` statement on `profile.role` to render the correct sub-dashboard.
- **Full-Height Layout**: Uses `h-screen` with `overflow-hidden` on the container and `overflow-y-auto` on the content area for proper scroll containment.

---

### StudentDashboard (`components/dashboard/StudentDashboard.tsx`)
Dashboard view tailored for students with a focus on booking management and resource discovery.

**Features:**
- **Real API Integration**: Fetches the student's bookings from `GET /api/bookings/my`.
- **Status Alert Banner**: Displays a warning banner when bookings are pending lecturer/admin approval.
- **Stat Cards (4)**: Total Bookings, Approved, Pending, Rejected — with dynamic counts from API data.
- **Next Booking Hero Card**: Gradient card highlighting the student's upcoming approved booking, or prompting to browse resources if none exist.
- **Quick Action Grid (4 tiles)**: Reserve Resource, My Bookings, Browse Labs, Notifications.
- **Recent Bookings List**: Shows the latest 5 bookings with status badges (Approved/Pending/Rejected).

---

### LecturerDashboard (`components/dashboard/LecturerDashboard.tsx`)
Dashboard view tailored for lecturers with emphasis on approval workflows and class scheduling.

**Features:**
- **Real API Integration**: Full approval queue functionality preserved from the original implementation.
  - `GET /api/bookings/pending` — Fetches pending student booking requests.
  - `PUT /api/bookings/{id}/status` — Approves or rejects bookings.
- **Approval Queue Panel**: Lists all pending student resource requests with Approve/Deny buttons.
- **Rejection Modal**: Modal dialog requiring a written reason when denying a booking.
- **Stat Cards (4)**: Pending Approvals (live count), Dept. Resources, Upcoming Classes, Students Active.
- **Schedule Overview**: Lists upcoming classes with date cards, locations, and times.

---

### MaintenanceDashboard (`components/dashboard/MaintenanceDashboard.tsx`)
Dashboard view tailored for maintenance staff with focus on ticket management and task prioritization.

**Features:**
- **Real API Integration**: Fetches maintenance tickets from `GET /api/maintenance-tickets` and supports status advancement via `PUT /api/maintenance-tickets/{id}/status`.
- **Stat Cards (5)**: Total Tickets, Open, In Progress, Completed, High Priority.
- **Critical Tasks Panel**: Isolated view of high-priority open tickets with quick "Start" / "Complete" action buttons.
- **Routine Maintenance Schedule**: Upcoming scheduled maintenance tasks with due dates.
- **Active Ticket Queue**: Searchable list of all non-completed tickets with priority badges, status badges, and status advancement controls.

**Status Advancement Logic:**
```typescript
// Status transitions
OPEN → IN_PROGRESS → COMPLETED
// User clicks "Start" on OPEN tickets, "Complete" on IN_PROGRESS tickets
```

---

### AdminDashboard (`components/dashboard/AdminDashboard.tsx`)
Dashboard view for system administrators with high-level analytics and management controls.

**Features:**
- **Real API Integration**: Fetches resource count from `GET /api/resources` and active maintenance ticket count from `GET /api/maintenance-tickets`.
- **System Stat Cards (4)**: Active Users, Total Resources, Active Bookings, Maintenance Tickets — each with trend indicators.
- **Resource Utilization Chart**: Animated horizontal bar chart showing utilization rates for Lecture Halls, Computer Labs, Study Rooms, Equipment, and Sports Facilities.
- **Recent Activity Feed**: Typed activity log with success/info/warning icons and timestamps.
- **User Management Section**: Breakdown of users by role (Students, Lecturers, Maintenance, Admins) with counts.
- **Management Actions Grid (6 tiles)**: Manage Users, Edit Resources, View Tickets, All Bookings, View Analytics, System Settings.

---

## Modified Files

### `app/dashboard/page.tsx`
**Change**: Reduced from **506 lines** to **11 lines**.

**Before**: Contained all four role dashboards (`AdminDashboard`, `LecturerDashboard`, `StudentDashboard`, `MaintenanceDashboard`) inline with conditional rendering, all stat cards, animation variants, and the full approval queue logic.

**After**: A clean orchestrator that imports `ProtectedRoute` and `DashboardLayout`:
```typescript
export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout />
        </ProtectedRoute>
    );
}
```

---

### `components/ProtectedRoute.tsx`
**Change**: Enhanced with role-based redirect and improved loading state.

**Before**: Displayed a static "Access Denied" message when a user's role didn't match `allowedRoles`.

**After**:
- **Role Redirect**: If the user is authenticated but has an unauthorized role, they are redirected to `/dashboard` (their own role-appropriate view) instead of seeing an error.
- **`fallbackPath` Prop**: Optional prop to specify a custom redirect target.
- **Improved Loading Spinner**: Replaced plain text with a branded circular animation.

```typescript
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];     // Optional role whitelist
    fallbackPath?: string;       // Custom redirect path (default: "/dashboard")
}
```

---

### `components/LayoutShell.tsx`
**Change**: Added dashboard route detection to skip global Navbar and Footer.

**Before**: Only skipped Navbar/Footer for `/login` and `/register`.

**After**: Also skips for `/dashboard` and any `/dashboard/*` sub-routes, since the dashboard has its own sidebar navigation and top bar.

```typescript
const isDashboardPage = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
const skipGlobalNav = isAuthPage || isDashboardPage;
```

---

### `app/dashboard/layout.tsx` (New)
A minimal route-level layout for the dashboard that passes children through directly. Works in conjunction with `LayoutShell` to ensure the dashboard renders without global navigation chrome.

---

## API Endpoints Used

| Endpoint | Method | Used By | Purpose |
|----------|--------|---------|---------|
| `/api/bookings/my` | GET | StudentDashboard | Fetch student's own bookings |
| `/api/bookings/pending` | GET | LecturerDashboard | Fetch pending approval requests |
| `/api/bookings/{id}/status` | PUT | LecturerDashboard | Approve/reject a booking |
| `/api/maintenance-tickets` | GET | MaintenanceDashboard, AdminDashboard | Fetch maintenance tickets |
| `/api/maintenance-tickets/{id}/status` | PUT | MaintenanceDashboard | Advance ticket status |
| `/api/resources` | GET | AdminDashboard | Fetch resource count for stats |

All API calls include `Authorization: Bearer {token}` headers using Firebase ID tokens.

---

## UI/UX Design Decisions

### Color System (Per Role)
| Role | Primary Color | Gradient | Usage |
|------|--------------|----------|-------|
| Admin | Purple (`#7C3AED`) | `from-purple-600 to-violet-600` | Sidebar accent, avatar, active states |
| Lecturer | Emerald (`#10B981`) | `from-emerald-600 to-teal-600` | Sidebar accent, approval badges |
| Student | Blue (`#3B82F6`) | `from-blue-600 to-cyan-600` | Sidebar accent, booking cards |
| Maintenance | Amber (`#F59E0B`) | `from-amber-600 to-orange-600` | Sidebar accent, ticket badges |

### Responsive Breakpoints
- **Desktop (`lg:` ≥ 1024px)**: Full sidebar visible, collapsible to icon mode.
- **Tablet/Mobile (`< 1024px`)**: Sidebar hidden, accessible via hamburger menu as a slide-over drawer.

### Animation Library
- **Framer Motion**: Used for sidebar collapse/expand, mobile drawer slide, active route indicator, utilization bar animations, and staggered card entry.

---

## Assumptions Made
- **Placeholder Data**: Some admin stats (total users, active bookings) and lecturer stats (department resources, upcoming classes) use placeholder values, as dedicated API endpoints for these aggregations may not yet exist. The components are structured to easily integrate real data when endpoints become available.
- **Existing API Compatibility**: All API calls follow the existing patterns established in the codebase (Bearer token auth, JSON responses with `status` and `data` fields).
- **Dashboard-Only Sidebar**: The sidebar currently appears only on the `/dashboard` route. Other routes (`/bookings`, `/resources`, `/maintenance`) continue to use the global Navbar.

## Limitations
- **No Persistent Sidebar State**: The collapsed/expanded state of the sidebar resets on page refresh (held in React state, not persisted to localStorage).
- **No Real-Time Updates**: Dashboard data is fetched on mount; there is no WebSocket or polling mechanism for live updates.
- **Static Schedule Data**: The lecturer's "Upcoming Classes" and maintenance "Routine Schedule" sections use static data as no scheduling API exists yet.

---

## Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion v12
- **Icons**: Lucide React
- **Auth**: Firebase Auth + Supabase user profiles
- **State Management**: React Context (AuthProvider) + local component state
