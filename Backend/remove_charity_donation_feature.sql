-- ============================================================
-- Remove "$10 donation to animal welfare charities" from the
-- HoundHeart Premium plan's Features JSON in the database.
-- Run this script once against your live/staging database.
-- ============================================================

-- PostgreSQL version (use this for the live DB):
UPDATE "SubscriptionPlans"
SET "Features" = (
    SELECT jsonb_agg(elem)::text
    FROM jsonb_array_elements_text("Features"::jsonb) AS elem
    WHERE elem NOT ILIKE '%donation%'
)
WHERE "PlanName" = 'HoundHeart Premium'
  AND "Features" LIKE '%donation%';

-- Verify the change:
SELECT "PlanName", "Features"
FROM "SubscriptionPlans"
WHERE "PlanName" = 'HoundHeart Premium';
