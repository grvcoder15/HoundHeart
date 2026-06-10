-- =============================================
-- Consolidated Community Module Setup
-- Includes: Posts, Likes, Comments, Circles, Topics, Discussions, and Registrations
-- =============================================

-- 1. CommunityPosts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CommunityPosts')
BEGIN
    CREATE TABLE CommunityPosts (
        PostId          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId          UNIQUEIDENTIFIER NOT NULL,
        Content         NVARCHAR(2000)   NOT NULL,
        ImageUrl        NVARCHAR(500)    NULL,
        LikeCount       INT              NOT NULL DEFAULT 0,
        CommentCount    INT              NOT NULL DEFAULT 0,
        CreatedOn       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        UpdatedOn       DATETIME2        NULL,
        IsDeleted       BIT              NOT NULL DEFAULT 0,
        CONSTRAINT FK_CommunityPosts_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
    );
    CREATE INDEX IX_CommunityPosts_UserId ON CommunityPosts(UserId);
    CREATE INDEX IX_CommunityPosts_CreatedOn ON CommunityPosts(CreatedOn DESC);
    PRINT '✅ CommunityPosts table created.';
END
GO

-- 2. CommunityLikes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CommunityLikes')
BEGIN
    CREATE TABLE CommunityLikes (
        LikeId          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PostId          UNIQUEIDENTIFIER NOT NULL,
        UserId          UNIQUEIDENTIFIER NOT NULL,
        CreatedOn       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_CommunityLikes_Posts FOREIGN KEY (PostId) REFERENCES CommunityPosts(PostId),
        CONSTRAINT FK_CommunityLikes_Users FOREIGN KEY (UserId) REFERENCES Users(UserId),
        CONSTRAINT UQ_CommunityLikes_PostUser UNIQUE (PostId, UserId)
    );
    CREATE INDEX IX_CommunityLikes_PostId ON CommunityLikes(PostId);
    PRINT '✅ CommunityLikes table created.';
END
GO

-- 3. CommunityComments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CommunityComments')
BEGIN
    CREATE TABLE CommunityComments (
        CommentId       UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PostId          UNIQUEIDENTIFIER NOT NULL,
        UserId          UNIQUEIDENTIFIER NOT NULL,
        Content         NVARCHAR(1000)   NOT NULL,
        CreatedOn       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        IsDeleted       BIT              NOT NULL DEFAULT 0,
        CONSTRAINT FK_CommunityComments_Posts FOREIGN KEY (PostId) REFERENCES CommunityPosts(PostId),
        CONSTRAINT FK_CommunityComments_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
    );
    CREATE INDEX IX_CommunityComments_PostId ON CommunityComments(PostId);
    PRINT '✅ CommunityComments table created.';
END
GO

-- 4. HealingCircles
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

-- 5. TrendingTopics
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

-- 6. CommunityDiscussions
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

-- 7. HealingCircleRegistrations (NEW)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HealingCircleRegistrations')
BEGIN
    CREATE TABLE HealingCircleRegistrations (
        RegistrationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CircleId       UNIQUEIDENTIFIER NOT NULL,
        UserId         UNIQUEIDENTIFIER NOT NULL,
        RegisteredOn   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Registration_Circle FOREIGN KEY (CircleId) REFERENCES HealingCircles(Id),
        CONSTRAINT FK_Registration_User   FOREIGN KEY (UserId)   REFERENCES Users(UserId)
    );
    CREATE INDEX IX_Registration_Circle ON HealingCircleRegistrations(CircleId);
    CREATE INDEX IX_Registration_User   ON HealingCircleRegistrations(UserId);
    PRINT '✅ HealingCircleRegistrations table created.';
END
GO

-- =============================================
-- Seed Data
-- =============================================

IF NOT EXISTS (SELECT 1 FROM TrendingTopics)
BEGIN
    INSERT INTO TrendingTopics (TopicName, Count) VALUES 
    ('#ChakraAlignment', '1.2K'), ('#MindfulWalk', '890'), ('#HealingJourney', '750'), ('#PetLove', '620');
END

IF NOT EXISTS (SELECT 1 FROM HealingCircles)
BEGIN
    INSERT INTO HealingCircles (Title, Time, Description, ParticipantsCount, MaxParticipants, IsPremium) VALUES 
    ('Full Moon Healing Circle', 'Sunday, Sep 22 7:00 PM EST', 'Join us for a guided meditation session to harness the full moons energy with your canine companion.', 156, 200, 0),
    ('Chakra Alignment Workshop', 'Wednesday, Sep 25 6:30 PM EST', 'Premium members exclusive workshop on aligning your chakras with your dogs energy centers.', 89, 100, 1),
    ('Community Gratitude Gathering', 'Saturday, Sep 28 10:00 AM EST', 'Share your gratitude stories and celebrate the bonds weve strengthened this month.', 234, 300, 0);
END

IF NOT EXISTS (SELECT 1 FROM CommunityDiscussions)
BEGIN
    INSERT INTO CommunityDiscussions (Title, AuthorName, RepliesCount, IsPinned, LastActive) VALUES 
    ('Tips for meditation with energetic puppies?', 'Alex Kim', 23, 1, '15 min ago'),
    ('How do you identify chakra blockages in your dog?', 'Sarah Wilson', 45, 0, '2 hours ago'),
    ('Success stories with the 7-day Heart Bond ritual', 'Michael Chen', 128, 0, '1 day ago');
END
GO
