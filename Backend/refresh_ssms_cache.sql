-- SSMS Cache Refresh Script
-- Run this in SSMS if you're still seeing "Invalid object name" errors
-- This helps refresh the metadata cache

USE [HoundedHeart];
GO

-- Clear plan cache to refresh object references
DBCC FREEPROCCACHE;
GO

-- Refresh metadata 
EXEC sp_refreshview 'INFORMATION_SCHEMA.TABLES';
GO

-- Test basic queries to confirm everything works
PRINT 'Testing baseline tables access...';

SELECT 'HumanProfiles' AS TableName, COUNT(*) AS RecordCount FROM HumanProfiles
UNION ALL
SELECT 'DogProfiles', COUNT(*) FROM DogProfiles  
UNION ALL
SELECT 'UserBaselines', COUNT(*) FROM UserBaselines
UNION ALL  
SELECT 'DogBaselines', COUNT(*) FROM DogBaselines
UNION ALL
SELECT 'HumanVitals', COUNT(*) FROM HumanVitals
UNION ALL
SELECT 'DogVitals', COUNT(*) FROM DogVitals;

PRINT 'Cache refresh completed. SSMS should now recognize all objects correctly.';
PRINT 'If you still see errors, try:';
PRINT '1. Right-click database in Object Explorer and select "Refresh"';
PRINT '2. Close and reopen SSMS';
PRINT '3. Clear the query window and type your queries fresh');

GO