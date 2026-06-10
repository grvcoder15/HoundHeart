-- Create FAQ Table for HoundHeart Application
-- Run this in your SQL Server database

CREATE TABLE [dbo].[FAQs] (
    [FAQId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [Question] NVARCHAR(500) NOT NULL,
    [Answer] NVARCHAR(MAX) NOT NULL,
    [Category] NVARCHAR(100) NOT NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'published',
    [DisplayOrder] INT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    [IsDeleted] BIT NOT NULL DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX [IX_FAQs_Status] ON [dbo].[FAQs] ([Status]) WHERE [IsDeleted] = 0;
CREATE INDEX [IX_FAQs_Category] ON [dbo].[FAQs] ([Category]) WHERE [IsDeleted] = 0;
CREATE INDEX [IX_FAQs_DisplayOrder] ON [dbo].[FAQs] ([DisplayOrder]);

-- Insert some sample FAQs
INSERT INTO [dbo].[FAQs] ([FAQId], [Question], [Answer], [Category], [Status], [DisplayOrder], [CreatedAt])
VALUES 
    (NEWID(), 
     'What is HoundHeart?', 
     'HoundHeart is a holistic wellness platform that strengthens the bond between you and your dog through guided practices, chakra healing, and community support.',
     'General',
     'published',
     1,
     GETUTCDATE()),
     
    (NEWID(),
     'How do I get started?',
     'Simply create an account, add your dog profile, and begin exploring our guided practices, chakra assessments, and wellness features.',
     'General',
     'published',
     2,
     GETUTCDATE()),
     
    (NEWID(),
     'What is included in a premium subscription?',
     'Premium members get access to exclusive sacred guides, advanced chakra practices, healing circles, and personalized wellness recommendations.',
     'Subscription',
     'published',
     3,
     GETUTCDATE()),
     
    (NEWID(),
     'How do I cancel my subscription?',
     'You can manage your subscription from your account settings. Navigate to Settings > Subscription and click "Manage Subscription" to update or cancel.',
     'Subscription',
     'published',
     4,
     GETUTCDATE());

PRINT 'FAQ table created successfully with sample data!';
