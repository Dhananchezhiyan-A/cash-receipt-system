# Net Balance Module - Fix Documentation

## Problem Summary
The Net Balance module was displaying `₹0` for **Previous** and **Updated** balance columns. The system needed to calculate running balances dynamically for each transaction, supporting both credit and debit transactions.

## Changes Made

### 1. **Database Model Update** - [server/models/NetBalance.js](server/models/NetBalance.js)
Added a new field to track transaction direction:

```javascript
direction: { type: String, enum: ['credit', 'debit'], required: true, default: 'credit' }
```

**What this does:**
- Distinguishes between credit (add to balance) and debit (subtract from balance) transactions
- Allows proper calculation of running balances

**Field Summary:**
- `amount`: Transaction amount (₹)
- `direction`: 'credit' or 'debit' - determines if amount is added or subtracted
- `previousBalance`: Balance before this transaction
- `updatedBalance`: Balance after this transaction
- `note`: Transaction description
- `addedBy`: User who added the transaction
- `transactionType`: 'receipt', 'voucher', or 'manual'
- `date`: Transaction date/time

---

### 2. **Controller Logic Update** - [server/controllers/netBalance.controller.js](server/controllers/netBalance.controller.js)

#### **addBalance()** - Fixed to calculate running balance
```javascript
// Get the most recent balance entry
const lastEntry = await NetBalance.findOne().sort({ createdAt: -1 });
const previousBalance = lastEntry?.updatedBalance || 0;

// Calculate updated balance based on direction
if (direction === 'credit') {
  updatedBalance = previousBalance + Number(amount);
} else {
  updatedBalance = previousBalance - Number(amount);
}
```

**How it works:**
1. Fetches the most recent balance entry to get `previousBalance`
2. For **Credit**: `updated = previous + amount`
3. For **Debit**: `updated = previous - amount`
4. Stores both values in the record for audit purposes

#### **getTotalBalance()** - Simplified to use last entry
```javascript
const lastEntry = await NetBalance.findOne().sort({ createdAt: -1 });
const total = lastEntry?.updatedBalance || 0;
```

This is more efficient than aggregating all transactions.

#### **getLogs()** - Updated sorting
Changed from `.sort('-date')` to `.sort({ createdAt: -1 })` to ensure chronological ordering by creation time.

---

### 3. **Frontend Updates** - [client/src/pages/NetBalance.jsx](client/src/pages/NetBalance.jsx)

#### **Added Direction Selector**
Users can now choose between Credit and Debit when adding a balance:

```jsx
<select
  value={direction}
  onChange={(e) => setDirection(e.target.value)}
  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg..."
>
  <option value="credit">Credit (Add to Balance)</option>
  <option value="debit">Debit (Subtract from Balance)</option>
</select>
```

#### **Direction Indicator in Table**
Added a visual badge showing transaction type:

```jsx
<span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
  log.direction === 'credit' 
    ? 'bg-green-100 text-green-700' 
    : 'bg-red-100 text-red-700'
}`}>
  {log.direction === 'credit' ? '↑ Credit' : '↓ Debit'}
</span>
```

- **Green badge**: Credit (↑) - adds to balance
- **Red badge**: Debit (↓) - subtracts from balance

#### **Updated Columns**
Table now shows: Type | Amount | Previous | Updated | Date | Time | Added By | Note

---

### 4. **Migration Script** - [server/scripts/recalculateBalance.js](server/scripts/recalculateBalance.js)

Created a script to fix all existing balance records with proper running balance calculations.

**What it does:**
1. Connects to MongoDB
2. Fetches all balance logs sorted by creation date (oldest first)
3. Recalculates running balance for each entry
4. Updates each record with correct `previousBalance` and `updatedBalance`
5. Displays a summary of changes

---

## Implementation Steps

### **Step 1: Deploy Code Changes**
The following files have been updated:
- ✅ [server/models/NetBalance.js](server/models/NetBalance.js)
- ✅ [server/controllers/netBalance.controller.js](server/controllers/netBalance.controller.js)
- ✅ [client/src/pages/NetBalance.jsx](client/src/pages/NetBalance.jsx)
- ✅ [server/scripts/recalculateBalance.js](server/scripts/recalculateBalance.js) (new)

### **Step 2: Run Migration Script**
Fix all existing balance records:

```bash
cd server
node scripts/recalculateBalance.js
```

**Expected output:**
```
✓ Connected to MongoDB

Processing 5 balance logs...
  ✓ Updated 5/5 records

✓ Successfully recalculated 5 balance logs

Sample calculations:
  Entry 1: Previous ₹0 → Updated ₹500 (CREDIT ₹500)
  Entry 2: Previous ₹500 → Updated ₹1,500 (CREDIT ₹1,000)
  Entry 3: Previous ₹1,500 → Updated ₹1,400 (DEBIT ₹100)
  Entry 4: Previous ₹1,400 → Updated ₹1,500 (CREDIT ₹100)
  Entry 5: Previous ₹1,500 → Updated ₹580 (DEBIT ₹920)

✓ Disconnected from MongoDB
```

### **Step 3: Restart Backend**
```bash
cd server
npm install  # if any new dependencies added
npm start
```

### **Step 4: Clear Client Cache & Reload**
Restart the frontend development server:
```bash
cd client
npm run dev
```

---

## How It Works Now

### Example Scenario:
Starting with zero balance:

| Entry | Type | Amount | Previous | Updated | Direction |
|-------|------|--------|----------|---------|-----------|
| 1 | Credit | ₹500 | ₹0 | ₹500 | ↑ |
| 2 | Credit | ₹1,000 | ₹500 | ₹1,500 | ↑ |
| 3 | Debit | ₹100 | ₹1,500 | ₹1,400 | ↓ |
| 4 | Credit | ₹200 | ₹1,400 | ₹1,600 | ↑ |

### Formula:
```
For each transaction (in chronological order):
  previous = last_entry.updated_balance (or 0 if first)
  
  if direction == 'credit':
    updated = previous + amount
  else:  // debit
    updated = previous - amount
```

---

## Testing Checklist

- [ ] Migration script runs without errors
- [ ] Previous and Updated columns show correct values
- [ ] New balance entries calculate correctly (test with credit)
- [ ] New balance entries calculate correctly (test with debit)
- [ ] Direction badge displays correctly (green for credit, red for debit)
- [ ] Total balance shows the last updated balance
- [ ] Pagination works correctly
- [ ] Date filtering still works

---

## Troubleshooting

### **Migration script fails with "Cannot find module"**
```bash
cd server
npm install
node scripts/recalculateBalance.js
```

### **Previous/Updated still showing ₹0 after migration**
1. Verify script ran successfully (check console output)
2. Check MongoDB connection string in `.env`
3. Manually verify a record: `db.netbalances.findOne()`
4. Run script again: `node scripts/recalculateBalance.js`

### **New entries still calculating wrong**
1. Verify [server/controllers/netBalance.controller.js](server/controllers/netBalance.controller.js) has the new code
2. Restart backend server
3. Clear browser cache and reload

### **Direction selector not appearing**
1. Verify [client/src/pages/NetBalance.jsx](client/src/pages/NetBalance.jsx) has been updated
2. Restart client dev server: `npm run dev`
3. Clear browser cache (Ctrl+Shift+Delete)

---

## API Changes

### POST `/api/net-balance/add`
**Request body (old):**
```json
{
  "amount": 500,
  "note": "Initial deposit"
}
```

**Request body (new):**
```json
{
  "amount": 500,
  "direction": "credit",
  "note": "Initial deposit"
}
```

**Response:** Same as before, but now includes `direction` field

### GET `/api/net-balance/logs`
**Response:**
Logs now include the `direction` field and correctly calculated `previousBalance` and `updatedBalance`.

---

## Benefits

✅ **Accurate Tracking**: Running balance is now calculated correctly for every transaction
✅ **Credit/Debit Support**: Can track both deposits (credit) and withdrawals (debit)
✅ **Audit Trail**: Each record stores previous and updated balance for verification
✅ **Better Visualization**: Direction badges make transactions easy to identify at a glance
✅ **Performance**: Using last entry instead of aggregating all transactions is faster

---

## Notes

- The `direction` field defaults to `'credit'` for backward compatibility
- All existing records should be migrated using the script for accurate historical data
- The system maintains a full audit trail with previous/updated balances for every transaction
- Multiple users can add balances, each transaction is recorded with the user who added it
