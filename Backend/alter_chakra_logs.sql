-- Alter ChakraLogs Table to add PetId, HarmonyScore, and DominantBlockage
-- Run this script to update the existing ChakraLogs table

IF EXISTS (SELECT * FROM sysobjects WHERE name='ChakraLogs' AND xtype='U')
BEGIN
    -- Add PetId column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ChakraLogs') AND name = 'PetId')
    BEGIN
        ALTER TABLE ChakraLogs
        ADD PetId UNIQUEIDENTIFIER NULL;
        PRINT 'Added PetId column to ChakraLogs';
    END

    -- Add HarmonyScore column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ChakraLogs') AND name = 'HarmonyScore')
    BEGIN
        ALTER TABLE ChakraLogs
        ADD HarmonyScore FLOAT NULL;
        PRINT 'Added HarmonyScore column to ChakraLogs';
    END

    -- Add DominantBlockage column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ChakraLogs') AND name = 'DominantBlockage')
    BEGIN
        ALTER TABLE ChakraLogs
        ADD DominantBlockage NVARCHAR(50) NULL;
        PRINT 'Added DominantBlockage column to ChakraLogs';
    END

    PRINT 'ChakraLogs table updated successfully!';
END
ELSE
BEGIN
    PRINT 'ChakraLogs table does not exist. Please run create_chakra_table.sql first.';
END
