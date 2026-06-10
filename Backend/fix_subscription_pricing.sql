-- ═══════════════════════════════════════════════════════════════════
-- Fix Subscription Pricing (SQL Server)
-- Updates subscription plans to correct prices and plan names
-- Current Issue: Premium Yearly is $999 (should be $149.99)
-- Run in SQL Server Management Studio
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Verify current plans
SELECT PlanId, PlanName, Price, BillingPeriod, Badge, SavingsText, IsActive 
FROM SubscriptionPlans 
ORDER BY DisplayOrder;

-- Step 2: Delete existing plans
DELETE FROM SubscriptionPlans;

-- Step 3: Insert corrected subscription plans

-- Free Member Plan
INSERT INTO SubscriptionPlans (
    PlanId,
    PlanName, 
    Description, 
    Price, 
    Currency,
    BillingPeriod,
    StripePriceId,
    Features, 
    Badge,
    SavingsText,
    DisplayOrder, 
    IsActive,
    CreatedOn
)
VALUES (
    NEWID(),
    'Free Member',
    'Essential access to begin your HoundHeart journey',
    0.00,
    'USD',
    'Forever',
    NULL,
    '[
        "Create and manage account",
        "Create and manage dog profile(s)",
        "Basic app access",
        "Access to newsletter and announcements",
        "Purchase books and merchandise"
    ]',
    NULL,
    NULL,
    1,
    1,
    GETUTCDATE()
);

-- HoundHeart Plus Monthly Plan ($9.99/month) - CORRECTED
INSERT INTO SubscriptionPlans (
    PlanId,
    PlanName, 
    Description, 
    Price, 
    Currency,
    BillingPeriod,
    StripePriceId,
    Features,
    Badge,
    SavingsText,
    DisplayOrder, 
    IsActive,
    CreatedOn
)
VALUES (
    NEWID(),
    'HoundHeart Plus',
    'Advanced wellness and connection tools for dedicated members',
    9.99,
    'USD',
    'monthly',
    'YOUR_STRIPE_PLUS_MONTHLY_PRICE_ID',
    '[
        "Includes all Free Member features",
        "Full app access",
        "Full Bonded Score access",
        "Wellness tracking tools",
        "Free digital and audio book",
        "Travel directory access",
        "Partner discounts and wearable connection"
    ]',
    'Most Popular',
    NULL,
    2,
    1,
    GETUTCDATE()
);

-- HoundHeart Plus Yearly Plan ($79.99/year) - NEW
INSERT INTO SubscriptionPlans (
    PlanId,
    PlanName, 
    Description, 
    Price, 
    Currency,
    BillingPeriod,
    StripePriceId,
    Features,
    Badge,
    SavingsText,
    DisplayOrder, 
    IsActive,
    CreatedOn
)
VALUES (
    NEWID(),
    'HoundHeart Plus',
    'Advanced wellness and connection tools for dedicated members',
    79.99,
    'USD',
    'yearly',
    'YOUR_STRIPE_PLUS_YEARLY_PRICE_ID',
    '[
        "Includes all Free Member features",
        "Full app access",
        "Full Bonded Score access",
        "Wellness tracking tools",
        "Free digital and audio book",
        "Travel directory access",
        "Partner discounts and wearable connection"
    ]',
    'Best Value',
    'Save $40/year (17% off)',
    3,
    1,
    GETUTCDATE()
);

-- HoundHeart Premium Yearly Plan ($149.99/year) - CORRECTED FROM $999
INSERT INTO SubscriptionPlans (
    PlanId,
    PlanName, 
    Description, 
    Price, 
    Currency,
    BillingPeriod,
    StripePriceId,
    Features,
    Badge,
    SavingsText,
    DisplayOrder, 
    IsActive,
    CreatedOn
)
VALUES (
    NEWID(),
    'HoundHeart Premium',
    'The complete premium lifestyle package for top-tier members',
    149.99,
    'USD',
    'yearly',
    'YOUR_STRIPE_PREMIUM_YEARLY_PRICE_ID',
    '[
        "Includes all HoundHeart Plus features",
        "Paperback HoundHeart book",
        "Official HoundHeart T-shirt",
        "$10 donation to animal welfare charities",
        "Travel Club access and premium discounts",
        "Premium Member badge in profile"
    ]',
    'Best Value',
    'Yearly Only',
    4,
    1,
    GETUTCDATE()
);

-- Step 4: Verify the updated plans
SELECT 
    PlanName, 
    Price, 
    BillingPeriod,
    Badge,
    SavingsText,
    IsActive 
FROM SubscriptionPlans 
ORDER BY DisplayOrder;

-- Summary:
-- ✅ Free Member: $0 Forever
-- ✅ HoundHeart Plus Monthly: $9.99/month
-- ✅ HoundHeart Plus Yearly: $79.99/year (Save $40/year)
-- ✅ HoundHeart Premium Yearly: $149.99/year (was $999 ❌)

PRINT '✅ Subscription pricing corrected successfully!';
