-- Add columns to UserCheckIns table for History Tracking
-- Run this in your SQL Server Management Studio or Query Tool

ALTER TABLE [UserCheckIns]
ADD [DailyPointsChange] int NULL;

ALTER TABLE [UserCheckIns]
ADD [ScoreSnapshot] int NULL;

ALTER TABLE [UserCheckIns]
ADD [IsMissed] bit NOT NULL DEFAULT 0;

-- Optional: If you want to backfill existing records with 0 change (to avoid nulls affecting logic)
-- UPDATE [UserCheckIns] SET [DailyPointsChange] = 0 WHERE [DailyPointsChange] IS NULL;
