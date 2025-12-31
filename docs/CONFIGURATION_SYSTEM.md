# Exam Configuration System

This document explains how to manage exam dates and pricing through the admin interface.

## Overview

The BTTH registration system now supports dynamic configuration of:
- **Exam Dates**: Add, edit, or remove exam dates without code changes
- **Pricing**: Set different registration fees for Foundation (Classes 7-9) and Regular (Classes 10-12) tiers

## Admin Access

Navigate to `/admin/config` to access the configuration dashboard.

### Requirements
- Must be signed in with admin credentials (Clerk authentication)
- Access from the admin dashboard at `/admin`

## Managing Exam Dates

### Add New Exam Date
1. Click "Add Exam Date" button
2. Fill in the following fields:
   - **Label**: Display name (e.g., "Slot 1", "Slot 2")
   - **Date (YYYY-MM-DD)**: ISO format date (e.g., "2026-01-11")
   - **Display Date**: Human-readable format (e.g., "11 January 2026")
   - **Day of Week**: Day name (e.g., "Sunday")
   - **Exam Time**: Time of exam (e.g., "12:00 PM")
   - **Reporting Time**: When students should arrive (e.g., "11:30 AM")
3. Check "Enable this exam date" to make it visible
4. Click "Save Configuration"

### Edit Exam Date
1. Modify any field in the exam date card
2. Click "Save Configuration"

### Remove Exam Date
1. Click the trash icon on the exam date card
2. Click "Save Configuration"

### Disable Exam Date
1. Uncheck "Enable this exam date"
2. Click "Save Configuration"
   - Disabled dates won't appear on the registration form but remain in the system

## Managing Pricing

### Update Registration Fees
1. Navigate to the "Pricing Configuration" section
2. Update the fee amounts:
   - **Foundation Tier**: For students in Classes 7, 8, and 9
   - **Regular Tier**: For students in Classes 10, 11, and 12
3. Click "Save Configuration"

### How Pricing Works
- The system automatically calculates the correct fee based on the student's class
- Classes 7-9 use the Foundation tier pricing
- Classes 10-12 use the Regular tier pricing
- Fees are displayed in the registration form and admin dashboard

## Initial Setup

### First Time Setup
If no configuration exists, the system will automatically create a default configuration with:
- Two exam dates (11 Jan 2026 and 18 Jan 2026)
- Foundation tier: ₹200
- Regular tier: ₹500

### Manual Seeding
To manually seed the default configuration:
```bash
npm run seed:config
```

Or via API (admin only):
```bash
POST /api/admin/config/seed
```

## Where Configuration Appears

The configuration you set affects:

1. **Registration Form** (`/register`)
   - Exam date options (radio buttons)
   - Registration fee display
   - Form validation

2. **Landing Page** (`/`)
   - Exam slots section showing available dates
   - Quick registration links with pre-selected dates

3. **Admin Dashboard** (`/admin`)
   - Date filter dropdown (future enhancement)
   - Registration details display

## Technical Details

### API Endpoints

- `GET /api/config` - Public endpoint for active configuration
- `GET /api/admin/config` - Admin endpoint to fetch configuration
- `PUT /api/admin/config` - Admin endpoint to update configuration
- `POST /api/admin/config/seed` - Admin endpoint to seed default config

### Data Structure

```typescript
interface ExamConfiguration {
  examDates: Array<{
    id: string;
    value: string;           // ISO date: "2026-01-11"
    label: string;           // "Slot 1"
    displayDate: string;     // "11 January 2026"
    dayOfWeek: string;       // "Sunday"
    time: string;            // "12:00 PM"
    reportingTime?: string;  // "11:30 AM"
    enabled: boolean;
  }>;
  pricing: {
    foundation: number;      // Price for Classes 7-9
    regular: number;         // Price for Classes 10-12
  };
  isActive: boolean;
  updatedAt: Date;
}
```

### Caching
- Configuration is cached on the frontend to minimize API calls
- Changes take effect immediately after saving
- Users may need to refresh their browser to see updates

## Best Practices

1. **Test Before Saving**: Review all changes before clicking "Save Configuration"
2. **Disable Instead of Delete**: Disable exam dates that are full instead of deleting them
3. **Keep Labels Consistent**: Use "Slot 1", "Slot 2", etc. for clarity
4. **Date Format**: Always use YYYY-MM-DD format for the date value field
5. **Pricing Updates**: Update pricing during off-peak hours to avoid confusion

## Troubleshooting

### Configuration Not Loading
- Check MongoDB connection
- Verify Clerk authentication is working
- Check browser console for errors

### Changes Not Appearing
- Clear browser cache
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Verify configuration was saved (check for success message)

### Exam Dates Not Showing
- Ensure dates are marked as "enabled"
- Check that the date value is in correct format (YYYY-MM-DD)
- Verify at least one exam date exists

## Support

For technical issues or questions, contact the development team.
