-- Create NotificationLogs table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotificationLogs')
BEGIN
    CREATE TABLE NotificationLogs (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId UNIQUEIDENTIFIER NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        SentAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsRead BIT NOT NULL DEFAULT 0,
        IsDelivered BIT NOT NULL DEFAULT 0,
        Type NVARCHAR(50) NOT NULL
    );

    -- Create index on UserId for faster queries
    CREATE INDEX IX_NotificationLogs_UserId ON NotificationLogs(UserId);
    
    -- Create index on SentAt for ordering
    CREATE INDEX IX_NotificationLogs_SentAt ON NotificationLogs(SentAt DESC);

    PRINT 'NotificationLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'NotificationLogs table already exists';
END
GO
