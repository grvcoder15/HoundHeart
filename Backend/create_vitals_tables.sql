-- Create HumanVitals table
CREATE TABLE [HumanVitals] (
    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
    [UserId] uniqueidentifier NOT NULL,
    [HeartRate] int NOT NULL,
    [HRV] real NOT NULL,
    [Steps] int NOT NULL,
    [SleepScore] int NOT NULL,
    [StressScore] int NULL,
    [Source] nvarchar(50) NOT NULL DEFAULT 'mock',
    [TimestampUtc] datetime2 NOT NULL
);

-- Create DogVitals table
CREATE TABLE [DogVitals] (
    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
    [DogId] uniqueidentifier NOT NULL,
    [HeartRate] int NULL,
    [ActivityScore] int NOT NULL,
    [Temperature] real NULL,
    [RestScore] int NOT NULL,
    [RespirationRate] real NULL,
    [State] nvarchar(50) NOT NULL,
    [Source] nvarchar(50) NOT NULL DEFAULT 'mock',
    [TimestampUtc] datetime2 NOT NULL
);

-- Create UserBaselines table
CREATE TABLE [UserBaselines] (
    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
    [UserId] uniqueidentifier NOT NULL UNIQUE,
    [AvgHeartRate] real NOT NULL,
    [AvgHRV] real NOT NULL,
    [HRVStdDev] real NOT NULL,
    [AvgSleepScore] real NOT NULL,
    [AvgSteps] real NOT NULL,
    [LastUpdatedUtc] datetime2 NOT NULL,
    [DaysOfDataCollected] int NOT NULL
);

-- Add foreign key constraints
ALTER TABLE [HumanVitals] ADD CONSTRAINT [FK_HumanVitals_HumanProfiles_UserId] 
FOREIGN KEY ([UserId]) REFERENCES [HumanProfiles] ([UserId]) ON DELETE CASCADE;

ALTER TABLE [DogVitals] ADD CONSTRAINT [FK_DogVitals_DogProfiles_DogId] 
FOREIGN KEY ([DogId]) REFERENCES [DogProfiles] ([Id]) ON DELETE CASCADE;

ALTER TABLE [UserBaselines] ADD CONSTRAINT [FK_UserBaselines_HumanProfiles_UserId] 
FOREIGN KEY ([UserId]) REFERENCES [HumanProfiles] ([UserId]) ON DELETE CASCADE;