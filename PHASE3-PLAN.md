# ChargeShare — Phase 3 Plan
## Core Charging Flow

---

## What Phase 3 Delivers

Phase 3 turns ChargeShare from a UI demo into a working P2P product.
After this phase a driver can find a charger, request it, get approved by the host,
charge their car, and pay — end to end, on real data.

---

## Database Tables to Create First

Run these in Supabase SQL Editor before writing any code.

```sql
-- 1. Charging session requests
CREATE TABLE session_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id      UUID REFERENCES chargers(id),
  driver_id       UUID REFERENCES profiles(id),
  host_id         UUID REFERENCES profiles(id),
  status          TEXT DEFAULT 'pending',   -- pending | approved | denied | active | completed | cancelled
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  approved_at     TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  kwh_delivered   NUMERIC(8,3) DEFAULT 0,
  amount_charged  NUMERIC(10,2) DEFAULT 0,
  hold_amount     NUMERIC(10,2) DEFAULT 0,  -- wallet pre-auth hold
  rate_per_kwh    NUMERIC(6,2),
  time_limit_mins INTEGER DEFAULT 120
);

-- 2. Wallet
CREATE TABLE wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE REFERENCES profiles(id),
  balance     NUMERIC(10,2) DEFAULT 0,
  held        NUMERIC(10,2) DEFAULT 0,      -- pre-auth hold amount
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Wallet transactions
CREATE TABLE wallet_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  type        TEXT,   -- topup | hold | release | charge | payout
  amount      NUMERIC(10,2),
  description TEXT,
  session_id  UUID REFERENCES session_requests(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ratings
CREATE TABLE ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES session_requests(id),
  from_user   UUID REFERENCES profiles(id),
  to_user     UUID REFERENCES profiles(id),
  score       INTEGER CHECK (score BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications (for host Allow/Deny)
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  type        TEXT,   -- session_request | session_approved | session_denied | session_ended
  title       TEXT,
  body        TEXT,
  data        JSONB,  -- { session_id, charger_name, driver_name, ... }
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime on notifications (for live host alert)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE session_requests;
```

---

## Feature 1 — Wallet & Pre-Auth Hold
**File:** `src/app/wallet/page.tsx`

### What it does
- Shows balance, held amount, available amount
- Top-up via UPI (mock flow for now)
- When a driver books, ₹(rate × time_limit_mins / 60 × power_kw) is held
- Hold is released on session end; actual cost is deducted
- Transaction history from `wallet_transactions`

### Key logic
```ts
// Pre-auth hold on booking
const holdAmount = (charger.rate_per_kwh * charger.power_kw * (timeLimitMins / 60));
await supabase.from('wallets').update({
  held: wallet.held + holdAmount,
  balance: wallet.balance - holdAmount
}).eq('user_id', driverId);
```

---

## Feature 2 — Host Notification + Allow / Deny
**Files:**
- `src/app/host/page.tsx` — shows pending requests with Allow/Deny
- `src/hooks/useSessionRequests.ts` — Supabase Realtime subscription

### Flow
1. Driver hits **Book** → writes row to `session_requests` (status: `pending`)
   → writes row to `notifications` for the host
2. Host's phone subscribes to `notifications` via Supabase Realtime
3. Host sees an alert card: driver name, vehicle, time requested, rate
4. Host taps **Allow** → status → `approved`, driver sees "Starting..."
5. Host taps **Deny** → status → `denied`, wallet hold is released
6. **Auto-approve toggle** in host settings → if enabled, status goes straight to `approved`

### Realtime subscription pattern
```ts
const channel = supabase
  .channel('host-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${hostId}`
  }, (payload) => {
    // show the Allow/Deny card
    setIncomingRequest(payload.new);
  })
  .subscribe();
```

---

## Feature 3 — Live Session Screen
**File:** `src/app/session/[id]/page.tsx` (new page)

### What it does
Both driver and host see this screen once approved:
- Live kWh counter (ticks every 10s based on charger power)
- Live cost counter
- Time remaining (from host's set limit)
- Battery level estimate
- Stop button → ends session, triggers final payment

### Auto-end triggers
- Time limit reached
- Battery reaches 100% (estimated)
- Host force-stops from their screen
- Driver taps Stop

### On session end
```ts
// 1. Write final kwh + cost to session_requests
// 2. Release hold, deduct actual cost from wallet
// 3. Credit host wallet (minus 15% platform fee)
// 4. Write wallet_transactions for both parties
// 5. Trigger post-session rating modal
```

---

## Feature 4 — Post-Session Rating
**File:** Modal inside `src/app/session/[id]/page.tsx`

### What it does
- After session ends, both driver and host get a rating prompt
- 1–5 stars + optional comment
- Ratings update the `rating` column on `profiles` (running average)
- After 3 bad ratings (≤2 stars), user gets a warning notification
- After 5 bad ratings, account is flagged for review

### Rating update query
```ts
// Recalculate running average
const { data: existing } = await supabase
  .from('ratings')
  .select('score')
  .eq('to_user', toUserId);

const avg = existing.reduce((a, r) => a + r.score, 0) / existing.length;
await supabase.from('profiles').update({ rating: avg }).eq('id', toUserId);
```

---

## Feature 5 — Vehicle Registration at Onboarding
**File:** `src/app/onboarding/page.tsx`

### What it changes
Add a registration number field to Step 1 (Personal Details):

```tsx
<Field
  label="Vehicle Registration No."
  value={regNumber}
  onChange={setRegNumber}
  placeholder="HR26DK1234"
/>
```

Save to `profiles.vehicle_reg_number`. Used for host trust display
("Verified vehicle: HR26DK1234") and dispute resolution.

---

## Build Order

| # | Feature | Est. Time | Depends On |
|---|---------|-----------|------------|
| 1 | DB migration (SQL above) | 15 min | Nothing |
| 2 | Vehicle reg on onboarding | 20 min | Nothing |
| 3 | Wallet page redesign + top-up | 1.5 hrs | DB |
| 4 | Booking → pre-auth hold | 1 hr | Wallet |
| 5 | Host notification + Allow/Deny | 2 hrs | DB, Realtime |
| 6 | Live session screen | 2 hrs | Host approval |
| 7 | Post-session rating | 1 hr | Session end |

**Total estimate: ~8 hours of focused work across multiple chats.**

---

## What Each Page Looks Like After Phase 3

### Home page `/`
- Book button → checks wallet balance first
- If insufficient → "Top up wallet" prompt
- If sufficient → writes session_request → "Waiting for host..."
- If auto-approved → jumps straight to session screen

### Host page `/host`
- Incoming request card (Realtime — appears instantly)
- Allow / Deny buttons
- Active sessions list
- Earnings summary
- Auto-approve toggle

### Wallet page `/wallet`
- Available balance (balance minus held)
- Held amount shown separately with session link
- Top-up button
- Transaction history

### Session page `/session/[id]`
- Live kWh + cost
- Battery estimate
- Time remaining
- Stop button
- Both driver and host see this

### Profile page `/profile` *(already redesigned)*
- Personal info (edit mode)
- Garage (vehicles)
- History (real sessions from DB)
- Host settings (KYC, payout, auto-approve toggle)

---

## First Task for Next Chat

**Start with Feature 5 (vehicle reg) + Feature 3 (wallet).**
They are independent of each other and unblock everything else.

Share the current `wallet/page.tsx` and `onboarding/page.tsx` files
and we'll build both in one session.
