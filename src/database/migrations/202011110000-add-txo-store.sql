
CREATE TABLE txstore (
    id varchar NOT NULL,
    category varchar NOT NULL,
    revision integer NOT NULL,
    data jsonb NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_id ON txstore USING btree (id, category, revision);

-- Insert versions bootstrap
INSERT INTO versions(version) VALUES ('202011110000');

