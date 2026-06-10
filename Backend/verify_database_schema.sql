-- SSMS Verification Script
-- Run this script to verify all database objects exist and are accessible
-- This should resolve any "Invalid object name" or "Invalid column name" errors

USE [HoundedHeart];
GO

PRINT '=== Database Schema Verification Script ===';
PRINT 'Testing all baseline-related database objects...';
PRINT '';

-- Test 1: Verify HumanProfiles table
PRINT '1. Testing HumanProfiles table:';
SELECT COUNT(*) as HumanProfilesCount FROM [HumanProfiles];
SELECT TOP 3 Id, UserId, [Name], HumanBaselineEstablished FROM [HumanProfiles];
PRINT '';

-- Test 2: Verify DogProfiles table
PRINT '2. Testing DogProfiles table:';
SELECT COUNT(*) as DogProfilesCount FROM [DogProfiles];
SELECT TOP 3 Id, UserId, [Name], DogBaselineEstablished FROM [DogProfiles];
PRINT '';

-- Test 3: Verify HumanVitals table
PRINT '3. Testing HumanVitals table:';
SELECT COUNT(*) as HumanVitalsCount FROM [HumanVitals]; 
SELECT TOP 3 Id, UserId, HeartRate, HRV, TimestampUtc FROM [HumanVitals] ORDER BY TimestampUtc DESC;
PRINT '';

-- Test 4: Verify DogVitals table  
PRINT '4. Testing DogVitals table:';
SELECT COUNT(*) as DogVitalsCount FROM [DogVitals];
SELECT TOP 3 Id, DogId, HeartRate, ActivityScore, TimestampUtc FROM [DogVitals] ORDER BY TimestampUtc DESC;
PRINT '';

-- Test 5: Verify UserBaselines table
PRINT '5. Testing UserBaselines table:';
SELECT COUNT(*) as UserBaselinesCount FROM [UserBaselines];
SELECT TOP 3 Id, UserId, AvgHeartRate, AvgHRV, HumanBaselineEstablished FROM [UserBaselines];
PRINT '';

-- Test 6: Verify DogBaselines table
PRINT '6. Testing DogBaselines table:';
SELECT COUNT(*) as DogBaselinesCount FROM [DogBaselines];
SELECT TOP 3 Id, DogId, AvgHeartRate, AvgActivityScore, DogBaselineEstablished FROM [DogBaselines];
PRINT '';

-- Test 7: Verify StressEvents table
PRINT '7. Testing StressEvents table:';
SELECT COUNT(*) as StressEventsCount FROM [StressEvents];
SELECT TOP 3 Id, UserId, HRVAtEvent, HRAtEvent, TimestampUtc FROM [StressEvents] ORDER BY TimestampUtc DESC;
PRINT '';

-- Test 8: Verify WellnessAlerts table
PRINT '8. Testing WellnessAlerts table:';
SELECT COUNT(*) as WellnessAlertsCount FROM [WellnessAlerts];
SELECT TOP 3 Id, UserId, DogId, AlertType, IsActedOn FROM [WellnessAlerts] ORDER BY CreatedAt DESC;
PRINT '';

-- Test 9: Verify SyncScoreRecords table
PRINT '9. Testing SyncScoreRecords table:';
SELECT COUNT(*) as SyncScoreRecordsCount FROM [SyncScoreRecords];
SELECT TOP 3 Id, UserId, DogId, Score, CalculatedAt FROM [SyncScoreRecords] ORDER BY CalculatedAt DESC;
PRINT '';

-- Test 10: Check all table schemas
PRINT '10. All baseline-related table schemas:';
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('HumanProfiles', 'DogProfiles', 'UserBaselines', 'DogBaselines',
                     'HumanVitals', 'DogVitals', 'StressEvents', 'WellnessAlerts', 'SyncScoreRecords')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

PRINT '';
PRINT '=== All tests completed successfully! ===';
PRINT 'If you see this message, all database objects exist and are accessible.';
PRINT 'No more "Invalid object name" or "Invalid column name" errors should occur.';