-- =============================================
-- Add ParentCommentId to CommunityComments
-- To support subcomments (replies)
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('CommunityComments') 
               AND name = 'ParentCommentId')
BEGIN
    ALTER TABLE CommunityComments
    ADD ParentCommentId UNIQUEIDENTIFIER NULL;

    -- Add Foreign Key constraint to the same table (Self-referencing)
    ALTER TABLE CommunityComments
    ADD CONSTRAINT FK_CommunityComments_Parent FOREIGN KEY (ParentCommentId) 
    REFERENCES CommunityComments(CommentId);

    PRINT '✅ ParentCommentId column and constraint added to CommunityComments.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Column ParentCommentId already exists.';
END
GO
