-- ═══════════════════════════════════════════════════════════════════
-- Create SubscriptionPlans Table
-- Store subscription plan configurations (pricing, features, etc.)
-- ═══════════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SubscriptionPlans')
BEGIN
    CREATE TABLE SubscriptionPlans (
        PlanId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PlanName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        Price DECIMAL(10,2) NOT NULL,
        Currency NVARCHAR(10) DEFAULT 'USD',
        BillingPeriod NVARCHAR(50) NOT NULL, -- 'monthly', 'yearly'
        StripePriceId NVARCHAR(255), -- Stripe Price ID from Stripe Dashboard
        Features NVARCHAR(MAX), -- JSON array of features
        Badge NVARCHAR(50), -- e.g., 'BEST VALUE', 'POPULAR'
        SavingsText NVARCHAR(100), -- e.g., 'Save $20 (17% off)'
        DisplayOrder INT DEFAULT 0,
        IsActive BIT DEFAULT 1,
        CreatedOn DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedOn DATETIME2
    );

    PRINT 'SubscriptionPlans table created successfully.';
END
ELSE
BEGIN
    PRINT 'SubscriptionPlans table already exists.';
END
GO

-- ═══════════════════════════════════════════════════════════════════
-- Seed Default Subscription Plans
-- ═══════════════════════════════════════════════════════════════════

-- Monthly Plan
IF NOT EXISTS (SELECT * FROM SubscriptionPlans WHERE BillingPeriod = 'monthly')
BEGIN
    INSERT INTO SubscriptionPlans (
        PlanName, 
        Description, 
        Price, 
        BillingPeriod, 
        Features, 
        DisplayOrder, 
        IsActive
    )
    VALUES (
        'Premium Monthly',
        'Perfect for exploring all premium features',
        9.99,
        'monthly',
        '["Full Sacred Guide Access","Unlimited Chakra Rituals","Premium Guided Practices","Ad-Free Experience","Priority Support","All Future Features"]',
        1,
        1
    );
    PRINT 'Monthly plan seeded successfully.';
END

-- Yearly Plan
IF NOT EXISTS (SELECT * FROM SubscriptionPlans WHERE BillingPeriod = 'yearly')
BEGIN
    INSERT INTO SubscriptionPlans (
        PlanName, 
        Description, 
        Price, 
        BillingPeriod, 
        Features, 
        Badge,
        SavingsText,
        DisplayOrder, 
        IsActive
    )
    VALUES (
        'Premium Yearly',
        'Best value - Save with annual billing',
        99.00,
        'yearly',
        '["Everything in Monthly Plan","Save $20 per year","Exclusive Yearly Perks","Early Access to New Features","VIP Community Badge","30-Day Money Back Guarantee"]',
        'BEST VALUE',
        'Save $20 (17% off)',
        2,
        1
    );
    PRINT 'Yearly plan seeded successfully.';
END

GO

-- Create index for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SubscriptionPlans_IsActive_DisplayOrder')
BEGIN
    CREATE INDEX IX_SubscriptionPlans_IsActive_DisplayOrder 
    ON SubscriptionPlans(IsActive, DisplayOrder);
    PRINT 'Index created on SubscriptionPlans.';
END
GO

PRINT '✅ SubscriptionPlans table setup complete!';
PRINT 'NOTE: Update StripePriceId column after creating products in Stripe Dashboard.';
GO
