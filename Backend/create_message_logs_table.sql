-- Create MessageLogs table for storing all notifications (SMS, Push, WhatsApp, Email)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MessageLogs')
BEGIN
    CREATE TABLE MessageLogs (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId UNIQUEIDENTIFIER NOT NULL,
        MessageType NVARCHAR(50) NOT NULL,
        Channel NVARCHAR(20) NOT NULL,
        RecipientContact NVARCHAR(100) NOT NULL,
        Title NVARCHAR(200) NULL,
        Body NVARCHAR(1000) NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        ErrorMessage NVARCHAR(500) NULL,
        RelatedAlertId UNIQUEIDENTIFIER NULL,
        SentAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        DeliveredAt DATETIME2 NULL
    );

    CREATE INDEX IX_MessageLogs_UserId ON MessageLogs(UserId);
    CREATE INDEX IX_MessageLogs_Status ON MessageLogs(Status);
    CREATE INDEX IX_MessageLogs_SentAt ON MessageLogs(SentAt DESC);
    CREATE INDEX IX_MessageLogs_RelatedAlertId ON MessageLogs(RelatedAlertId);

    PRINT 'MessageLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'MessageLogs table already exists';
END
GO
