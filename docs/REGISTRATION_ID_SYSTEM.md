# Registration ID System

## Overview
The registration ID system provides unique, human-readable identifiers for all BTTH registrations with auto-increment functionality and status tracking.

## Format
```
BTNM-{ExamType}-{Status}-{Number}
```

### Components

1. **BTNM** - Fixed prefix for BTNaviMumbai
2. **ExamType**:
   - `F` = Foundation (Classes 7, 8, 9)
   - `C` = Comp28 (Classes 10, 11, 12)
3. **Status**:
   - `D` = Draft (payment pending)
   - `C` = Completed (payment successful)
4. **Number** - 5-digit auto-incremented sequence (00001, 00002, etc.)

### Examples
- `BTNM-F-D-00001` - Foundation course, Draft status, Registration #1
- `BTNM-C-C-00019` - Comp28 course, Completed status, Registration #19
- `BTNM-F-C-00042` - Foundation course, Completed status, Registration #42

## Implementation

### Files Created/Modified

1. **`lib/registration-id.ts`** - Core utility library
   - `generateRegistrationId()` - Creates new IDs with auto-increment
   - `updateRegistrationIdStatus()` - Updates status when payment completes
   - `parseRegistrationId()` - Extracts components from ID string

2. **`app/api/registrations/draft/route.ts`** - Updated
   - Generates registration ID when draft is created
   - Returns both MongoDB `_id` and `registrationId`

3. **`app/api/payment/verify/route.ts`** - Updated
   - Updates registration ID from `D` (draft) to `C` (completed) on payment success

4. **`app/api/admin/migrate-registration-ids/route.ts`** - New migration endpoint
   - Assigns IDs to existing registrations without IDs
   - Maintains chronological order based on creation date

5. **`app/admin/page.tsx`** - Updated
   - Displays registration ID in table (first column after checkbox)
   - Shows ID in receipt preview dialog
   - Includes ID in CSV/Excel exports

## Database

### Collections

1. **`registrations`** - Added field:
   ```typescript
   {
     registrationId: string  // e.g., "BTNM-F-D-00001"
   }
   ```

2. **`counters`** - New collection for auto-increment:
   ```typescript
   {
     _id: "registrationId",
     sequence: number  // Current counter value
   }
   ```

## Migration for Existing Data

To assign IDs to your existing 6 registrations:

1. **Via API** (requires admin authentication):
   ```bash
   POST /api/admin/migrate-registration-ids
   ```

2. **Response**:
   ```json
   {
     "success": true,
     "message": "Successfully migrated 6 registrations",
     "updated": 6,
     "registrations": [
       { "_id": "...", "registrationId": "BTNM-F-D-00001" },
       ...
     ]
   }
   ```

The migration script:
- Finds all registrations without `registrationId`
- Sorts by `createdAt` (oldest first)
- Assigns sequential IDs based on exam type and status
- Updates the counter to reflect the new sequence

## Usage

### For New Registrations
IDs are automatically generated when a user submits the registration form. No manual intervention needed.

### For Existing Registrations
Run the migration endpoint once to assign IDs to all existing registrations.

### Admin Dashboard
- View registration IDs in the main table
- IDs appear as blue badges with monospace font
- Export includes registration IDs in CSV/Excel
- Receipt preview shows the registration ID prominently

## Benefits

1. **Easy Identification** - Account team can quickly identify registrations as BTNM
2. **Status Tracking** - Status is visible in the ID itself (D vs C)
3. **Exam Type** - Foundation vs Comp28 is immediately clear (F vs C)
4. **Sequential** - Numbers increment automatically, no duplicates
5. **Human-Readable** - Easy to communicate over phone/email

## Technical Notes

- Counter uses MongoDB's `findOneAndUpdate` with `upsert` for atomic increments
- Status updates preserve the sequence number, only changing the status code
- Migration maintains chronological order of existing registrations
- System is thread-safe and handles concurrent registrations
