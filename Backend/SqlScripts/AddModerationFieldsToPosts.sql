-- Add ModerationStatus and Hashtags to CommunityPosts table

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[CommunityPosts]') 
    AND name = 'ModerationStatus'
)
BEGIN
    ALTER TABLE [dbo].[CommunityPosts]
    ADD [ModerationStatus] NVARCHAR(50) NOT NULL DEFAULT 'published';
    
    PRINT 'Added ModerationStatus column.';
END
ELSE
BEGIN
    PRINT 'ModerationStatus column already exists.';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[CommunityPosts]') 
    AND name = 'Hashtags'
)
BEGIN
    ALTER TABLE [dbo].[CommunityPosts]
    ADD [Hashtags] NVARCHAR(MAX) NULL;
    
    PRINT 'Added Hashtags column.';
END
ELSE
BEGIN
    PRINT 'Hashtags column already exists.';
END
GO
