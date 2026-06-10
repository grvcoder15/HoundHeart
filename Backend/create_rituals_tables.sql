-- Create Rituals Table
CREATE TABLE Rituals (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    Duration NVARCHAR(50), -- e.g. "5 min"
    Category NVARCHAR(50) NOT NULL, -- Morning, Afternoon, Evening
    IconType NVARCHAR(50)
);

-- Create RitualLogs Table
CREATE TABLE RitualLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RitualId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    CompletedAt DATETIME NOT NULL DEFAULT GETDATE(),
    BonusAwarded BIT NOT NULL DEFAULT 0, -- Tracks if this specific log triggered the daily bonus
    CONSTRAINT FK_RitualLogs_Rituals FOREIGN KEY (RitualId) REFERENCES Rituals(Id),
    CONSTRAINT FK_RitualLogs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Insert Default Rituals
INSERT INTO Rituals (Id, Title, Description, Duration, Category, IconType)
VALUES 
(NEWID(), 'Morning Intention Setting', 'Start your day with a clear intention.', '5 min', 'Morning', 'Sun'),
(NEWID(), 'Gratitude Moment', 'Reflect on what you are grateful for.', '2 min', 'Morning', 'Heart'),
(NEWID(), 'Energy Check-in', 'Assess your current energy levels.', '1 min', 'Morning', 'Battery'),
(NEWID(), 'Mindful Walk', 'Take a walk with full awareness.', '15 min', 'Afternoon', 'Walk'),
(NEWID(), 'Evening Reflection', 'Reflect on the events of the day.', '10 min', 'Evening', 'Moon'),
(NEWID(), 'Bedtime Blessing', 'Send a blessing before sleep.', '5 min', 'Evening', 'Star');
