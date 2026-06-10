IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[UserActivitiesScores]') AND name = 'ActivityDetails')
BEGIN
    ALTER TABLE [dbo].[UserActivitiesScores]
    ADD [ActivityDetails] NVARCHAR(MAX) NULL;
END
GO
