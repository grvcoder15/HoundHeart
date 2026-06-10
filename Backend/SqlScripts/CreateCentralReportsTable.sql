-- =============================================
-- SQL Script: CreateCentralReportsTable.sql
-- Goal: Unified reports table for Content, User, and Behavior moderation.
-- Note: Run this manually as per STRICT NO-MIGRATION POLICY.
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PostReports')
BEGIN
    CREATE TABLE PostReports (
        ReportId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ReportType NVARCHAR(50) NOT NULL, -- 'Content', 'User', 'Behavior'
        Priority NVARCHAR(20) NOT NULL,   -- 'High', 'Medium', 'Low'
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Resolved', 'Dismissed'
        
        -- Relationships
        PostId UNIQUEIDENTIFIER NULL,        -- Links to CommunityPosts (if Content)
        ReportedUserId UNIQUEIDENTIFIER NULL, -- Links to Users (Person being reported)
        ReporterUserId UNIQUEIDENTIFIER NOT NULL, -- Links to Users (Person reporting)
        
        Reason NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        ReportedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        -- Foreign Key Constraints
        CONSTRAINT FK_Reports_Posts FOREIGN KEY (PostId) REFERENCES CommunityPosts(PostId),
        CONSTRAINT FK_Reports_ReportedUser FOREIGN KEY (ReportedUserId) REFERENCES AspNetUsers(Id),
        CONSTRAINT FK_Reports_ReporterUser FOREIGN KEY (ReporterUserId) REFERENCES AspNetUsers(Id)
    );
END
GO
