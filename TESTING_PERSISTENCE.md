# Testing ZYRON Persistence Layer

**Version**: 1.0
**Date**: April 6, 2026
**Status**: Ready for Testing

---

## Quick Start

### 1. Start the App
```bash
cd /sessions/exciting-great-mccarthy/mnt/zyron
npm run dev
```
The app will be available at: http://localhost:5173

### 2. Login with Test Account
- **Email**: raiiimundoemanuel2018@gmail.com
- **Password**: manu2026

### 3. Verify Login Success
After login, you should see:
- ✅ Loading screen "FORJANDO RESULTADOS..."
- ✅ Profile creation (if first time)
- ✅ App dashboard

---

## Manual Testing Checklist

### Test 1: Profile Creation
**Objective**: Verify new user profile is created in Supabase

**Steps**:
1. Login with test account
2. Check browser console for: `[RBACGuard] Role fetched via service: USER`
3. Verify in Supabase:
   - Go to profiles table
   - Should see one row with user ID = test account ID

**Expected Result**: ✅ Profile exists with all default values

---

### Test 2: Water Intake Persistence
**Objective**: Verify daily metrics persist to Supabase

**Steps**:
1. Navigate to main screen
2. Click "Add Water" or update water value
3. Enter: 250 ml
4. Wait 2 seconds for async sync
5. Hard reload page (Ctrl+Shift+R)
6. Check if water value is still 250 ml

**Expected Result**: ✅ Water value persists after reload

**Debug Info**:
- Check localStorage: `zyron_cache_daily_metrics_YYYY-MM-DD`
- Check Supabase daily_stats table

---

### Test 3: Exercise Load Persistence
**Objective**: Verify exercise PRs persist

**Steps**:
1. Go to workout screen
2. Set exercise load: "Leg Press: 100kg"
3. Complete the workout
4. Hard reload page
5. Check if load is still saved

**Expected Result**: ✅ Exercise load visible after reload

**Debug Info**:
- Check localStorage: `zyron_cache_exercise_loads`
- Check Supabase exercise_prs table

---

### Test 4: Exercise Completion Tracking
**Objective**: Verify completed exercises are tracked

**Steps**:
1. Start a workout
2. Click checkbox to mark exercises as complete
3. Hard reload page
4. Check if exercises remain marked

**Expected Result**: ✅ Exercise state persists

**Debug Info**:
- Check localStorage: `zyron_cache_completions_YYYY-MM-DD`
- Check Supabase workout_logs table

---

### Test 5: Offline Mode
**Objective**: Verify app works offline with localStorage

**Steps**:
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Try to update metrics (water, protein, etc.)
5. Changes should be saved to localStorage
6. Uncheck "Offline"
7. Changes should sync to Supabase

**Expected Result**: ✅ Offline updates sync when online

---

### Test 6: Preference Persistence
**Objective**: Verify user preferences save

**Steps**:
1. Go to Settings
2. Toggle "Night Mode" ON
3. Hard reload page
4. Check if Night Mode is still ON

**Expected Result**: ✅ Preference persists

**Debug Info**:
- Check Supabase profiles table: night_mode column
- Check localStorage: `zyron_cache_preferences_USERID`

---

### Test 7: Multi-Tab Sync (Advanced)
**Objective**: Verify data syncs across browser tabs

**Steps**:
1. Open http://localhost:5173 in two tabs
2. In Tab A: Update water intake to 500ml
3. In Tab B: Hard reload
4. Check if Tab B shows 500ml

**Expected Result**: ✅ Data syncs across tabs

**Note**: This requires Supabase realtime subscriptions (not yet implemented)

---

## Console Debugging

### View Logs in Browser Console
```javascript
// Open DevTools (F12), go to Console tab

// View all logs
console.log("Filter by logger messages")

// Filter for specific messages
- Search: "ProfileService"
- Search: "RBACGuard"
- Search: "useDailyMetrics"
- Search: "Error"
```

### Check localStorage
```javascript
// In browser console:

// View all ZYRON cache
Object.keys(localStorage).filter(k => k.includes('zyron_cache'))

// Get specific value
JSON.parse(localStorage.getItem('zyron_cache_daily_metrics_2026-04-06'))

// Clear all cache
Object.keys(localStorage).forEach(k => {
  if (k.includes('zyron_cache')) localStorage.removeItem(k);
})
```

### Check Supabase
1. Go to https://app.supabase.com/project/rhdrscomxprooqkrrsbg/
2. Click "Editor" → Select table
3. View data in real-time
4. Check for your user ID in the rows

---

## Performance Testing

### Load Time Test
```javascript
// In browser console, paste at page start:
performance.mark('app-start');
// Then when app fully loads:
performance.mark('app-end');
performance.measure('app-load', 'app-start', 'app-end');
console.log(performance.getEntriesByName('app-load')[0].duration);
```

**Target**: < 3000ms

### Sync Time Test
```javascript
// Time how long async Supabase sync takes
// Should complete in < 500ms in good network conditions
// Watch console logs for timing info
```

---

## Troubleshooting

### Profile Creation Fails
**Error**: "Falha ao criar perfil inicial."

**Solutions**:
1. Check Supabase RLS: `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`
2. Verify user is authenticated: Check auth session
3. Check network: Open DevTools → Network tab
4. Clear browser cache: Ctrl+Shift+Delete

### Data Not Saving
**Steps**:
1. Check localStorage: Is data being cached locally?
   - If YES: Problem is Supabase sync
   - If NO: Problem is in React hooks

2. Check Supabase connection:
   - Can you access https://app.supabase.com/ ?
   - Are tables visible?

3. Check browser console for errors:
   - Look for "Error" messages
   - Check network requests to supabase.co

### Data Resets After Reload
**Cause**: localStorage not being saved properly

**Solution**:
```javascript
// Check storage is enabled
typeof(Storage) !== "undefined" // Should be true

// Check storage quota
navigator.storage.estimate().then(({usage, quota}) => {
  console.log(`Using ${usage} of ${quota} bytes`);
})
```

---

## Network Monitoring

### Monitor Supabase Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by: `supabase.co`
4. Perform an action (update water, etc.)
5. Watch requests appear:
   - POST to `/rest/v1/daily_stats` → Create/update
   - GET to `/rest/v1/profiles` → Fetch
   - UPSERT operations

### Expected Request Pattern
```
1. User updates water: 250ml
   ↓
2. [Optimistic] UI updates immediately
   ↓
3. [Async] POST /rest/v1/daily_stats
   └─ Body: { water_amount: 250 }
   └─ Response: 200 OK
   ↓
4. [Sync] data matches between local & Supabase
```

---

## Success Metrics

| Metric | Expected | Actual |
|--------|----------|--------|
| Profile creation time | < 2s | ? |
| Water update sync time | < 1s | ? |
| Page load with existing data | < 3s | ? |
| Offline mode works | Yes | ? |
| Multi-tab sync | Yes | ? |
| Error recovery | < 5s | ? |

---

## Logging

### Enable Detailed Logging
Add to `src/utils/logger.js`:
```javascript
// Set this to 'development' to see all logs
process.env.NODE_ENV = 'development'
```

### View Specific Logs
- **Profile logs**: `[ProfileService]`
- **RBAC logs**: `[RBACGuard]`
- **Persistence logs**: `[useDailyMetrics]`, `[useExerciseLoads]`
- **Network errors**: Filter by "error"

---

## Testing Checklist

### Before Production ✅
- [ ] Profile creation works
- [ ] Water intake persists
- [ ] Exercise loads persist
- [ ] Offline mode works
- [ ] Page reload preserves data
- [ ] Multiple users work independently
- [ ] RLS policies work (after re-enabling)
- [ ] No console errors
- [ ] No network 404 errors
- [ ] Storage quota not exceeded

### Performance ✅
- [ ] App loads in < 3 seconds
- [ ] Updates sync in < 1 second
- [ ] No memory leaks with DevTools
- [ ] localStorage usage < 5MB

### Security ✅
- [ ] RLS enabled on all tables
- [ ] Users can't access other users' data
- [ ] Anon key is not exposed in code
- [ ] No sensitive data in console logs

---

## Sample Test Data

### User Profile
```json
{
  "id": "user-id-from-supabase",
  "name": "ATLETA",
  "email": "raiiimundoemanuel2018@gmail.com",
  "role": "USER",
  "goal": "hipertrofia",
  "level": "iniciante"
}
```

### Daily Stats
```json
{
  "user_id": "user-id",
  "date": "2026-04-06",
  "water_amount": 2500,
  "protein_amount": 150
}
```

### Exercise PR
```json
{
  "user_id": "user-id",
  "exercise_id": "l1",
  "max_load": 100.5
}
```

---

## Getting Help

### View Logs
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors with `[ProfileService]`, `[RBACGuard]`, etc.

### Check Network
1. Open DevTools (F12)
2. Go to Network tab
3. Perform an action
4. Look for requests to `supabase.co`
5. Check response status and body

### Clear Everything & Start Fresh
```bash
# In browser console:
localStorage.clear();
location.reload();

# Then login again
```

---

## Notes

- **First Load**: May take 2-3 seconds while profile is created
- **Subsequent Loads**: Should be instant with cached data
- **Network**: All operations require internet except viewing cached data
- **Browser Compatibility**: Works on Chrome, Firefox, Safari, Edge

---

**Version**: 1.0
**Last Updated**: April 6, 2026
**Next Review**: After user testing
