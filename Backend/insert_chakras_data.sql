-- Insert 7 Chakras into Chakras table
-- AudioUrl will be NULL initially and updated via the Audio Upload API

IF EXISTS (SELECT * FROM sysobjects WHERE name='Chakras' AND xtype='U')
BEGIN
    -- Check if data already exists
    IF NOT EXISTS (SELECT * FROM Chakras WHERE ChakraName IN ('Root', 'Sacral', 'Solar Plexus', 'Heart', 'Throat', 'Third Eye', 'Crown'))
    BEGIN
        INSERT INTO Chakras (ChakraId, ChakraName, AudioUrl, IsActive, IsDeleted, CreatedOn)
        VALUES 
            (NEWID(), 'Root', NULL, 1, 0, GETDATE()),
            (NEWID(), 'Sacral', NULL, 1, 0, GETDATE()),
            (NEWID(), 'Solar Plexus', NULL, 1, 0, GETDATE()),
            (NEWID(), 'Heart', NULL, 1, 0, GETDATE()),
            (NEWID(), 'Throat', NULL, 1, 0, GETDATE()),
            (NEWID(), 'Third Eye', NULL, 1, 0, GETDATE()),
            (NEWID(), 'Crown', NULL, 1, 0, GETDATE());

        PRINT '7 Chakras inserted successfully!';
    END
    ELSE
    BEGIN
        PRINT 'Chakras data already exists. Skipping insertion.';
    END
END
ELSE
BEGIN
    PRINT 'Chakras table does not exist. Please create it first.';
    PRINT 'Run this script to create the table:';
    PRINT '';
    PRINT 'CREATE TABLE Chakras (';
    PRINT '    ChakraId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),';
    PRINT '    ChakraName NVARCHAR(100) NOT NULL,';
    PRINT '    AudioUrl NVARCHAR(500) NULL,';
    PRINT '    IsActive BIT DEFAULT 1,';
    PRINT '    IsDeleted BIT DEFAULT 0,';
    PRINT '    CreatedOn DATETIME DEFAULT GETDATE(),';
    PRINT '    UpdatedOn DATETIME NULL';
    PRINT ');';
END
