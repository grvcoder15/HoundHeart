USE [HoundedHeartDb];
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExpertQueryCategories')
BEGIN
    CREATE TABLE ExpertQueryCategories (
        [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(255) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [DisplayOrder] INT NOT NULL DEFAULT 0,
        [CreatedOn] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    PRINT 'ExpertQueryCategories table created successfully.';
END
ELSE
BEGIN
    PRINT 'ExpertQueryCategories table already exists.';
END
GO

-- Seed Data
IF NOT EXISTS (SELECT * FROM ExpertQueryCategories WHERE [Name] = 'Spiritual Bonding & Connection')
BEGIN
    INSERT INTO ExpertQueryCategories ([Name], [DisplayOrder]) VALUES 
    ('Spiritual Bonding & Connection', 1),
    ('Energy Syncing & Chakra Alignment', 2),
    ('Meditation & Mindfulness', 3),
    ('Wellness & Lifestyle Guidance', 4),
    ('Behavioral & Emotional Support', 5),
    ('Daily Rituals & Practices', 6),
    ('Legacy Planning & Memories', 7),
    ('Other Spiritual Concerns', 8);

    PRINT 'ExpertQueryCategories table seeded.';
END
GO
