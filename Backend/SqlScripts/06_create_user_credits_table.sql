-- ============================================================
-- Script: 06_create_user_credits_table.sql
-- Purpose: Create UserCredits table to track monthly Intuitive 
--          Reading usage per user per billing cycle.
-- Note: NO EF Migrations. Run this manually in SQL Server.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserCredits' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[UserCredits] (
        [Id]                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]            UNIQUEIDENTIFIER NOT NULL,
        [CreditType]        NVARCHAR(50)     NOT NULL DEFAULT 'IntuitiveReading',
        [CreditsTotal]      INT              NOT NULL DEFAULT 5,
        [CreditsUsed]       INT              NOT NULL DEFAULT 0,
        [BillingCycleStart] DATETIME2        NOT NULL,
        [BillingCycleEnd]   DATETIME2        NOT NULL,
        [IsDeleted]         BIT              NOT NULL DEFAULT 0,
        [CreatedOn]         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedOn]         DATETIME2        NULL,
        CONSTRAINT [PK_UserCredits] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_UserCredits_Users] FOREIGN KEY ([UserId]) 
            REFERENCES [dbo].[Users]([UserId]) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX [IX_UserCredits_UserId_CreditType] 
        ON [dbo].[UserCredits]([UserId] ASC, [CreditType] ASC)
        WHERE [IsDeleted] = 0;

    PRINT 'UserCredits table created successfully.';
END
ELSE
BEGIN
    PRINT 'UserCredits table already exists. Skipping creation.';
END
