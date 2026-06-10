-- Ensure Tables Exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BreathingPatterns]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[BreathingPatterns](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](250) NULL,
	[InhaleDuration] [int] NOT NULL,
	[ExhaleDuration] [int] NOT NULL,
	[HoldDuration] [int] NOT NULL DEFAULT ((0)),
	[HoldAfterExhaleDuration] [int] NOT NULL DEFAULT ((0)),
	[IsActive] [bit] NOT NULL DEFAULT ((1)),
	[IsDeleted] [bit] NOT NULL DEFAULT ((0)),
	[CreatedOn] [datetime2](7) NOT NULL DEFAULT (getdate()),
	[UpdatedOn] [datetime2](7) NULL,
 CONSTRAINT [PK_BreathingPatterns] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)
)
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TargetCycles]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[TargetCycles](
	[Id] [uniqueidentifier] NOT NULL,
	[Cycles] [int] NOT NULL,
	[DurationDescription] [nvarchar](50) NULL,
	[IsActive] [bit] NOT NULL DEFAULT ((1)),
	[IsDeleted] [bit] NOT NULL DEFAULT ((0)),
	[CreatedOn] [datetime2](7) NOT NULL DEFAULT (getdate()),
	[UpdatedOn] [datetime2](7) NULL,
 CONSTRAINT [PK_TargetCycles] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)
)
END

-- Add missing columns if tables exist but columns do not (Schema Migration)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BreathingPatterns]') AND type in (N'U'))
BEGIN
    IF COL_LENGTH('dbo.BreathingPatterns', 'IsActive') IS NULL
        ALTER TABLE dbo.BreathingPatterns ADD IsActive bit NOT NULL DEFAULT ((1));
    
    IF COL_LENGTH('dbo.BreathingPatterns', 'IsDeleted') IS NULL
        ALTER TABLE dbo.BreathingPatterns ADD IsDeleted bit NOT NULL DEFAULT ((0));
        
    IF COL_LENGTH('dbo.BreathingPatterns', 'CreatedOn') IS NULL
        ALTER TABLE dbo.BreathingPatterns ADD CreatedOn datetime2(7) NOT NULL DEFAULT (getdate());

    IF COL_LENGTH('dbo.BreathingPatterns', 'UpdatedOn') IS NULL
        ALTER TABLE dbo.BreathingPatterns ADD UpdatedOn datetime2(7) NULL;

    IF COL_LENGTH('dbo.BreathingPatterns', 'HoldAfterExhaleDuration') IS NULL
         ALTER TABLE dbo.BreathingPatterns ADD HoldAfterExhaleDuration int NOT NULL DEFAULT ((0));
END

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TargetCycles]') AND type in (N'U'))
BEGIN
    IF COL_LENGTH('dbo.TargetCycles', 'IsActive') IS NULL
        ALTER TABLE dbo.TargetCycles ADD IsActive bit NOT NULL DEFAULT ((1));
    
    IF COL_LENGTH('dbo.TargetCycles', 'IsDeleted') IS NULL
        ALTER TABLE dbo.TargetCycles ADD IsDeleted bit NOT NULL DEFAULT ((0));
        
    IF COL_LENGTH('dbo.TargetCycles', 'CreatedOn') IS NULL
        ALTER TABLE dbo.TargetCycles ADD CreatedOn datetime2(7) NOT NULL DEFAULT (getdate());
        
    IF COL_LENGTH('dbo.TargetCycles', 'UpdatedOn') IS NULL
        ALTER TABLE dbo.TargetCycles ADD UpdatedOn datetime2(7) NULL;
END


-- Clear existing data to avoid duplicates (optional, strictly for seed script safety)
-- DELETE FROM BreathingPatterns; 
-- DELETE FROM TargetCycles;

-- Seed Breathing Patterns (Only if table is empty to preserve IDs if needed, or use MERGE if specific IDs were known)
-- For this setup, we'll check if any exist.
IF NOT EXISTS (SELECT 1 FROM BreathingPatterns)
BEGIN
INSERT INTO BreathingPatterns (Id, Name, Description, InhaleDuration, ExhaleDuration, HoldDuration, HoldAfterExhaleDuration, IsActive, IsDeleted, CreatedOn)
VALUES 
(NEWID(), '4-7-8 Calming', 'Reduces stress, promotes sleep', 4, 8, 7, 0, 1, 0, GETDATE()),
(NEWID(), 'Box Breathing', 'Improves focus, reduces anxiety', 4, 4, 4, 4, 1, 0, GETDATE()),
(NEWID(), 'Coherent Breathing', 'Balances nervous system', 6, 6, 0, 0, 1, 0, GETDATE()),
(NEWID(), 'Energizing Breath', 'Increases alertness, energy', 4, 2, 0, 0, 1, 0, GETDATE()),
(NEWID(), 'Deep Relaxation', 'Deep relaxation, stress relief', 5, 10, 0, 0, 1, 0, GETDATE());
END

-- Seed Target Cycles
IF NOT EXISTS (SELECT 1 FROM TargetCycles)
BEGIN
INSERT INTO TargetCycles (Id, Cycles, DurationDescription, IsActive, IsDeleted, CreatedOn)
VALUES
(NEWID(), 5, '(~2 min)', 1, 0, GETDATE()),
(NEWID(), 10, '(~4 min)', 1, 0, GETDATE()),
(NEWID(), 15, '(~6 min)', 1, 0, GETDATE()),
(NEWID(), 20, '(~8 min)', 1, 0, GETDATE());
END

-- Seed Bonding Activity for Scoring
IF NOT EXISTS (SELECT 1 FROM BondingActivities WHERE ActivityName = 'Synchronized Breathing')
BEGIN
    INSERT INTO BondingActivities (ActivityId, ActivityName, Points)
    VALUES (NEWID(), 'Synchronized Breathing', 2);
END
