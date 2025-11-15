# Stripe API Upgrade - Quick Summary

## Overview
Upgrading from Stripe API version **2022-11-15** to **2025-10-29.clover**

## ✅ Good News: NO CODE CHANGES REQUIRED!

All breaking changes in the API affect features NOT currently used by this codebase.

## Required Actions

### 1. Update Dependencies (REQUIRED)

**File:** `backend/package.json`

Change:
```json
"stripe": "^11.9.1"
```

To:
```json
"stripe": "^19.2.0"
```

Then run:
```bash
cd backend
npm install
```

### 2. Update Node.js (REQUIRED)

Ensure you're running **Node.js 16 or higher**

Check version:
```bash
node --version
```

If below v16, upgrade Node.js before proceeding.

### 3. Update Test Files (RECOMMENDED)

Update the `api_version` field in test files:
- `backend/__tests__/generate-subscription-event.json`
- `backend/__tests__/one-time-payment_FR.json`

Change:
```json
"api_version": "2022-11-15"
```

To:
```json
"api_version": "2025-10-29.clover"
```

### 4. Run Tests (REQUIRED)

```bash
cd backend
npm test
```

## What Changed in Stripe API?

### Breaking Changes (NOT affecting this codebase):
1. ✅ Weekend payout days removed - **Not used**
2. ✅ Discount.coupon field restructured - **Not used**
3. ✅ Account session components removed - **Not used**
4. ✅ Payment method update restrictions - **Not used**
5. ✅ Subscription schedule iterations removed - **Not used**
6. ✅ AccountLink deprecated types removed - **Already using correct values**
7. ✅ Embedded Checkout return_url requirement - **Not using embedded mode**

### New Features Available (Optional to use):
- **Embedded Checkout** with `ui_mode` and `return_url` parameters
- New payment methods: MB WAY, Crypto, Twint, Satispay
- Enhanced payment intent details
- Customer business/individual name fields
- Checkout branding customization

## Full Documentation

For complete details, see **[STRIPE_API_UPGRADE_REPORT.md](./STRIPE_API_UPGRADE_REPORT.md)**

The full report includes:
- Detailed analysis of all breaking changes
- Code snippets and examples
- Migration steps
- Testing strategy
- Rollback plan
- Official Stripe documentation references

## Quick Migration Checklist

- [ ] Review full report (STRIPE_API_UPGRADE_REPORT.md)
- [ ] Verify Node.js >= 16
- [ ] Update package.json
- [ ] Run `npm install`
- [ ] Update test JSON files
- [ ] Run test suite (`npm test`)
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor logs for 24-48 hours

## Questions?

Refer to the comprehensive report or contact Stripe support for API-specific questions.

---

**Report Generated:** 2025-11-15  
**Verified Against:** Official Stripe Node.js Changelog v11.18.0 → v19.2.0+
