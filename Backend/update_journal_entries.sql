-- Add MediaType and MediaUrl columns to JournalEntries table
-- Run this script in your SQL Server Management Studio (SSMS) or equivalent tool

ALTER TABLE JournalEntries ADD MediaType NVARCHAR(50) NULL;
ALTER TABLE JournalEntries ADD MediaUrl NVARCHAR(MAX) NULL;

-- Optional: Update existing entries to have 'Text' as default MediaType if needed
-- UPDATE JournalEntries SET MediaType = 'Text' WHERE MediaType IS NULL;
