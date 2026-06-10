-- HoundHeart Database Schema Update
-- Goal: Add Age, Breed, and Weight to Profiles for Week 1
-- Rule: No EF Migrations (Raw SQL only)

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'Age')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [Age] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Dogs]') AND name = 'Breed')
BEGIN
    ALTER TABLE [dbo].[Dogs] ADD [Breed] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Dogs]') AND name = 'Age')
BEGIN
    ALTER TABLE [dbo].[Dogs] ADD [Age] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Dogs]') AND name = 'Weight')
BEGIN
    ALTER TABLE [dbo].[Dogs] ADD [Weight] FLOAT NULL;
END
GO
