-- Add IsDelivered column to NotificationLogs table
-- This column tracks whether the push notification was successfully delivered via APNs
-- For now it will be false (mock notifications), will be true when real APNs is connected

USE [HoundedHeart];
GO

PRINT 'Adding IsDelivered column to NotificationLogs table...';

-- Check if IsDelivered column exists, add it if not
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'NotificationLogs' AND COLUMN_NAME = 'IsDelivered')
BEGIN
    PRINT 'Adding IsDelivered column...';
    ALTER TABLE [dbo].[NotificationLogs] ADD [IsDelivered] BIT NOT NULL DEFAULT 0;
    PRINT 'IsDelivered column added successfully.';
END
ELSE
BEGIN
    PRINT 'IsDelivered column already exists in NotificationLogs.';
END

PRINT 'NotificationLogs table update completed.';