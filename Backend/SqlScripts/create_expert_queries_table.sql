USE [HoundedHeartDb]; -- Adjust if actual DB name is different
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExpertQueries')
BEGIN
    CREATE TABLE [dbo].[ExpertQueries] (
        [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [CompanionName] NVARCHAR(100) NULL,
        [Category] NVARCHAR(100) NOT NULL,
        [Priority] NVARCHAR(20) NOT NULL,
        [Subject] NVARCHAR(200) NOT NULL,
        [QuestionText] NVARCHAR(MAX) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [CreatedOn] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [AdminResponse] NVARCHAR(MAX) NULL,
        [RespondedOn] DATETIME2 NULL,
        CONSTRAINT [FK_ExpertQueries_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([UserId])
    );
    PRINT 'ExpertQueries table created successfully.';
END
ELSE
BEGIN
    PRINT 'ExpertQueries table already exists.';
END
GO
