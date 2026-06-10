-- Fix SubscriptionPlans: replace placeholder StripePriceId values with real Stripe IDs
-- Run against: HoundedHeart (SQL Server / SQLEXPRESS)

-- Verify current state first
SELECT PlanName, BillingPeriod, Price, StripePriceId FROM SubscriptionPlans ORDER BY DisplayOrder;

-- Plus Monthly
UPDATE SubscriptionPlans
SET StripePriceId = 'price_1TesMwRNiaSVtReCRrmRgJMj',
    UpdatedOn     = GETUTCDATE()
WHERE BillingPeriod = 'monthly'
  AND Price > 0;

-- Plus Yearly (price <= $80)
UPDATE SubscriptionPlans
SET StripePriceId = 'price_1TesPlRNiaSVtReCCVgag5qU',
    UpdatedOn     = GETUTCDATE()
WHERE BillingPeriod = 'yearly'
  AND Price <= 80
  AND Price > 0;

-- Premium Yearly (price > $80)
UPDATE SubscriptionPlans
SET StripePriceId = 'price_1TesONRNiaSVtReC8mVvxiXz',
    UpdatedOn     = GETUTCDATE()
WHERE BillingPeriod = 'yearly'
  AND Price > 80;

-- Verify result
SELECT PlanName, BillingPeriod, Price, StripePriceId FROM SubscriptionPlans ORDER BY DisplayOrder;
PRINT '✅ Stripe price IDs updated successfully';
