-- Create Subscriptions table for Stripe subscription management
CREATE TABLE Subscriptions (
    SubscriptionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    StripeCustomerId NVARCHAR(255) NULL,
    StripeSubscriptionId NVARCHAR(255) NOT NULL,
    StripePriceId NVARCHAR(255) NULL,
    PlanName NVARCHAR(100) NULL,  -- 'Premium Monthly' or 'Premium Yearly'
    Status NVARCHAR(50) NULL,  -- 'active', 'canceled', 'past_due', 'incomplete', 'trialing'
    CurrentPeriodStart DATETIME NULL,
    CurrentPeriodEnd DATETIME NULL,
    CancelAtPeriodEnd BIT DEFAULT 0,
    Amount DECIMAL(10,2) NULL,
    Currency NVARCHAR(10) DEFAULT 'USD',
    CreatedOn DATETIME DEFAULT GETUTCDATE(),
    UpdatedOn DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Create indexes for better query performance
CREATE INDEX IX_Subscriptions_UserId ON Subscriptions(UserId);
CREATE INDEX IX_Subscriptions_Status ON Subscriptions(Status);
CREATE INDEX IX_Subscriptions_StripeSubscriptionId ON Subscriptions(StripeSubscriptionId);
