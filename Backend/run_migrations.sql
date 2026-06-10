-- Run SQL Migration Scripts in Order
-- Execute these scripts in SQL Server Management Studio or sqlcmd

-- Step 1: Alter ChakraLogs table (add new columns)
-- File: alter_chakra_logs.sql
-- This adds PetId, HarmonyScore, and DominantBlockage columns

-- Step 2: Insert 7 Chakras data
-- File: insert_chakras_data.sql
-- This inserts the 7 chakra records with NULL AudioUrls

-- To run via sqlcmd (PowerShell):
-- sqlcmd -S localhost -d HoundedHeart -E -i alter_chakra_logs.sql
-- sqlcmd -S localhost -d HoundedHeart -E -i insert_chakras_data.sql

-- To verify:
-- SELECT * FROM ChakraLogs ORDER BY CreatedAt DESC;
-- SELECT ChakraName, AudioUrl FROM Chakras;
