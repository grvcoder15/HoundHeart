-- ============================================================
-- Script: 08_create_phase1_profiles.sql
-- Purpose: Create HumanProfiles and DogProfiles tables for Phase 1.
--          These tables will store basic profile info for users and their pets.
-- Note: NO EF Migrations. Run this manually in SQL Server.
-- ============================================================

-- 1. Create HumanProfiles Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HumanProfiles' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[HumanProfiles] (
        [Id]                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]            UNIQUEIDENTIFIER NOT NULL,
        [Name]              NVARCHAR(100)    NULL,
        [Age]               INT              NULL,
        [CreatedAt]         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt]         DATETIME2        NULL,
        CONSTRAINT [PK_HumanProfiles] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_HumanProfiles_Users] FOREIGN KEY ([UserId]) 
            REFERENCES [dbo].[Users]([UserId]) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX [IX_HumanProfiles_UserId] 
        ON [dbo].[HumanProfiles]([UserId] ASC);

    PRINT 'HumanProfiles table created successfully.';
END
ELSE
BEGIN
    PRINT 'HumanProfiles table already exists. Skipping creation.';
END
GO

-- 2. Create DogProfiles Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DogProfiles' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[DogProfiles] (
        [Id]                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]            UNIQUEIDENTIFIER NOT NULL,
        [Name]              NVARCHAR(100)    NOT NULL,
        [Breed]             NVARCHAR(100)    NULL,
        [Age]               INT              NULL,
        [Weight]            DECIMAL(5,2)     NULL,
        [CreatedAt]         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt]         DATETIME2        NULL,
        CONSTRAINT [PK_DogProfiles] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_DogProfiles_Users] FOREIGN KEY ([UserId]) 
            REFERENCES [dbo].[Users]([UserId]) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX [IX_DogProfiles_UserId] 
        ON [dbo].[DogProfiles]([UserId] ASC);

    PRINT 'DogProfiles table created successfully.';
END
ELSE
BEGIN
    PRINT 'DogProfiles table already exists. Skipping creation.';
END
GO
