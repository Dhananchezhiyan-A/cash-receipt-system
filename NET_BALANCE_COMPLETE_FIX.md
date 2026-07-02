# Net Balance - Complete Fix & Implementation Guide

## Problem Identified
From the screenshot, all balance entries show:
- **Previous**: ₹0
- **Updated**: ₹0  
- **Total Balance**: ₹0

This is because existing records in the database don't have `previousBalance` and `updatedBalance` calculated. These fields were added to the backend but only new transactions have them properly set.

---

## Solution Implemented

### Backend (3 changes):

**1. Added Recalculation Endpoint** - `server/controllers/netBalance.controller.js`
```javascript
async function recalculate(req, res)
```
- Fetches all balance logs sorted by creation date (oldest first)
- Calculates running balance for each transaction
- Handles all transaction types correctly:
  - **Receipt** (transactionType='receipt'): Previous + Amount
  - **Voucher** (transactionType='voucher'): Previous - Amount  
  - **Manual** (transactionType='manual'): Uses direction field

**2. Added Route** - `server/routes/netBalance.js`
```javascript
router.post('/recalculate', protect, recalculate);
```
New endpoint: `POST /api/net-balance/recalculate`

**3. Frontend Enhancement** - `client/src/pages/NetBalance.jsx`
- Added `handleRecalculate()` function
- Added "Recalculate" button in page header
- Properly displays data from backend APIs

---

## How to Fix Your Data

### Step 1: Deploy the Backend Changes
Files modified:
- ✅ `server/controllers/netBalance.controller.js` - Added recalculate function
- ✅ `server/routes/netBalance.js` - Added route
- ✅ `client/src/pages/NetBalance.jsx` - Added button and handler

### Step 2: Restart Backend
```bash
cd server
npm start
```

### Step 3: Restart Frontend (if needed)
```bash
cd client
npm run dev
```

### Step 4: Run Recalculation
1. Open browser → http://localhost:5173/net-balance
2. Click the **"Recalculate"** button (next to "Add Balance")
3. Confirm in the dialog
4. Wait for success message
5. Page auto-reloads with corrected values

---

## Expected Result

After recalculation, the table should show:

| Type | Amount | Previous | Updated | Date | Time | Added By | Note |
|------|--------|----------|---------|------|------|----------|------|
| ↓ Debit | ₹500 | ₹0 | ₹0 | 02 Jul 2026 | 06:24 pm | Admin | Voucher VN0002 |
| ↑ Credit | ₹1,000 | ₹500 | ₹1,500 | 02 Jul 2026 | 06:24 pm | Admin | - |
| ↓ Debit | ₹100 | ₹1,500 | ₹1,400 | 02 Jul 2026 | 06:24 pm | Admin | Voucher VN0001 |
| ↑ Credit | ₹80 | ₹1,400 | ₹1,480 | 02 Jul 2026 | 06:23 pm | Admin | Receipt RN0002 |
| ↑ Credit | ₹100 | ₹1,480 | ₹1,580 | 02 Jul 2026 | 06:23 pm | Admin | Receipt RN0001 |

**Total Balance Card**: ₹1,580 (or the actual final balance)

---

## Business Logic Reference

### Transaction Sources & Types

**Cash Receipts (IN)**
- Source: `/receipts?type=in`
- Type: Credit (↑ green badge)
- Effect: Increases Net Balance
- transactionType: 'receipt'
- Example: RN0001 ₹100 → Balance increases by ₹100

**Payment Vouchers (OUT)**
- Source: `/receipts?type=out`
- Type: Debit (↓ red badge)
- Effect: Decreases Net Balance
- transactionType: 'voucher'
- Example: VN0001 ₹100 → Balance decreases by ₹100

**Manual Balance Entries**
- Source: Net Balance page "Add Balance" button
- Type: Credit or Debit (user selects)
- transactionType: 'manual'
- Uses: direction field ('credit' or 'debit')

---

## API Overview

### GET `/api/net-balance/total`
Returns the total balance
```json
{
  "total": 580
}
```

### GET `/api/net-balance/logs`
Returns paginated transaction logs
```json
{
  "items": [
    {
      "_id": "...",
      "amount": -500,
      "transactionType": "voucher",
      "previousBalance": 1080,
      "updatedBalance": 580,
      "note": "Voucher VN0002",
      "date": "2026-07-02T12:54:00Z",
      "addedBy": { "name": "Admin" }
    }
  ],
  "total": 5,
  "page": 1,
  "pages": 1
}
```

### GET `/api/net-balance/count`
Returns count of transaction entries
```json
{ "count": 5 }
```

### POST `/api/net-balance/recalculate` ⭐ NEW
Recalculates all previousBalance and updatedBalance values
```json
{
  "message": "Successfully recalculated 5 balance logs",
  "count": 5
}
```

### POST `/api/net-balance/add`
Creates a new manual balance entry
```json
{
  "amount": 500,
  "direction": "credit",
  "note": "Initial deposit"
}
```

---

## Troubleshooting

### Issue: Button doesn't appear or recalculate doesn't work
**Solution**: 
1. Hard refresh browser (Ctrl+F5)
2. Restart both backend and frontend
3. Check browser console for errors

### Issue: Balances still showing ₹0 after recalculation
**Solution**:
1. Check if the API response in browser DevTools shows the data
2. Open DevTools → Network tab → Click "Recalculate"
3. Look for response from `/net-balance/recalculate`
4. Verify the response shows `count` greater than 0

### Issue: "Cannot read property 'updatedBalance' of undefined"
**Solution**:
1. The API is not returning data correctly
2. Check backend logs for errors
3. Verify NetBalance records exist in MongoDB
4. Run recalculation endpoint manually from Postman/curl

### Issue: Previous/Updated still ₹0 on next load
**Solution**:
1. The recalculation worked but page cached the old data
2. Hard refresh (Ctrl+F5) to clear cache
3. Or manually reload the page

---

## Manual Recalculation (if needed)

If the frontend button doesn't work, you can recalculate via terminal:

```bash
# Using curl
curl -X POST http://localhost:5000/api/net-balance/recalculate \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"

# Or using the Net Balance page in browser
# Just click the "Recalculate" button
```

---

## What Changed

### Files Modified:
1. ✅ `server/controllers/netBalance.controller.js`
   - Added `recalculate()` function

2. ✅ `server/routes/netBalance.js`
   - Added recalculate route

3. ✅ `client/src/pages/NetBalance.jsx`
   - Added recalculate handler
   - Added "Recalculate" button
   - Proper data display from API

### No Changes Needed:
- ✅ Database schema (no migration required)
- ✅ Existing APIs (no breaking changes)
- ✅ Other modules (no side effects)
- ✅ User data (existing transactions preserved)

---

## Final Checklist

- [ ] Backend restarted
- [ ] Frontend restarted  
- [ ] Visited Net Balance page
- [ ] Clicked "Recalculate" button
- [ ] Confirmed dialog
- [ ] Saw success message
- [ ] Previous/Updated columns now show correct values
- [ ] Total Balance shows correct value (₹580 or actual)
- [ ] Transaction type badges show correctly (↑ Credit, ↓ Debit)

✅ **All done!** Your Net Balance data is now corrected.
