-- ============================================================
-- Migration: Add Weather Data Columns
-- Date: 2026-04-09
-- Description:
--   1. Adds AmbientTemperature, WeatherCondition, WeatherLocation
--      to HumanVitals table (per-record weather data).
--   2. Adds AvgAmbientTemperature to UserBaselines table
--      (stores the weather-adjusted baseline average).
-- ============================================================

-- 1. HumanVitals -- add weather columns if they don't already exist

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HumanVitals' AND COLUMN_NAME = 'AmbientTemperature'
)
BEGIN
    ALTER TABLE HumanVitals
    ADD AmbientTemperature FLOAT NULL;
    PRINT 'Added AmbientTemperature column to HumanVitals.';
END
ELSE
    PRINT 'AmbientTemperature already exists in HumanVitals. Skipping.';

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HumanVitals' AND COLUMN_NAME = 'WeatherCondition'
)
BEGIN
    ALTER TABLE HumanVitals
    ADD WeatherCondition NVARCHAR(100) NULL;
    PRINT 'Added WeatherCondition column to HumanVitals.';
END
ELSE
    PRINT 'WeatherCondition already exists in HumanVitals. Skipping.';

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HumanVitals' AND COLUMN_NAME = 'WeatherLocation'
)
BEGIN
    ALTER TABLE HumanVitals
    ADD WeatherLocation NVARCHAR(200) NULL;
    PRINT 'Added WeatherLocation column to HumanVitals.';
END
ELSE
    PRINT 'WeatherLocation already exists in HumanVitals. Skipping.';


-- 2. UserBaselines -- add AvgAmbientTemperature column if it doesn't already exist

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'UserBaselines' AND COLUMN_NAME = 'AvgAmbientTemperature'
)
BEGIN
    ALTER TABLE UserBaselines
    ADD AvgAmbientTemperature FLOAT NULL;
    PRINT 'Added AvgAmbientTemperature column to UserBaselines.';
END
ELSE
    PRINT 'AvgAmbientTemperature already exists in UserBaselines. Skipping.';

PRINT 'Weather data migration completed successfully.';
