-- =============================================
-- Create PostReports Table
-- Strictly mapped to DTO: PostReport
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PostReports')
BEGIN
    CREATE TABLE PostReports (
        ReportId       UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PostId         UNIQUEIDENTIFIER NOT NULL,
        CommentId      UNIQUEIDENTIFIER NULL,
        ReporterUserId UNIQUEIDENTIFIER NOT NULL,
        Type           NVARCHAR(50)     NOT NULL DEFAULT 'Content',
        Priority       NVARCHAR(20)     NOT NULL DEFAULT 'medium',
        Status         NVARCHAR(20)     NOT NULL DEFAULT 'pending',
        Reason         NVARCHAR(1000)   NOT NULL,
        Description    NVARCHAR(2000)   NULL,
        ReportedOn     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT FK_PostReports_Posts FOREIGN KEY (PostId) REFERENCES CommunityPosts(PostId),
        CONSTRAINT FK_PostReports_Comments FOREIGN KEY (CommentId) REFERENCES CommunityComments(CommentId),
        CONSTRAINT FK_PostReports_Users FOREIGN KEY (ReporterUserId) REFERENCES Users(UserId)
    );
    CREATE INDEX IX_PostReports_PostId ON PostReports(PostId);
    CREATE INDEX IX_PostReports_ReporterUserId ON PostReports(ReporterUserId);
    PRINT '✅ PostReports table created.';
END
ELSE
BEGIN
    PRINT 'PostReports table already exists.';
END
GO
