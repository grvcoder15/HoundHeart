-- Add GPS columns for proximity-based alerts
-- Run this script to add GPS tracking capabilities

USE [HoundedHeart];
GO

PRINT 'Adding GPS columns for proximity-based alerts...';

-- 1. Add GPS columns to HumanVitals table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'HumanVitals' AND COLUMN_NAME = 'Latitude')
BEGIN
    PRINT 'Adding Latitude and Longitude columns to HumanVitals...';
    ALTER TABLE [dbo].[HumanVitals] ADD 
        [Latitude] FLOAT NULL,
        [Longitude] FLOAT NULL;
    PRINT 'GPS columns added to HumanVitals successfully.';
END
ELSE
BEGIN
    PRINT 'GPS columns already exist in HumanVitals.';
END

-- 2. Add GPS columns to DogVitals table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'DogVitals' AND COLUMN_NAME = 'Latitude')
BEGIN
    PRINT 'Adding Latitude and Longitude columns to DogVitals...';
    ALTER TABLE [dbo].[DogVitals] ADD 
        [Latitude] FLOAT NULL,
        [Longitude] FLOAT NULL;
    PRINT 'GPS columns added to DogVitals successfully.';
END
ELSE
BEGIN
    PRINT 'GPS columns already exist in DogVitals.';
END

-- 3. Add proximity columns to WellnessAlerts table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'WellnessAlerts' AND COLUMN_NAME = 'IsDogNearby')
BEGIN
    PRINT 'Adding proximity columns to WellnessAlerts...';
    ALTER TABLE [dbo].[WellnessAlerts] ADD 
        [IsDogNearby] BIT NULL,
        [DistanceMetres] FLOAT NULL;
    PRINT 'Proximity columns added to WellnessAlerts successfully.';
END
ELSE
BEGIN
    PRINT 'Proximity columns already exist in WellnessAlerts.';
END

-- 4. Verify all columns exist
PRINT 'Verifying GPS and proximity columns...';

-- Check HumanVitals
SELECT 'HumanVitals' AS TableName, 
       COUNT(CASE WHEN COLUMN_NAME = 'Latitude' THEN 1 END) AS HasLatitude,
       COUNT(CASE WHEN COLUMN_NAME = 'Longitude' THEN 1 END) AS HasLongitude
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'HumanVitals' AND COLUMN_NAME IN ('Latitude', 'Longitude')

UNION ALL

-- Check DogVitals
SELECT 'DogVitals' AS TableName, 
       COUNT(CASE WHEN COLUMN_NAME = 'Latitude' THEN 1 END) AS HasLatitude,
       COUNT(CASE WHEN COLUMN_NAME = 'Longitude' THEN 1 END) AS HasLongitude
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'DogVitals' AND COLUMN_NAME IN ('Latitude', 'Longitude')

UNION ALL

-- Check WellnessAlerts
SELECT 'WellnessAlerts' AS TableName, 
       COUNT(CASE WHEN COLUMN_NAME = 'IsDogNearby' THEN 1 END) AS HasIsDogNearby,
       COUNT(CASE WHEN COLUMN_NAME = 'DistanceMetres' THEN 1 END) AS HasDistanceMetres
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'WellnessAlerts' AND COLUMN_NAME IN ('IsDogNearby', 'DistanceMetres');

PRINT 'GPS and proximity columns installation complete!';