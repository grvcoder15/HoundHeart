-- =============================================
-- Community Module Update V2
-- =============================================

-- 1. HealingCircleRegistrations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HealingCircleRegistrations')
BEGIN
    CREATE TABLE HealingCircleRegistrations (
        RegistrationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CircleId       UNIQUEIDENTIFIER NOT NULL,
        UserId         UNIQUEIDENTIFIER NOT NULL,
        RegisteredOn   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Registration_Circle FOREIGN KEY (CircleId) REFERENCES HealingCircles(Id),
        CONSTRAINT FK_Registration_User   FOREIGN KEY (UserId)   REFERENCES Users(UserId)
    );
    CREATE INDEX IX_Registration_Circle ON HealingCircleRegistrations(CircleId);
    CREATE INDEX IX_Registration_User   ON HealingCircleRegistrations(UserId);
    PRINT '✅ HealingCircleRegistrations table created.';
END
GO
