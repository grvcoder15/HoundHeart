-- Add Fitbit integration columns to Users table
-- Run this script against your HoundedHeart database

USE HoundedHeart;
GO

-- Check if columns already exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'FitbitAccessToken')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [FitbitAccessToken] NVARCHAR(500) NULL;
    PRINT 'Added FitbitAccessToken column to Users table';
END
ELSE
BEGIN
    PRINT 'FitbitAccessToken column already exists in Users table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'FitbitRefreshToken')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [FitbitRefreshToken] NVARCHAR(500) NULL;
    PRINT 'Added FitbitRefreshToken column to Users table';
END
ELSE
BEGIN
    PRINT 'FitbitRefreshToken column already exists in Users table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'FitbitTokenExpiresAt')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [FitbitTokenExpiresAt] DATETIME2 NULL;
    PRINT 'Added FitbitTokenExpiresAt column to Users table';
END
ELSE
BEGIN
    PRINT 'FitbitTokenExpiresAt column already exists in Users table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'FitbitUserId')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [FitbitUserId] NVARCHAR(50) NULL;
    PRINT 'Added FitbitUserId column to Users table';
END
ELSE
BEGIN
    PRINT 'FitbitUserId column already exists in Users table';
END

-- Create index on FitbitUserId for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'IX_Users_FitbitUserId')
BEGIN
    CREATE INDEX IX_Users_FitbitUserId ON [dbo].[Users] (FitbitUserId);
    PRINT 'Created index IX_Users_FitbitUserId on Users table';
END
ELSE
BEGIN
    PRINT 'Index IX_Users_FitbitUserId already exists on Users table';
END

PRINT 'Fitbit integration migration completed successfully';
GO