-- =============================================
-- Community Module Tables
-- Run this script manually on your local SQL Server
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

        CONSTRAINT FK_CommunityPosts_Users
            FOREIGN KEY (UserId) REFERENCES Users(UserId)
    );
    PRINT '✅ CommunityPosts table created.';
END
ELSE
    PRINT '⚠️ CommunityPosts already exists.';
GO

-- 2. CommunityLikes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CommunityLikes')
BEGIN
    CREATE TABLE CommunityLikes (
        LikeId          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PostId          UNIQUEIDENTIFIER NOT NULL,
        UserId          UNIQUEIDENTIFIER NOT NULL,
        CreatedOn       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_CommunityLikes_Posts
            FOREIGN KEY (PostId) REFERENCES CommunityPosts(PostId),
        CONSTRAINT FK_CommunityLikes_Users
            FOREIGN KEY (UserId) REFERENCES Users(UserId),
        CONSTRAINT UQ_CommunityLikes_PostUser
            UNIQUE (PostId, UserId)  -- one like per user per post
    );
    PRINT '✅ CommunityLikes table created.';
END
ELSE
    PRINT '⚠️ CommunityLikes already exists.';
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

        CONSTRAINT FK_CommunityComments_Posts
            FOREIGN KEY (PostId) REFERENCES CommunityPosts(PostId),
        CONSTRAINT FK_CommunityComments_Users
            FOREIGN KEY (UserId) REFERENCES Users(UserId)
    );
    PRINT '✅ CommunityComments table created.';
END
ELSE
    PRINT '⚠️ CommunityComments already exists.';
GO

-- Indexes for performance
CREATE NONCLUSTERED INDEX IX_CommunityPosts_UserId ON CommunityPosts(UserId);
CREATE NONCLUSTERED INDEX IX_CommunityPosts_CreatedOn ON CommunityPosts(CreatedOn DESC);
CREATE NONCLUSTERED INDEX IX_CommunityLikes_PostId ON CommunityLikes(PostId);
CREATE NONCLUSTERED INDEX IX_CommunityComments_PostId ON CommunityComments(PostId);
GO

PRINT '✅ All Community indexes created.';
