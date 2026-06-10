-- =============================================
-- Community Module Missing Tables
-- =============================================

-- 1. HealingCircles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HealingCircles')
BEGIN
    CREATE TABLE HealingCircles (
        Id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Title              NVARCHAR(200)    NOT NULL,
        Time               NVARCHAR(100)    NOT NULL,
        Description        NVARCHAR(1000)   NULL,
        ParticipantsCount  INT              NOT NULL DEFAULT 0,
        MaxParticipants    INT              NOT NULL DEFAULT 100,
        IsPremium          BIT              NOT NULL DEFAULT 0,
        CreatedOn          DATETIME2        NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT '✅ HealingCircles table created.';
END
GO

-- 2. TrendingTopics
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrendingTopics')
BEGIN
    CREATE TABLE TrendingTopics (
        Id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        TopicName          NVARCHAR(100)    NOT NULL,
        Count              NVARCHAR(50)     NULL,
        CreatedOn          DATETIME2        NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT '✅ TrendingTopics table created.';
END
GO

-- 3. CommunityDiscussions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CommunityDiscussions')
BEGIN
    CREATE TABLE CommunityDiscussions (
        Id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Title              NVARCHAR(255)    NOT NULL,
        AuthorName         NVARCHAR(150)    NOT NULL,
        RepliesCount       INT              NOT NULL DEFAULT 0,
        IsPinned           BIT              NOT NULL DEFAULT 0,
        LastActive         NVARCHAR(100)    NULL,
        CreatedOn          DATETIME2        NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT '✅ CommunityDiscussions table created.';
END
GO

-- =============================================
-- Seed Data (Optional)
-- =============================================

-- Seed Trending Topics if empty
IF NOT EXISTS (SELECT 1 FROM TrendingTopics)
BEGIN
    INSERT INTO TrendingTopics (TopicName, Count) VALUES 
    ('#ChakraAlignment', '1.2K'),
    ('#MindfulWalk', '890'),
    ('#HealingJourney', '750'),
    ('#PetLove', '620');
END

-- Seed Healing Circles if empty
IF NOT EXISTS (SELECT 1 FROM HealingCircles)
BEGIN
    INSERT INTO HealingCircles (Title, Time, Description, ParticipantsCount, MaxParticipants, IsPremium) VALUES 
    ('Full Moon Healing Circle', 'Sunday, Sep 22 7:00 PM EST', 'Join us for a guided meditation session to harness the full moons energy with your canine companion.', 156, 200, 0),
    ('Chakra Alignment Workshop', 'Wednesday, Sep 25 6:30 PM EST', 'Premium members exclusive workshop on aligning your chakras with your dogs energy centers.', 89, 100, 1),
    ('Community Gratitude Gathering', 'Saturday, Sep 28 10:00 AM EST', 'Share your gratitude stories and celebrate the bonds weve strengthened this month.', 234, 300, 0);
END

-- Seed Discussions if empty
IF NOT EXISTS (SELECT 1 FROM CommunityDiscussions)
BEGIN
    INSERT INTO CommunityDiscussions (Title, AuthorName, RepliesCount, IsPinned, LastActive) VALUES 
    ('Tips for meditation with energetic puppies?', 'Alex Kim', 23, 1, '15 min ago'),
    ('How do you identify chakra blockages in your dog?', 'Sarah Wilson', 45, 0, '2 hours ago'),
    ('Success stories with the 7-day Heart Bond ritual', 'Michael Chen', 128, 0, '1 day ago');
END
GO
