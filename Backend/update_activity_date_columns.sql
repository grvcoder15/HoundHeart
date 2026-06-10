-- Migration: Add ActivityDate and LogDate columns for localized tracking
-- Run this in SQL Server Management Studio or via sqlcmd

-- 1. Update UserCheckIns table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[UserCheckIns]') AND name = 'ActivityDate')
BEGIN
    ALTER TABLE [dbo].[UserCheckIns] ADD [ActivityDate] DATETIME NULL;
END
GO

-- 2. Update ChakraLogs table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ChakraLogs]') AND name = 'LogDate')
BEGIN
    ALTER TABLE [dbo].[ChakraLogs] ADD [LogDate] DATETIME NULL;
END
GO

-- 3. Update UserActivitiesScores table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[UserActivitiesScores]') AND name = 'ActivityDate')
BEGIN
    ALTER TABLE [dbo].[UserActivitiesScores] ADD [ActivityDate] DATETIME NULL;
END
GO

-- Verification:
-- SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserCheckIns' AND COLUMN_NAME = 'ActivityDate';
-- SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ChakraLogs' AND COLUMN_NAME = 'LogDate';
-- SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserActivitiesScores' AND COLUMN_NAME = 'ActivityDate';
