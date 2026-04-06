# ZYRON - MANUAL TEST PLAN FOR PERSISTENCE FIXES

## 🧪 Test Environment Setup

- Use Chrome DevTools → Application → Local Storage to monitor values
- Open Supabase Dashboard → daily_stats table to verify database updates
- **Browser Console** should show minimal errors after fixes

---

## ✅ TEST 1: Water Persistence (CRITICAL)

### Scenario A: Add Water & Reload

```
Steps:
1. Open app, go to "Painel" (dashboard)
2. Note current water value (e.g., 0ml)
3. Click "+250ml" button 4 times
   └─ UI should show 1000ml ✅
   └─ DevTools LocalStorage: gym_daily.water = 1000 ✅
4. Inspect Supabase daily_stats table:
   └─ Row with today's date, user_id, water_amount = 1000 ✅
5. Refresh page (F5)
6. Verify water still shows 1000ml ✅

Expected Result: Water value persists after reload
Failure Sign: Water resets to 0 after reload
```

### Scenario B: Water Increment Atomicity

```
Steps:
1. Start with water = 0ml
2. Quickly click "+250ml" twice in succession
   └─ UI should show 500ml
3. Wait 2 seconds (allow Supabase sync)
4. Check Supabase daily_stats.water_amount = 500 ✅
5. Reload page
6. Verify water = 500ml ✅

Expected Result: Multiple increments don't conflict
Failure Sign: Water shows 250ml or 750ml (lost one increment)
```

---

## ✅ TEST 2: Protein Persistence (CRITICAL)

### Scenario A: Add Protein & Reload

```
Steps:
1. Open app, go to "Painel"
2. Note current protein value (e.g., 0g)
3. Click "+30g" button 3 times
   └─ UI should show 90g ✅
4. Inspect Supabase daily_stats table:
   └─ Row with today's date, protein_amount = 90 ✅
5. Refresh page (F5)
6. Verify protein still shows 90g ✅

Expected Result: Protein value persists after reload
Failure Sign: Protein resets to 0g after reload
```

### Scenario B: Water + Protein Together

```
Steps:
1. Add 250ml water → UI shows 250ml
2. Add 30g protein → UI shows 30g
3. Add another 250ml water → UI shows 500ml
4. Check Supabase:
   └─ water_amount = 500 ✅
   └─ protein_amount = 30 ✅
5. Reload page
6. Verify both values persist ✅

Expected Result: Both metrics sync independently
Failure Sign: One value overwrites the other
```

---

## ✅ TEST 3: Weight Persistence (IMPORTANT)

### Scenario A: Update Weight via Evolução Tab

```
Steps:
1. Go to "Evolução" tab
2. Find "PESO" card
3. Click on weight value (e.g., "75kg")
4. Enter new value: "78"
5. Confirm/Save
   └─ UI should update to 78kg ✅
   └─ No errors in console ✅
6. Wait 2 seconds (allow sync)
7. Inspect Supabase:
   └─ profiles table, bio.weightKg = 78 ✅
   └─ daily_stats table, weight_kg = 78 ✅
8. Reload page
9. Verify weight = 78kg in both Painel and Evolução ✅

Expected Result: Weight syncs to both tables and persists
Failure Sign: Weight resets or updates only in one place
```

### Scenario B: Weight in different tabs shows same value

```
Steps:
1. Set weight to 80kg in Evolução tab
2. Switch to Painel tab → weight should be 80kg
3. Switch to Treino → weight should be 80kg
4. Go back to Evolução → weight should be 80kg

Expected Result: All tabs show consistent weight value
Failure Sign: Different tabs show different weight values
```

---

## ✅ TEST 4: Profile Field Persistence (IMPORTANT)

### Scenario A: Edit Single Profile Field

```
Steps:
1. Go to "Perfil" → "GERAL" tab
2. Find "IDADE" card
3. Click on age value (e.g., "25")
4. Change to "30"
5. Click "Salvar" button
   └─ Modal should close ✅
   └─ Card should update to "30" ✅
6. Wait 2 seconds
7. Inspect Supabase:
   └─ profiles table, bio.age = 30 ✅
8. Reload page
9. Verify age still = "30" ✅

Expected Result: Single field edit persists
Failure Sign: Age reverts to old value or shows error
```

### Scenario B: Edit Multiple Profile Fields

```
Steps:
1. Edit IDADE → 28
2. Save ✅
3. Edit ALTURA → 180
4. Save ✅
5. Edit PESO → 82
6. Save ✅
7. Edit OBJETIVO → Definição
8. Save ✅
9. Reload page
10. Verify all fields have new values ✅

Expected Result: All edits persist independently
Failure Sign: Some fields revert while others save
```

### Scenario C: Edit Goal Fields

```
Steps:
1. Go to "GERAL" tab
2. Find "OBJETIVO" card
3. Click and select "Força"
4. Save ✅
5. Find "NÍVEL" card
6. Click and select "Avançado"
7. Save ✅
8. Reload page
9. Verify OBJETIVO = "Força" ✅
10. Verify NÍVEL = "Avançado" ✅

Expected Result: Goal-related fields persist
Failure Sign: Settings revert or show null/undefined
```

---

## ✅ TEST 5: Avatar Upload

### Scenario A: Upload New Avatar

```
Steps:
1. Go to "Perfil" → "GERAL" tab
2. Click avatar image area
3. Select an image file (PNG/JPG, <5MB)
4. Image should upload and display immediately ✅
5. Wait for "Salvando..." to disappear ✅
6. Check Supabase:
   └─ profiles table, avatar_url = [new URL] ✅
7. Reload page
8. Verify new avatar still shows ✅

Expected Result: Avatar uploads and persists
Failure Sign: Avatar doesn't display, errors in console, or reverts
```

---

## ✅ TEST 6: Data Consistency Across Sessions

### Scenario A: Session A → Session B (Same User)

```
Session A:
1. Add 500ml water
2. Add 60g protein
3. Set weight to 79kg
4. Close browser (or logout)

Session B:
1. Open browser (or login again)
2. Verify water = 500ml ✅
3. Verify protein = 60g ✅
4. Verify weight = 79kg ✅

Expected Result: Data persists across sessions
Failure Sign: Data resets or shows 0/default values
```

---

## 🔍 DEBUGGING CHECKLIST

If tests FAIL, check:

### Check 1: Browser DevTools → Network
```
When you add 250ml water, should see:
1. POST /rest/v1/daily_stats (upsert operation)
2. Response: 200 OK with updated row
3. If error, check Supabase error message
```

### Check 2: Browser DevTools → Console
```
Look for errors matching:
- "Failed to sync metrics to Supabase"
- "Failed to update metrics"
- "Failed to update profile"
- Any 403 (permission) errors

If found, note the full error and check:
- Supabase RLS policies for current user
- auth.uid() matches user_id in database
```

### Check 3: Supabase Dashboard
```
Go to: Supabase Project → SQL Editor
Run:
SELECT user_id, date, water_amount, protein_amount, weight_kg, updated_at
FROM daily_stats
WHERE date = TODAY()
ORDER BY updated_at DESC
LIMIT 10;
```

### Check 4: LocalStorage (for offline fallback)
```
Browser DevTools → Application → Local Storage
Look for key: "daily_metrics_[YYYY-MM-DD]"
Value should contain: { waterMl, proteinG, weightKg }
```

---

## 📋 Regression Test Matrix

| Feature | Test Case | Expected | Status |
|---------|-----------|----------|--------|
| Water | Add + Reload | Persists | ❓ |
| Protein | Add + Reload | Persists | ❓ |
| Weight | Edit + Reload | Persists | ❓ |
| Profile Age | Edit + Reload | Persists | ❓ |
| Profile Height | Edit + Reload | Persists | ❓ |
| Profile Gender | Select + Reload | Persists | ❓ |
| Profile Objetivo | Select + Reload | Persists | ❓ |
| Avatar | Upload + Reload | Displays | ❓ |
| Multiple Users | Each has own data | Isolated | ❓ |
| Offline Mode | Add data, go online | Syncs | ❓ |

---

## 🎯 Success Criteria

All tests PASS when:
- ✅ Water values persist after reload
- ✅ Protein values persist after reload
- ✅ Weight values persist after reload
- ✅ Profile fields persist after reload
- ✅ Avatar displays correctly
- ✅ No console errors about sync failures
- ✅ Supabase shows updated rows with correct timestamps
- ✅ Different users have isolated data
- ✅ Rapid updates don't cause data loss

---

## 📝 Test Results Template

```
Date: _______________
Tester: ______________
Device: _____________
Browser: ____________

TEST 1: Water Persistence
  Scenario A: [ ] PASS [ ] FAIL
  Scenario B: [ ] PASS [ ] FAIL
  Notes: _____________

TEST 2: Protein Persistence
  Scenario A: [ ] PASS [ ] FAIL
  Scenario B: [ ] PASS [ ] FAIL
  Notes: _____________

TEST 3: Weight Persistence
  Scenario A: [ ] PASS [ ] FAIL
  Scenario B: [ ] PASS [ ] FAIL
  Notes: _____________

TEST 4: Profile Field Persistence
  Scenario A: [ ] PASS [ ] FAIL
  Scenario B: [ ] PASS [ ] FAIL
  Scenario C: [ ] PASS [ ] FAIL
  Notes: _____________

TEST 5: Avatar Upload
  Scenario A: [ ] PASS [ ] FAIL
  Notes: _____________

TEST 6: Data Consistency
  Scenario A: [ ] PASS [ ] FAIL
  Notes: _____________

OVERALL: [ ] ALL PASS [ ] SOME FAIL [ ] ALL FAIL
```
