# Approved Plans Visibility Fix

## Problem Identified
Approved plans from supervisors (like Henok) were not displaying the correct approval status to the original plan creators in `StaffViewPlan.jsx`. Plans showed as "Pending" even after being approved by supervisors.

## Root Cause
The `getAllPlans` function in `/backend/controllers/plansFetch.js` was fetching the plan status from the `plans` table (`p.status`) instead of the `approvalworkflow` table (`aw.status`). 

When supervisors approve plans:
1. ✅ The `approvalworkflow` table gets updated with status "Approved"
2. ✅ The `plans` table gets `reporting` set to "active"
3. ❌ **BUG**: The `plans.status` field remained "Pending"

## Solution Applied
**File**: `/backend/controllers/plansFetch.js`

**Change**: Modified the SQL query in `getAllPlans` function to use the approval workflow status instead of the plan status.

### Before:
```sql
p.status AS Status,
```

### After:
```sql
COALESCE(aw.status, p.status) AS Status,
```

This change ensures that:
- If there's an approval workflow status, use that (Approved/Declined)
- If no approval workflow exists, fall back to the plan status (Pending)

## Testing Results ✅

**API Test Confirmed Fix**:
```bash
GET /api/getplan (as staff user adminadmin@itp.et)
```

**Results**:
- Plan 146: Status "Approved" ✅
- Plan 147: Status "Approved" ✅  
- Plan 148: Status "Approved" ✅
- Plan 149: Status "Declined" ✅
- Plan 150: Status "Declined" ✅
- Plan 151: Status "Approved" ✅
- Plan 152: Status "Approved" ✅
- Plan 153: Status "Approved" ✅

## Expected Frontend Behavior
Now in `StaffViewPlan.jsx`, staff users will see:
- ✅ **Approved plans** with green "Approved" status badges
- ✅ **Declined plans** with red "Declined" status badges  
- ✅ **Pending plans** with yellow "Pending" status badges

## System Flow Verification
1. **Staff creates plan** → Status: "Pending" ✅
2. **Supervisor approves plan** → Status: "Approved" ✅
3. **Staff views plan** → Sees "Approved" status ✅
4. **Supervisor declines plan** → Status: "Declined" ✅
5. **Staff views plan** → Sees "Declined" status ✅

## Conclusion
The issue where approved plans from supervisors were not displaying the correct status to original plan creators has been **completely resolved**. Staff users can now see the real-time approval status of their submitted plans.

**Status**: ✅ **FIXED** - Approved plans are now visible with correct status to original plan creators.