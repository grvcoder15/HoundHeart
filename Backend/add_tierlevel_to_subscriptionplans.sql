-- Add TierLevel column to SubscriptionPlans table
-- This column tracks which tier (free, plus, premium) each subscription plan belongs to

ALTER TABLE "SubscriptionPlans"
ADD COLUMN "TierLevel" varchar(20) NOT NULL DEFAULT 'plus';

-- Add comment for documentation
COMMENT ON COLUMN "SubscriptionPlans"."TierLevel" IS 'Tier level for the subscription plan: free, plus, or premium';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'SubscriptionPlans' AND column_name = 'TierLevel';
