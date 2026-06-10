-- Fix Database Schema Issues
-- This script ensures all required tables and columns exist for the baseline functionality

USE [HoundedHeart];
GO

PRINT 'Starting database schema fixes...';

-- 1. Ensure DogBaselines table exists with correct schema
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DogBaselines' AND xtype='U')
BEGIN
    PRINT 'Creating DogBaselines table...';
    CREATE TABLE [dbo].[DogBaselines] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [DogId] uniqueidentifier NOT NULL UNIQUE,
        [AvgHeartRate] float NULL,
        [AvgActivityScore] float NOT NULL DEFAULT 0,
        [AvgRestScore] float NOT NULL DEFAULT 0,
        [AvgTemperature] float NULL,
        [AvgRespirationRate] float NULL,
        [DaysOfDataCollected] int NOT NULL DEFAULT 0,
        [LastUpdatedUtc] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [DogBaselineEstablished] bit NOT NULL DEFAULT 0
    );
    
    -- Add foreign key constraint
    ALTER TABLE [dbo].[DogBaselines] ADD CONSTRAINT [FK_DogBaselines_DogProfiles_DogId] 
    FOREIGN KEY ([DogId]) REFERENCES [DogProfiles] ([Id]) ON DELETE CASCADE;
    
    PRINT 'DogBaselines table created successfully.';
END
ELSE
BEGIN
    PRINT 'DogBaselines table already exists.';
    
    -- Check if DogBaselineEstablished column exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'DogBaselines' AND COLUMN_NAME = 'DogBaselineEstablished')
    BEGIN
        PRINT 'Adding DogBaselineEstablished column...';
        ALTER TABLE [dbo].[DogBaselines] ADD [DogBaselineEstablished] bit NOT NULL DEFAULT 0;
        PRINT 'DogBaselineEstablished column added successfully.';
    END
    ELSE
    BEGIN
        PRINT 'DogBaselineEstablished column already exists.';
    END
END

-- 2. Ensure UserBaselines has HumanBaselineEstablished column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'UserBaselines' AND COLUMN_NAME = 'HumanBaselineEstablished')
BEGIN
    PRINT 'Adding HumanBaselineEstablished column to UserBaselines...';
    ALTER TABLE [dbo].[UserBaselines] ADD [HumanBaselineEstablished] bit NOT NULL DEFAULT 0;
    PRINT 'HumanBaselineEstablished column added successfully.';
END
ELSE
BEGIN
    PRINT 'HumanBaselineEstablished column already exists in UserBaselines.';
END

-- 3. Verify HumanProfiles table has correct schema
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'HumanProfiles' AND COLUMN_NAME = 'HumanBaselineEstablished')
BEGIN
    PRINT 'Adding HumanBaselineEstablished column to HumanProfiles...';
    ALTER TABLE [dbo].[HumanProfiles] ADD [HumanBaselineEstablished] bit NOT NULL DEFAULT 0;
    PRINT 'HumanBaselineEstablished column added to HumanProfiles successfully.';
END
ELSE
BEGIN
    PRINT 'HumanBaselineEstablished column already exists in HumanProfiles.';
END

-- 4. Verify DogProfiles table has correct schema  
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'DogProfiles' AND COLUMN_NAME = 'DogBaselineEstablished')
BEGIN
    PRINT 'Adding DogBaselineEstablished column to DogProfiles...';
    ALTER TABLE [dbo].[DogProfiles] ADD [DogBaselineEstablished] bit NOT NULL DEFAULT 0;
    PRINT 'DogBaselineEstablished column added to DogProfiles successfully.';
END
ELSE
BEGIN
    PRINT 'DogBaselineEstablished column already exists in DogProfiles.';
END

-- 5. Ensure all other required tables exist
PRINT 'Verifying other required tables...';

-- Check StressEvents table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StressEvents' AND xtype='U')
BEGIN
    PRINT 'Creating StressEvents table...';
    CREATE TABLE [dbo].[StressEvents] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [UserId] uniqueidentifier NOT NULL,
        [TimestampUtc] datetime2 NOT NULL,
        [HRVAtEvent] float NOT NULL,
        [HRAtEvent] int NOT NULL,
        [BaselineHRV] float NOT NULL,
        [BaselineHR] float NOT NULL,
        [DeviationScore] float NOT NULL,
        [DogStateAtEvent] nvarchar(100) NULL,
        [AlertFired] bit NOT NULL DEFAULT 0,
        [OutcomeLogged] bit NOT NULL DEFAULT 0
    );
    PRINT 'StressEvents table created successfully.';
END
ELSE
BEGIN
    PRINT 'StressEvents table already exists.';
END

-- Check WellnessAlerts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WellnessAlerts' AND xtype='U')
BEGIN
    PRINT 'Creating WellnessAlerts table...';
    CREATE TABLE [dbo].[WellnessAlerts] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [UserId] uniqueidentifier NOT NULL,
        [DogId] uniqueidentifier NOT NULL,
        [AlertType] nvarchar(50) NOT NULL,
        [Suggestion] nvarchar(500) NOT NULL,
        [DogStateAtAlert] nvarchar(50) NULL,
        [HRVAtAlert] float NOT NULL,
        [HRAtAlert] int NOT NULL,
        [IsActedOn] bit NOT NULL DEFAULT 0,
        [Outcome] nvarchar(50) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [ResolvedAt] datetime2 NULL
    );
    PRINT 'WellnessAlerts table created successfully.';
END
ELSE
BEGIN
    PRINT 'WellnessAlerts table already exists.';
END

-- Check SyncScoreRecord table  
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SyncScoreRecords' AND xtype='U')
BEGIN
    PRINT 'Creating SyncScoreRecords table...';
    CREATE TABLE [dbo].[SyncScoreRecords] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [UserId] uniqueidentifier NOT NULL,
        [DogId] uniqueidentifier NOT NULL,
        [SyncScore] int NOT NULL,
        [HumanHRV] float NOT NULL,
        [DogHeartRate] float NULL,  
        [CalculatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [Trend] nvarchar(20) NOT NULL DEFAULT 'stable'
    );
    PRINT 'SyncScoreRecords table created successfully.';
END
ELSE
BEGIN
    PRINT 'SyncScoreRecords table already exists.';
END

-- 6. Verify all tables exist and show summary
PRINT 'Database schema verification complete!';
PRINT 'Existing tables:';

SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('HumanProfiles', 'DogProfiles', 'HumanVitals', 'DogVitals', 
                     'UserBaselines', 'DogBaselines', 'StressEvents', 'WellnessAlerts', 'SyncScoreRecords')
ORDER BY TABLE_NAME;

PRINT 'Schema fixes complete!';