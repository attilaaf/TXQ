ALTER TABLE txoutgroup ADD COLUMN metadata jsonb NULL;

-- Insert versions bootstrap
INSERT INTO versions(version) VALUES ('202009010000');

