/* 
   SQL Script: Add Status column to Users table
   Purpose: This script adds a 'Status' column to the Users table 
            to support Suspend and Ban functionality for the Admin Panel.
   Note: Strictly following the no-migration policy.
*/

-- 1. Add the Status column with a default value of 'Active'
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Users]') 
    AND name = 'Status'
)
BEGIN
    ALTER TABLE [dbo].[Users] 
    ADD [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active';
    
    PRINT 'Column [Status] added to [Users] table successfully.';
END
ELSE
BEGIN
    PRINT 'Column [Status] already exists in [Users] table.';
END
GO

-- 2. Update any existing NULL or empty values to 'Active' 
-- (Though the DEFAULT constraint handles future inserts, existing rows might need it)
UPDATE [dbo].[Users]
SET [Status] = 'Active'
WHERE [Status] IS NULL OR [Status] = '';
GO
