-- Create SubscriptionLogs table for audit trail
CREATE TABLE SubscriptionLogs (
    LogId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SubscriptionId UNIQUEIDENTIFIER NULL,
    UserId UNIQUEIDENTIFIER NULL,
    EventType NVARCHAR(100) NOT NULL,  -- 'created', 'updated', 'canceled', 'payment_failed', etc.
    EventData NVARCHAR(MAX) NULL,  -- JSON data from Stripe webhook
    CreatedOn DATETIME DEFAULT GETUTCDATE(),
    FOREIGN KEY (SubscriptionId) REFERENCES Subscriptions(SubscriptionId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Create indexes for better query performance
CREATE INDEX IX_SubscriptionLogs_SubscriptionId ON SubscriptionLogs(SubscriptionId);
CREATE INDEX IX_SubscriptionLogs_EventType ON SubscriptionLogs(EventType);
CREATE INDEX IX_SubscriptionLogs_CreatedOn ON SubscriptionLogs(CreatedOn);
