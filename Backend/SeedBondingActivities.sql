-- Clear existing activities to avoid duplicates during development (Optional, but good for reset)
-- DELETE FROM BondingActivities;

-- Insert or Update BondingActivities
-- Using MERGE or IF NOT EXISTS logic not standard across all SQLs easily in one script without procedures,
-- so we will use basic INSERTs. Assuming Id is auto-generated or we specify it.
-- However, the model has Guid ActivityId. We should generate fixed Guids for consistency.

INSERT INTO BondingActivities (ActivityId, ActivityName, Points, Category, InteractionType)
VALUES 
-- Physical
(NEWID(), 'Morning Walk', 2, 'Physical', 'Checkbox'),
(NEWID(), 'Mindful Walk', 2, 'Physical', 'Checkbox'),
(NEWID(), 'Outdoor Adventure', 5, 'Physical', 'Checkbox'), -- Corrected from 30 to 5
(NEWID(), 'Playtime', 2, 'Physical', 'Checkbox'),
(NEWID(), 'Grooming', 1, 'Physical', 'Checkbox'),
(NEWID(), 'Feeding Time', 1, 'Physical', 'Checkbox'),
(NEWID(), 'Belly Rubs', 2, 'Physical', 'Checkbox'),
(NEWID(), 'Training Session', 4, 'Physical', 'Checkbox'), -- Corrected from 20 to 4

-- Spiritual / Ritual (Redirects)
(NEWID(), 'Chakra Sync', 2, 'Spiritual', 'Redirect'),
(NEWID(), 'Synchronized Breathing', 2, 'Spiritual', 'Redirect'),
(NEWID(), 'Meditation Together', 3, 'Spiritual', 'Redirect'), -- Corrected from 25 to 3
(NEWID(), 'Bedtime Blessing', 2, 'Spiritual', 'Redirect'),
(NEWID(), 'Energy Check-in', 2, 'Spiritual', 'Redirect'),

-- Emotional / Reflection (Inputs)
(NEWID(), 'Gratitude Moment', 2, 'Emotional', 'Input'),
(NEWID(), 'Morning Intention Setting', 2, 'Emotional', 'Input'),
(NEWID(), 'Evening Reflection', 2, 'Emotional', 'Input');
