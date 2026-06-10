-- SQL Migration Script to fix UserBaselines schema
-- Run this in your SQL Server database (e.g., via SSMS)

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[UserBaselines]') AND name = 'AvgDeepSleepMinutes')
BEGIN
    ALTER TABLE [UserBaselines] ADD [AvgDeepSleepMinutes] FLOAT NULL;
    ALTER TABLE [UserBaselines] ADD [AvgRemSleepMinutes] FLOAT NULL;
    ALTER TABLE [UserBaselines] ADD [AvgLightSleepMinutes] FLOAT NULL;
    ALTER TABLE [UserBaselines] ADD [AvgAwakeSleepMinutes] FLOAT NULL;
    ALTER TABLE [UserBaselines] ADD [AvgStressScore] FLOAT NULL;
    ALTER TABLE [UserBaselines] ADD [AvgCalories] FLOAT NULL;
    ALTER TABLE [UserBaselines] ADD [AvgDistance] FLOAT NULL;
    ALTER TABLE [UserBaselines] ADD [BaselineCreatedAt] DATETIME2 NULL;
    ALTER TABLE [UserBaselines] ADD [BaselineUpdatedAt] DATETIME2 NULL;
    ALTER TABLE [UserBaselines] ADD [IsComplete] BIT NULL;
    
    PRINT 'UserBaselines columns added successfully.';
END
ELSE
BEGIN
    PRINT 'UserBaselines columns already exist.';
END
GO
