-- ═══════════════════════════════════════════════════════════════════
-- Check and Seed Subscription Plans
-- Run this in SQL Server Management Studio
-- ═══════════════════════════════════════════════════════════════════

-- First, check if plans exist
SELECT COUNT(*) AS PlanCount FROM SubscriptionPlans WHERE IsActive = 1;

-- If the count is 0, run this to seed the plans:

-- Delete existing plans (if any)
DELETE FROM SubscriptionPlans;

-- Insert Trial Period Plan (FREE)
INSERT INTO SubscriptionPlans (
    PlanId,
    PlanName, 
    Description, 
    Price, 
    Currency,
    BillingPeriod,
    StripePriceId,
    Features, 
    DisplayOrder, 
    IsActive,
    CreatedOn
)
VALUES (
    NEWID(),
    'Trial Period',
    'Try before you commit',
    0.00,
    'USD',
    'Forever',
    NULL,  -- Free plan, no Stripe
    '["Try before you buy with our 1 week access pass","Check in a minimum of 3 times a week (excluding the weekends)","Access guided meditations and exercises","Basic community access"]',
    1,
    1,
    GETUTCDATE()
);

-- Insert Premium Pro Pack Plan
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
    DisplayOrder, 
    IsActive,
    CreatedOn
)
VALUES (
    NEWID(),
    'Premium Pro Pack',
    'For dedicated dog parents',
    9.99,
    'USD',
    'monthly',
    'YOUR_STRIPE_MONTHLY_PRICE_ID',  -- 👈 REPLACE WITH YOUR STRIPE PRICE ID
    '["Transform your bond","Check in unlimited times","Unlimited access to Pro Plus features","Intuitive Readings","Access to guided meditations and exercises","Priority email support","Exclusive community forum","Monthly live Q&A sessions"]',
    'Most Popular',
    2,
    1,
    GETUTCDATE()
);

-- Insert Premium Elite Package Plan
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
    DisplayOrder, 
    IsActive,
    CreatedOn
)
VALUES (
    NEWID(),
    'Premium Elite Package',
    'The ultimate connection experience',
    19.99,
    'USD',
    'monthly',
    'YOUR_STRIPE_ELITE_PRICE_ID',  -- 👈 REPLACE WITH YOUR STRIPE PRICE ID
    '["Transform your bond","Check in unlimited times","Everything in Premium Pro Pack","Premium Access Plus Exclusive","Personalized Animal Plan","One-on-one coaching session (monthly)","Advanced tracking and insights","Early access to new features","VIP support (24/7)"]',
    'Current Plan',
    3,
    1,
    GETUTCDATE()
);

-- Verify the plans were inserted
SELECT 
    PlanName, 
    Price, 
    Currency,
    BillingPeriod, 
    Badge,
    IsActive 
FROM SubscriptionPlans 
ORDER BY DisplayOrder;

PRINT '✅ Subscription plans seeded successfully!';
