USE [HoundedHeartDb];
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SiteSettings')
BEGIN
    CREATE TABLE SiteSettings (
        [SettingKey] NVARCHAR(100) PRIMARY KEY,
        [SettingValue] NVARCHAR(MAX) NOT NULL
    );

    PRINT 'SiteSettings table created successfully.';
    
    INSERT INTO SiteSettings ([SettingKey], [SettingValue]) VALUES 
    ('AskExpert_NormalResponseTime', '24-48 hours'),
    ('AskExpert_HighPriorityResponseTime', '12-24 hours'),
    ('AskExpert_PremiumFeature1', 'Priority response (12-24 hours)'),
    ('AskExpert_PremiumFeature2', 'Follow-up questions included'),
    ('AskExpert_PremiumFeature3', 'Personalized wellness plans'),
    ('AskExpert_PremiumFeature4', 'Direct expert chat access'),
    ('AskExpert_Testimonial1_Text', 'The premium healing circles have been life-changing for me and Luna. Worth every penny!'),
    ('AskExpert_Testimonial1_Author', 'Sarah M.'),
    ('AskExpert_Testimonial2_Text', 'Advanced aura tracking helped me understand Max''s energy patterns so much better.'),
    ('AskExpert_Testimonial2_Author', 'Michael R.'),
    ('AskExpert_Testimonial3_Text', 'Being able to export our legacy journal brought me so much peace during Bella''s final days.'),
    ('AskExpert_Testimonial3_Author', 'Emma L.');

END
ELSE
BEGIN
    PRINT 'SiteSettings table already exists.';
END
GO
