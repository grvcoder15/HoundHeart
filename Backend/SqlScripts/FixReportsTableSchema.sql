-- =============================================
-- SQL Script: FixReportsTableSchema.sql
-- Goal: Update existing PostReports table to match the new Backend Model.
-- Fix: Added GO statements to prevent batch execution errors.
-- =============================================

-- 1. Add missing columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PostReports') AND name = 'ReportType')
    ALTER TABLE PostReports ADD ReportType NVARCHAR(50) NOT NULL DEFAULT 'Content';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PostReports') AND name = 'Priority')
    ALTER TABLE PostReports ADD Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PostReports') AND name = 'Status')
    ALTER TABLE PostReports ADD Status NVARCHAR(20) NOT NULL DEFAULT 'Pending';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PostReports') AND name = 'Description')
    ALTER TABLE PostReports ADD Description NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PostReports') AND name = 'ReportedUserId')
    ALTER TABLE PostReports ADD ReportedUserId UNIQUEIDENTIFIER NULL;
GO

-- 2. Sync existing data (IsResolved -> Status)
UPDATE PostReports 
SET Status = CASE WHEN IsResolved = 1 THEN 'Resolved' ELSE 'Pending' END
WHERE Status = 'Pending';
GO

-- 3. Update ReportedUserId for existing records (Best effort)
UPDATE PR
SET PR.ReportedUserId = P.UserId
FROM PostReports PR
JOIN CommunityPosts P ON PR.PostId = P.PostId
WHERE PR.ReportedUserId IS NULL AND PR.PostId IS NOT NULL;
GO

-- 4. Cleanup (Old columns) - Optional, keeping for safety
-- ALTER TABLE PostReports DROP COLUMN IsResolved;
GO
