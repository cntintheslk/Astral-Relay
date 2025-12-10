ALTER TABLE registrations ADD COLUMN timestamp INTEGER DEFAULT 0;

UPDATE registrations
SET timestamp = strftime('%s', 'now')
WHERE timestamp = 0 OR timestamp IS NULL;