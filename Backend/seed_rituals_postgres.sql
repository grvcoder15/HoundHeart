-- Seed default Rituals into PostgreSQL
-- Run this against your PostgreSQL database if the Rituals table is empty.
-- Uses gen_random_uuid() which is available in PostgreSQL 13+ natively.

INSERT INTO "Rituals" ("Id", "Title", "Description", "Duration", "Category", "IconType")
SELECT gen_random_uuid(), 'Morning Intention Setting', 'Start your day with a clear intention.', '5 min', 'Morning', 'Sun'
WHERE NOT EXISTS (SELECT 1 FROM "Rituals" WHERE "Title" = 'Morning Intention Setting');

INSERT INTO "Rituals" ("Id", "Title", "Description", "Duration", "Category", "IconType")
SELECT gen_random_uuid(), 'Gratitude Moment', 'Reflect on what you are grateful for.', '2 min', 'Morning', 'Heart'
WHERE NOT EXISTS (SELECT 1 FROM "Rituals" WHERE "Title" = 'Gratitude Moment');

INSERT INTO "Rituals" ("Id", "Title", "Description", "Duration", "Category", "IconType")
SELECT gen_random_uuid(), 'Energy Check-in', 'Assess your current energy levels.', '1 min', 'Morning', 'Battery'
WHERE NOT EXISTS (SELECT 1 FROM "Rituals" WHERE "Title" = 'Energy Check-in');

INSERT INTO "Rituals" ("Id", "Title", "Description", "Duration", "Category", "IconType")
SELECT gen_random_uuid(), 'Mindful Walk', 'Take a walk with full awareness.', '15 min', 'Afternoon', 'Walk'
WHERE NOT EXISTS (SELECT 1 FROM "Rituals" WHERE "Title" = 'Mindful Walk');

INSERT INTO "Rituals" ("Id", "Title", "Description", "Duration", "Category", "IconType")
SELECT gen_random_uuid(), 'Evening Reflection', 'Reflect on the events of the day.', '10 min', 'Evening', 'Moon'
WHERE NOT EXISTS (SELECT 1 FROM "Rituals" WHERE "Title" = 'Evening Reflection');

INSERT INTO "Rituals" ("Id", "Title", "Description", "Duration", "Category", "IconType")
SELECT gen_random_uuid(), 'Bedtime Blessing', 'Send a blessing before sleep.', '5 min', 'Evening', 'Star'
WHERE NOT EXISTS (SELECT 1 FROM "Rituals" WHERE "Title" = 'Bedtime Blessing');

-- Verify
SELECT "Id", "Title", "Category", "Duration", "IconType" FROM "Rituals" ORDER BY "Category", "Title";
