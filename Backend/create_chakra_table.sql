-- Create ChakraLogs Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChakraLogs' AND xtype='U')
BEGIN
    CREATE TABLE ChakraLogs (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId UNIQUEIDENTIFIER NOT NULL,
        RootScore INT NOT NULL,
        SacralScore INT NOT NULL,
        SolarPlexusScore INT NOT NULL,
        HeartScore INT NOT NULL,
        ThroatScore INT NOT NULL,
        ThirdEyeScore INT NOT NULL,
        CrownScore INT NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
