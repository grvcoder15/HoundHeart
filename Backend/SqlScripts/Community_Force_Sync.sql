-- =============================================
-- Community Module Force Sync Script (CLEAN VERSION)
-- This script performs a destructive clean-up to ensure 100% compatibility.
-- RUN THIS SCRIPT IN SQL SERVER to resolve the persistent 500 errors.
-- =============================================

-- 1. DROP Old PostReports table to remove "ghost" columns (UserId, CreatedOn)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PostReports')
BEGIN
    DROP TABLE PostReports;
    PRINT '🧹 Dropped old PostReports table to clean up conflicting columns.';
END

-- 2. CREATE CLEAN PostReports Table
CREATE TABLE PostReports (
    ReportId       UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PostId         UNIQUEIDENTIFIER NOT NULL,
    CommentId      UNIQUEIDENTIFIER NULL,
    ReporterUserId UNIQUEIDENTIFIER NOT NULL,
    Reason         NVARCHAR(1000)   NOT NULL,
    ReportedOn     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    IsResolved     BIT              NOT NULL DEFAULT 0,
    CONSTRAINT FK_PostReports_Posts FOREIGN KEY (PostId) REFERENCES CommunityPosts(PostId),
    CONSTRAINT FK_PostReports_Comments FOREIGN KEY (CommentId) REFERENCES CommunityComments(CommentId),
    CONSTRAINT FK_PostReports_Users FOREIGN KEY (ReporterUserId) REFERENCES Users(UserId)
);
PRINT '✅ Created CLEAN PostReports table.';

-- 3. ENHANCE CommunityComments Table (ParentCommentId)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CommunityComments') AND name = 'ParentCommentId')
BEGIN
    ALTER TABLE CommunityComments ADD ParentCommentId UNIQUEIDENTIFIER NULL;
    PRINT '✅ Added ParentCommentId to CommunityComments.';
END

-- Ensure FK_CommunityComments_Parent correct
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CommunityComments_Parent')
    ALTER TABLE CommunityComments DROP CONSTRAINT FK_CommunityComments_Parent;

ALTER TABLE CommunityComments ADD CONSTRAINT FK_CommunityComments_Parent FOREIGN KEY (ParentCommentId) REFERENCES CommunityComments(CommentId);
PRINT '✅ Verified Self-Referencing Foreign Key on CommunityComments.';

-- 4. VERIFY INDICES
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PostReports_PostId' AND object_id = OBJECT_ID('PostReports'))
    DROP INDEX IX_PostReports_PostId ON PostReports;
CREATE INDEX IX_PostReports_PostId ON PostReports(PostId);

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PostReports_ReporterUserId' AND object_id = OBJECT_ID('PostReports'))
    DROP INDEX IX_PostReports_ReporterUserId ON PostReports;
CREATE INDEX IX_PostReports_ReporterUserId ON PostReports(ReporterUserId);

PRINT '🚀 Community Module Sync COMPLETED SUCCESSFULLY.';
GO
