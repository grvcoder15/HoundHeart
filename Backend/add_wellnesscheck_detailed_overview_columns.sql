-- Add columns for wellness check detailed overview support
-- Run this script against your HoundedHeart database

USE HoundedHeart;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[WellnessChecks]') AND name = 'DetailedOverviewJson')
BEGIN
    ALTER TABLE [dbo].[WellnessChecks] ADD [DetailedOverviewJson] NVARCHAR(MAX) NULL;
    PRINT 'Added DetailedOverviewJson column to WellnessChecks table';
END
ELSE
BEGIN
    PRINT 'DetailedOverviewJson column already exists in WellnessChecks table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[WellnessChecks]') AND name = 'EnvironmentCheckReferenceId')
BEGIN
    ALTER TABLE [dbo].[WellnessChecks] ADD [EnvironmentCheckReferenceId] UNIQUEIDENTIFIER NULL;
    PRINT 'Added EnvironmentCheckReferenceId column to WellnessChecks table';
END
ELSE
BEGIN
    PRINT 'EnvironmentCheckReferenceId column already exists in WellnessChecks table';
END

PRINT 'WellnessChecks detailed overview migration completed successfully';
GO
