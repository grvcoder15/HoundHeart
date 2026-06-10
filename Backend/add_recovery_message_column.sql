-- Add RecoveryMessage column to WellnessAlerts table
ALTER TABLE WellnessAlerts 
ADD RecoveryMessage NVARCHAR(500) NULL;

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'WellnessAlerts' 
AND COLUMN_NAME = 'RecoveryMessage';