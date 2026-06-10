-- 1. Add Columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BondingActivities]') AND name = 'Category')
BEGIN
    ALTER TABLE [dbo].[BondingActivities] ADD Category NVARCHAR(50) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BondingActivities]') AND name = 'InteractionType')
BEGIN
    ALTER TABLE [dbo].[BondingActivities] ADD InteractionType NVARCHAR(50) NULL;
END

GO

-- 2. Update Data (Category, InteractionType, Balanced Points)

-- Physical
UPDATE [dbo].[BondingActivities] SET Category = 'Physical', InteractionType = 'Checkbox', Points = 2 WHERE ActivityName = 'Morning Walk';
UPDATE [dbo].[BondingActivities] SET Category = 'Physical', InteractionType = 'Checkbox', Points = 2 WHERE ActivityName = 'Mindful Walk';
UPDATE [dbo].[BondingActivities] SET Category = 'Physical', InteractionType = 'Checkbox', Points = 5 WHERE ActivityName = 'Outdoor Adventure'; -- Reduced from 30
UPDATE [dbo].[BondingActivities] SET Category = 'Physical', InteractionType = 'Checkbox', Points = 2 WHERE ActivityName = 'Playtime'; -- Reduced from 15
UPDATE [dbo].[BondingActivities] SET Category = 'Physical', InteractionType = 'Checkbox', Points = 1 WHERE ActivityName = 'Grooming'; -- Reduced from 12
UPDATE [dbo].[BondingActivities] SET Category = 'Physical', InteractionType = 'Checkbox', Points = 1 WHERE ActivityName = 'Feeding Time'; -- Reduced from 8
UPDATE [dbo].[BondingActivities] SET Category = 'Physical', InteractionType = 'Checkbox', Points = 2 WHERE ActivityName = 'Belly Rubs'; -- Reduced from 5
UPDATE [dbo].[BondingActivities] SET Category = 'Physical', InteractionType = 'Checkbox', Points = 4 WHERE ActivityName = 'Training Session'; -- Reduced from 20

-- Spiritual / Ritual (Redirects)
UPDATE [dbo].[BondingActivities] SET Category = 'Spiritual', InteractionType = 'Redirect', Points = 2 WHERE ActivityName = 'Chakra Sync';
UPDATE [dbo].[BondingActivities] SET Category = 'Spiritual', InteractionType = 'Redirect', Points = 2 WHERE ActivityName = 'Synchronized Breathing';
UPDATE [dbo].[BondingActivities] SET Category = 'Spiritual', InteractionType = 'Redirect', Points = 3 WHERE ActivityName = 'Meditation Together'; -- Reduced from 25
UPDATE [dbo].[BondingActivities] SET Category = 'Spiritual', InteractionType = 'Redirect', Points = 2 WHERE ActivityName = 'Bedtime Blessing';
UPDATE [dbo].[BondingActivities] SET Category = 'Spiritual', InteractionType = 'Redirect', Points = 2 WHERE ActivityName = 'Energy Check-in';

-- Emotional / Reflection (Inputs)
UPDATE [dbo].[BondingActivities] SET Category = 'Emotional', InteractionType = 'Input', Points = 2 WHERE ActivityName = 'Gratitude Moment';
UPDATE [dbo].[BondingActivities] SET Category = 'Emotional', InteractionType = 'Input', Points = 2 WHERE ActivityName = 'Morning Intention Setting';
UPDATE [dbo].[BondingActivities] SET Category = 'Emotional', InteractionType = 'Input', Points = 2 WHERE ActivityName = 'Evening Reflection';

-- 3. Verify
SELECT * FROM [dbo].[BondingActivities];
