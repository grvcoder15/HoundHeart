-- Insert Default Scoring Rules
-- Run this script in your SQL tool (SSMS or VS Code)

INSERT INTO [dbo].[ScoringRules] ([Id], [RuleName], [Points], [Description], [CreatedAt])
VALUES 
(NEWID(), 'Time_Spent_Per_Hour', 1.0, 'Points awarded per hour spent together (Max 10 pts)', GETDATE()),
(NEWID(), 'Peace_High', 1.0, 'Bonus if Peace rating is 7 or higher', GETDATE()),
(NEWID(), 'Peace_Improvement', 1.0, 'Bonus if Peace rating improved from yesterday', GETDATE()),
(NEWID(), 'Behavior_Improvement', 2.0, 'Bonus if Dog Behavior rating improved from yesterday', GETDATE()),
(NEWID(), 'Ritual_Bonus', 2.0, 'Points for completing a daily ritual', GETDATE()),
(NEWID(), 'Emergency_Penalty', -5.0, 'Penalty if Emergency or Neglect is reported', GETDATE()),
(NEWID(), 'Stress_Penalty', -2.0, 'Penalty if Peace < 4 and No Ritual performed', GETDATE()),
(NEWID(), 'Missed_CheckIn_Penalty', -3.0, 'Penalty for missing a day check-in', GETDATE());

-- Verify Insertion
SELECT * FROM [dbo].[ScoringRules];
