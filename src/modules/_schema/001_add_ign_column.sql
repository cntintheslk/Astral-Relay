-- Add IGN column (only run once)
ALTER TABLE registrations ADD COLUMN ign TEXT DEFAULT '';

-- Backfill
UPDATE registrations
SET ign = 'Unknown'
WHERE ign IS NULL OR ign = '';
