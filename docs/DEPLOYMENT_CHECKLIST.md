# Configuration System Deployment Checklist

## Pre-Deployment Steps

### 1. Install Dependencies (if needed)
```bash
npm install
```

### 2. Seed Default Configuration
Run the seeder to initialize the exam configuration in your database:

```bash
npm run seed:config
```

Or manually via API after deployment (requires admin authentication):
```bash
POST /api/admin/config/seed
```

### 3. Verify Environment Variables
Ensure these are set in your `.env.local` or deployment environment:
- `MONGODB_URI` - MongoDB connection string
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Razorpay public key
- Clerk authentication variables

## Post-Deployment Verification

### 1. Test Configuration API
```bash
# Public endpoint (should return active config)
GET https://your-domain.com/api/config

# Admin endpoint (requires authentication)
GET https://your-domain.com/api/admin/config
```

### 2. Test Admin UI
1. Navigate to `/admin/config`
2. Verify you can see the configuration form
3. Try updating an exam date
4. Try updating pricing
5. Click "Save Configuration"
6. Verify success message appears

### 3. Test Registration Form
1. Navigate to `/register`
2. Verify exam dates appear correctly
3. Select different classes and verify pricing updates
4. Verify dates match what's in admin config

### 4. Test Landing Page
1. Navigate to `/`
2. Verify exam slots section shows correct dates
3. Click on a slot link
4. Verify it pre-selects the correct date in registration form

## Configuration Management

### Adding New Exam Dates
1. Go to `/admin/config`
2. Click "Add Exam Date"
3. Fill in all fields:
   - Label: "Slot 3"
   - Date: "2026-01-25" (YYYY-MM-DD format)
   - Display Date: "25 January 2026"
   - Day of Week: "Sunday"
   - Exam Time: "12:00 PM"
   - Reporting Time: "11:30 AM"
4. Check "Enable this exam date"
5. Click "Save Configuration"

### Updating Pricing
1. Go to `/admin/config`
2. Scroll to "Pricing Configuration"
3. Update Foundation or Regular tier amounts
4. Click "Save Configuration"

### Disabling Exam Dates
1. Go to `/admin/config`
2. Find the exam date to disable
3. Uncheck "Enable this exam date"
4. Click "Save Configuration"
   - Date will no longer appear in registration form
   - Existing registrations for that date remain valid

## Troubleshooting

### Configuration Not Loading
**Problem**: Registration form shows error or loading indefinitely

**Solutions**:
1. Check MongoDB connection is working
2. Run seeder: `npm run seed:config`
3. Check browser console for errors
4. Verify `/api/config` endpoint returns data

### Changes Not Reflecting
**Problem**: Updated configuration doesn't appear on frontend

**Solutions**:
1. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Check if save was successful (look for success message)
4. Verify configuration in database

### Admin Page Not Accessible
**Problem**: Cannot access `/admin/config`

**Solutions**:
1. Verify you're signed in with admin account
2. Check Clerk authentication is configured
3. Check browser console for auth errors

## Database Schema

The configuration is stored in MongoDB collection: `exam_config`

```javascript
{
  _id: ObjectId,
  examDates: [
    {
      id: "slot-1",
      value: "2026-01-11",
      label: "Slot 1",
      displayDate: "11 January 2026",
      dayOfWeek: "Sunday",
      time: "12:00 PM",
      reportingTime: "11:30 AM",
      enabled: true
    }
  ],
  pricing: {
    foundation: 200,
    regular: 500
  },
  isActive: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## Files Modified/Created

### New Files
- `lib/types/exam-config.ts` - TypeScript types
- `lib/hooks/use-exam-config.ts` - React hook
- `app/api/config/route.ts` - Public API endpoint
- `app/api/admin/config/route.ts` - Admin API endpoint
- `app/api/admin/config/seed/route.ts` - Seeder API endpoint
- `app/admin/config/page.tsx` - Admin UI
- `components/ui/card.tsx` - Card component
- `scripts/seed-exam-config.ts` - CLI seeder
- `docs/CONFIGURATION_SYSTEM.md` - Documentation
- `docs/DEPLOYMENT_CHECKLIST.md` - This file

### Modified Files
- `app/register/page.tsx` - Uses dynamic config
- `components/registration/exam-slots.tsx` - Uses dynamic config
- `package.json` - Added seed script

## Client Handoff Notes

### For the Client
Your registration system is now fully configurable! You can:

1. **Manage Exam Dates**: Add, edit, or remove exam dates anytime
2. **Update Pricing**: Change registration fees without code changes
3. **Enable/Disable Dates**: Control which dates are available for registration

### Access
- Admin Dashboard: `https://your-domain.com/admin`
- Configuration Page: `https://your-domain.com/admin/config`

### Support
For questions or issues, refer to:
- `docs/CONFIGURATION_SYSTEM.md` - Detailed usage guide
- This deployment checklist

## Next Steps (Optional Enhancements)

Future improvements you might consider:
1. Add capacity limits per exam date
2. Add email notifications when dates are updated
3. Add audit log to track configuration changes
4. Add configuration templates for different exam seasons
5. Add bulk import/export of exam dates
6. Add dynamic referral source options
7. Add form field customization
