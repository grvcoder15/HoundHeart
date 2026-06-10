-- Add access configuration columns to SacredGuides table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SacredGuides') AND name = 'PreviewPercentage')
BEGIN
    ALTER TABLE SacredGuides ADD PreviewPercentage INT DEFAULT 10;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SacredGuides') AND name = 'AllowFreeUserDownload')
BEGIN
    ALTER TABLE SacredGuides ADD AllowFreeUserDownload BIT DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SacredGuides') AND name = 'RequiresPremium')
BEGIN
    ALTER TABLE SacredGuides ADD RequiresPremium BIT DEFAULT 1;
END

-- Set default values for existing records
UPDATE SacredGuides 
SET PreviewPercentage = 10, 
    AllowFreeUserDownload = 0, 
    RequiresPremium = 1
WHERE PreviewPercentage IS NULL 
   OR AllowFreeUserDownload IS NULL 
   OR RequiresPremium IS NULL;
