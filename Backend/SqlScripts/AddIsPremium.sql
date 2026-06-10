/* 
   SQL Script: Add IsPremium column to Users table
   Purpose: This script adds an 'IsPremium' column to the Users table 
            to distinguish between Free and Premium members.
   Note: Strictly following the no-migration policy.
*/

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Users]') 
    AND name = 'IsPremium'
)
BEGIN
    ALTER TABLE Users ADD IsPremium BIT NOT NULL DEFAULT 0;
    PRINT 'Column IsPremium added successfully to Users table.';
END
ELSE
BEGIN
    PRINT 'Column IsPremium already exists in Users table.';
END
GO
