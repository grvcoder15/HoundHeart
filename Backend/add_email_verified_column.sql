-- Add IsEmailVerified column to Users table for email verification on signup
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsEmailVerified')
BEGIN
    ALTER TABLE Users
    ADD IsEmailVerified BIT NOT NULL DEFAULT 0;
    
    PRINT 'Column IsEmailVerified added to Users table';
END
ELSE
BEGIN
    PRINT 'Column IsEmailVerified already exists in Users table';
END;
