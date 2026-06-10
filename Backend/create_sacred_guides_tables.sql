-- =============================================
-- Sacred Guide Tables — Run manually on the DB
-- No ORM migrations are used.
-- =============================================

-- 1. SacredGuides table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SacredGuides')
BEGIN
    CREATE TABLE SacredGuides (
        SacredGuideId   UNIQUEIDENTIFIER  NOT NULL  DEFAULT NEWID()  PRIMARY KEY,
        Title           NVARCHAR(300)     NULL,
        Description     NVARCHAR(2000)    NULL,
        PdfUrl          NVARCHAR(500)     NULL,
        Price           DECIMAL(10,2)     NOT NULL  DEFAULT 12.95,
        Status          NVARCHAR(50)      NOT NULL  DEFAULT 'Draft',
        TotalPages      INT               NULL      DEFAULT 35,
        Chapters        NVARCHAR(MAX)     NULL,
        Distribution    NVARCHAR(100)     NULL      DEFAULT 'Exclusive',
        CreatedOn       DATETIME2         NOT NULL  DEFAULT GETUTCDATE(),
        UpdatedOn       DATETIME2         NULL,
        IsActive        BIT               NOT NULL  DEFAULT 1
    );
    PRINT 'Created table: SacredGuides';
END
ELSE
BEGIN
    PRINT 'Table SacredGuides already exists — checking columns.';
    
    -- 1b. Add TotalPages and Chapters and Distribution if missing (for existing tables)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SacredGuides' AND COLUMN_NAME = 'TotalPages')
    BEGIN
        ALTER TABLE SacredGuides ADD TotalPages INT NULL DEFAULT 35;
        PRINT 'Added column: TotalPages';
    END

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SacredGuides' AND COLUMN_NAME = 'Chapters')
    BEGIN
        ALTER TABLE SacredGuides ADD Chapters NVARCHAR(MAX) NULL;
        PRINT 'Added column: Chapters';
    END

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SacredGuides' AND COLUMN_NAME = 'Distribution')
    BEGIN
        ALTER TABLE SacredGuides ADD Distribution NVARCHAR(100) NULL DEFAULT 'Exclusive';
        PRINT 'Added column: Distribution';
    END
END
GO

-- 2. SacredGuideWaitlist table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SacredGuideWaitlist')
BEGIN
    CREATE TABLE SacredGuideWaitlist (
        WaitlistId      UNIQUEIDENTIFIER  NOT NULL  DEFAULT NEWID()  PRIMARY KEY,
        SacredGuideId   UNIQUEIDENTIFIER  NOT NULL,
        UserId          UNIQUEIDENTIFIER  NOT NULL,
        JoinedOn        DATETIME2         NOT NULL  DEFAULT GETUTCDATE(),
        IsNotified      BIT               NOT NULL  DEFAULT 0,

        CONSTRAINT FK_Waitlist_Guide FOREIGN KEY (SacredGuideId) REFERENCES SacredGuides(SacredGuideId),
        CONSTRAINT FK_Waitlist_User  FOREIGN KEY (UserId)        REFERENCES Users(UserId),
        CONSTRAINT UQ_Waitlist_User_Guide UNIQUE (UserId, SacredGuideId)
    );
    PRINT 'Created table: SacredGuideWaitlist';
END
ELSE
    PRINT 'Table SacredGuideWaitlist already exists — skipped.';
GO

-- 3. SacredGuidePurchase table (tracks Free user purchases)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SacredGuidePurchase')
BEGIN
    CREATE TABLE SacredGuidePurchase (
        PurchaseId      UNIQUEIDENTIFIER  NOT NULL  DEFAULT NEWID()  PRIMARY KEY,
        SacredGuideId   UNIQUEIDENTIFIER  NOT NULL,
        UserId          UNIQUEIDENTIFIER  NOT NULL,
        AmountPaid      DECIMAL(10,2)     NOT NULL  DEFAULT 12.95,
        PurchasedOn     DATETIME2         NOT NULL  DEFAULT GETUTCDATE(),
        PaymentStatus   NVARCHAR(50)      NOT NULL  DEFAULT 'Completed',

        CONSTRAINT FK_Purchase_Guide FOREIGN KEY (SacredGuideId) REFERENCES SacredGuides(SacredGuideId),
        CONSTRAINT FK_Purchase_User  FOREIGN KEY (UserId)        REFERENCES Users(UserId),
        CONSTRAINT UQ_Purchase_User_Guide UNIQUE (UserId, SacredGuideId)
    );
    PRINT 'Created table: SacredGuidePurchase';
END
ELSE
    PRINT 'Table SacredGuidePurchase already exists — skipped.';
GO
