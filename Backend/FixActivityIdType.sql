-- WARNING: This script clears data in UserActivitiesScores and UserBondingActivities 
-- because the existing INT IDs are incompatible with the new GUID schema.

-- 1. DELETE existing data to allow type change
DELETE FROM UserActivitiesScores;
DELETE FROM UserBondingActivities;

-- 2. Modify UserActivitiesScores table
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserActivitiesScores' AND COLUMN_NAME = 'ActivityId')
BEGIN
    -- Drop default constraints if any
    DECLARE @defaultConstraint NVARCHAR(200)
    SELECT @defaultConstraint = NAME FROM SYS.DEFAULT_CONSTRAINTS 
    WHERE PARENT_OBJECT_ID = OBJECT_ID('UserActivitiesScores') 
    AND PARENT_COLUMN_ID = (SELECT COLUMN_ID FROM SYS.COLUMNS WHERE NAME = 'ActivityId' AND OBJECT_ID = OBJECT_ID('UserActivitiesScores'))
    
    IF @defaultConstraint IS NOT NULL 
        EXEC('ALTER TABLE UserActivitiesScores DROP CONSTRAINT ' + @defaultConstraint)

    -- Drop key constraints if any
    DECLARE @constraintName NVARCHAR(200)
    SELECT @constraintName = CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'UserActivitiesScores' AND COLUMN_NAME = 'ActivityId'

    IF @constraintName IS NOT NULL 
        EXEC('ALTER TABLE UserActivitiesScores DROP CONSTRAINT ' + @constraintName)

    -- Alter column to UNIQUEIDENTIFIER
    ALTER TABLE UserActivitiesScores ALTER COLUMN ActivityId UNIQUEIDENTIFIER NOT NULL
END

-- 3. Modify UserBondingActivities table
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserBondingActivities' AND COLUMN_NAME = 'ActivityId')
BEGIN
    -- Drop default constraints if any
    DECLARE @defaultConstraint2 NVARCHAR(200)
    SELECT @defaultConstraint2 = NAME FROM SYS.DEFAULT_CONSTRAINTS 
    WHERE PARENT_OBJECT_ID = OBJECT_ID('UserBondingActivities') 
    AND PARENT_COLUMN_ID = (SELECT COLUMN_ID FROM SYS.COLUMNS WHERE NAME = 'ActivityId' AND OBJECT_ID = OBJECT_ID('UserBondingActivities'))
    
    IF @defaultConstraint2 IS NOT NULL 
        EXEC('ALTER TABLE UserBondingActivities DROP CONSTRAINT ' + @defaultConstraint2)

    -- Drop key constraints if any
    DECLARE @constraintName2 NVARCHAR(200)
    SELECT @constraintName2 = CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'UserBondingActivities' AND COLUMN_NAME = 'ActivityId'

    IF @constraintName2 IS NOT NULL 
        EXEC('ALTER TABLE UserBondingActivities DROP CONSTRAINT ' + @constraintName2)

    -- Alter column to UNIQUEIDENTIFIER
    ALTER TABLE UserBondingActivities ALTER COLUMN ActivityId UNIQUEIDENTIFIER NOT NULL
END
