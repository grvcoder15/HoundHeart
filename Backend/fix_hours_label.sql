-- Fix Hours Check-in Label to match backend logic
-- Backend counts max 10 hours, so UI should show "10+ Hours"

UPDATE CheckIns
SET HighEnergyLabel = '10+ Hours'
WHERE Questions LIKE '%hours%'
  AND Questions LIKE '%together%'
  AND HighEnergyLabel = '12+ Hours';

-- Verify the change
SELECT CheckInId, Questions, LowEnergyLabel, HighEnergyLabel
FROM CheckIns
WHERE Questions LIKE '%hours%';
