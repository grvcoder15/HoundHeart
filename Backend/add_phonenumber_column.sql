IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'HumanProfiles' AND COLUMN_NAME = 'PhoneNumber'
)
BEGIN
    ALTER TABLE HumanProfiles
    ADD PhoneNumber NVARCHAR(20) NULL;
    PRINT 'Added PhoneNumber column to HumanProfiles.';
END
ELSE
    PRINT 'PhoneNumber already exists in HumanProfiles. Skipping.';
