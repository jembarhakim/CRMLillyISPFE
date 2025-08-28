# Trouble Type Creation Feature for NOC Users

## Overview
NOC users can now create new trouble types directly from the "TO CS" popup in the trouble ticket page, similar to how CS users can create types when adding new tickets.

## How it Works

### For NOC Users:
1. **Access**: Login with NOC role (e.g., noc@lillyisp.com)
2. **Navigate**: Go to Trouble Tickets page
3. **Action**: Click "TO CS" button on any ticket
4. **Create Type**: In the "Diagnosed Trouble Type" section:
   - Click "Add New Type" button
   - Enter a display name (optional)
   - Click "Save Type"
   - The new type is automatically selected

### For CS Users:
1. **Access**: Login with CS role
2. **Navigate**: Go to Trouble Tickets page
3. **Action**: Click "Add Ticket" button
4. **Create Type**: In the "Type" section:
   - Click "New" button
   - Enter a display name (optional)
   - Click "Save Type"
   - The new type is automatically selected

## Technical Implementation

### Backend Changes:
- **Route**: `POST /api/tickets/lookups/trouble-types`
- **Permissions**: Updated to allow NOC users (ADMIN, CUSTOMER_SERVICE, NOC)
- **Handler**: `CreateTroubleType` in `crm-be/internal/api/ticket/handler.go`
- **Repository**: `CreateTroubleType` in `crm-be/internal/api/ticket/repository.go`

### Frontend Changes:
- **API**: `createTroubleType` function in `crm-fe/api/tickets.ts`
- **UI**: Added "Add New Type" button and form in NOC modal
- **State Management**: Added `showNewType` and `newTypeName` reactive variables
- **Error Handling**: Added try-catch with toast notifications

### Database:
- **Table**: `trouble_type`
- **Fields**: `id` (VARCHAR), `name` (VARCHAR, optional)
- **Relations**: Referenced by `trouble_tickets.type` field

## User Experience

### Workflow:
1. User clicks "Add New Type"
2. Input field appears with Save/Cancel buttons
3. User enters name and clicks Save
4. New type is created and automatically selected
5. Success toast notification appears
6. Form resets to normal state

### Error Handling:
- Network errors show error toast
- Validation errors display specific messages
- Form state is preserved on error

## Security
- Only authenticated users with appropriate roles can create types
- NOC users can only create types, not modify existing ones
- All requests are validated server-side

## Future Enhancements
- Edit existing trouble types
- Delete unused trouble types
- Bulk import/export of trouble types
- Type categorization (hardware, software, network, etc.)
