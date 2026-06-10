-- Migration script for Daily Summary tables
-- Run this in your SQL Server database

-- Create HumanDailySummaries table
CREATE TABLE [dbo].[HumanDailySummaries](
    [Id] [uniqueidentifier] NOT NULL,
    [UserId] [uniqueidentifier] NOT NULL,
    [Date] [date] NOT NULL,
    [AvgHeartRate] [float] NOT NULL DEFAULT(0),
    [AvgHRV] [float] NOT NULL DEFAULT(0),
    [TotalSteps] [int] NOT NULL DEFAULT(0),
    [AvgSleepScore] [float] NOT NULL DEFAULT(0),
    [AvgStressScore] [float] NOT NULL DEFAULT(0),
    [AvgAmbientTemperature] [float] NOT NULL DEFAULT(0),
    [MinHeartRate] [float] NOT NULL DEFAULT(0),
    [MaxHeartRate] [float] NOT NULL DEFAULT(0),
    [MinHRV] [float] NOT NULL DEFAULT(0),
    [MaxHRV] [float] NOT NULL DEFAULT(0),
    [Score] [int] NOT NULL DEFAULT(0),
    [Trend] [nvarchar](50) NULL,
    [ScoreTitle] [nvarchar](100) NULL,
    [ScoreDescription] [nvarchar](max) NULL,
    [ScoreAction] [nvarchar](max) NULL,
    [Disclaimer] [nvarchar](max) NULL,
    [DataPointsCount] [int] NOT NULL DEFAULT(0),
    [CreatedAt] [datetime2](7) NOT NULL,
    CONSTRAINT [PK_HumanDailySummaries] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_HumanDailySummaries_HumanProfiles_UserId] 
        FOREIGN KEY([UserId]) REFERENCES [dbo].[HumanProfiles] ([UserId])
);

-- Create indexes for better performance
CREATE NONCLUSTERED INDEX [IX_HumanDailySummaries_UserId_Date] 
ON [dbo].[HumanDailySummaries] ([UserId] ASC, [Date] ASC);

CREATE NONCLUSTERED INDEX [IX_HumanDailySummaries_Date] 
ON [dbo].[HumanDailySummaries] ([Date] ASC);

-- Create DogDailySummaries table
CREATE TABLE [dbo].[DogDailySummaries](
    [Id] [uniqueidentifier] NOT NULL,
    [DogId] [uniqueidentifier] NOT NULL,
    [UserId] [uniqueidentifier] NOT NULL,
    [Date] [date] NOT NULL,
    [AvgHeartRate] [float] NOT NULL DEFAULT(0),
    [AvgTemperature] [float] NOT NULL DEFAULT(0),
    [AvgActivityScore] [float] NOT NULL DEFAULT(0),
    [AvgRestScore] [float] NOT NULL DEFAULT(0),
    [AvgRespirationRate] [float] NOT NULL DEFAULT(0),
    [MinHeartRate] [float] NOT NULL DEFAULT(0),
    [MaxHeartRate] [float] NOT NULL DEFAULT(0),
    [MinTemperature] [float] NOT NULL DEFAULT(0),
    [MaxTemperature] [float] NOT NULL DEFAULT(0),
    [RestPercentage] [float] NOT NULL DEFAULT(0),
    [ActivePercentage] [float] NOT NULL DEFAULT(0),
    [PlayPercentage] [float] NOT NULL DEFAULT(0),
    [SleepPercentage] [float] NOT NULL DEFAULT(0),
    [DataPointsCount] [int] NOT NULL DEFAULT(0),
    [CreatedAt] [datetime2](7) NOT NULL,
    CONSTRAINT [PK_DogDailySummaries] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_DogDailySummaries_DogProfiles_DogId] 
        FOREIGN KEY([DogId]) REFERENCES [dbo].[DogProfiles] ([Id]),
    CONSTRAINT [FK_DogDailySummaries_HumanProfiles_UserId] 
        FOREIGN KEY([UserId]) REFERENCES [dbo].[HumanProfiles] ([UserId])
);

-- Create indexes for better performance
CREATE NONCLUSTERED INDEX [IX_DogDailySummaries_DogId_Date] 
ON [dbo].[DogDailySummaries] ([DogId] ASC, [Date] ASC);

CREATE NONCLUSTERED INDEX [IX_DogDailySummaries_UserId_Date] 
ON [dbo].[DogDailySummaries] ([UserId] ASC, [Date] ASC);

CREATE NONCLUSTERED INDEX [IX_DogDailySummaries_Date] 
ON [dbo].[DogDailySummaries] ([Date] ASC);

PRINT 'Daily Summary tables created successfully!';