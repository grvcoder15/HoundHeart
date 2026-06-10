-- Add Stripe Customer ID to Users table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'StripeCustomerId')
BEGIN
    ALTER TABLE Users ADD StripeCustomerId NVARCHAR(255) NULL;
END

-- Add index for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_StripeCustomerId' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE INDEX IX_Users_StripeCustomerId ON Users(StripeCustomerId) WHERE StripeCustomerId IS NOT NULL;
END
