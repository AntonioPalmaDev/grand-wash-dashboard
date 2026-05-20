I will refactor the multi-tenant architecture to separate the **Global Admin Central** from the **Individual Company Areas**, creating a professional SaaS experience.

### Technical Details

#### 1. Context Separation
- **Modify `CompanyContext.tsx`**: Add support for a "Global" mode where no company is active. This will allow the system to load without a specific `company_id`.
- **Global Context**: The system will detect if the user is in the `/admin` path and disable the company context.

#### 2. Layout & Sidebar
- **Rename `AppSidebar.tsx` to `CompanySidebar.tsx`**: This will be the sidebar for individual companies.
- **Create `GlobalSidebar.tsx`**: A dedicated sidebar for the Global Admin Central with the requested menu items (Global Dashboard, Companies, Users, Logs, etc.).
- **Dynamic Layout**: `AppLayout.tsx` will choose which sidebar to show based on whether a company is active or if we are in the global route.

#### 3. Routing Structure
- **Global Routes (`/admin/*`)**:
    - `/admin`: Global Dashboard (refactored from `AdminMasterPage`)
    - `/admin/companies`: List of all companies with metrics.
    - `/admin/users`: Global user management.
    - `/admin/logs`: Global system logs.
- **Company Routes**: Existing routes will be wrapped in the company context.

#### 4. UI/UX Enhancements
- **Global Dashboard**: New design showing total companies, users, operations, global revenue, and system status.
- **Company Cards**: Redesigned cards in the Global Central showing key metrics (Revenue, Operations).
- **Context Switcher**: Add a clear "Return to Global Central" button and a badge indicating the active company.

#### 5. Security (Supabase)
- **RLS Refinement**: Ensure Master Admins can bypass company isolation when in Global mode, while normal users are restricted to their assigned companies.

### Implementation Steps

1. **Context Update**: Modify `CompanyContext.tsx` to handle `null` active company explicitly for global mode.
2. **Global Components**: Create `GlobalSidebar`, `GlobalDashboard`, and `GlobalCompaniesPage`.
3. **App Restructuring**: Update `App.tsx` and `AppLayout.tsx` to handle the two distinct levels of navigation.
4. **Refactor Sidebars**: Separate the logic for global vs company menus.
5. **UI Polish**: Implement the "Stripe/Linear" style with clear context indicators.
6. **Data Wiring**: Ensure the Global Central pulls data across all tenants (for Master Admins).
