
CREATE TABLE txo_store (
    id varchar NOT NULL,
    category varchar NOT NULL,
    revision integer NOT NULL,
    data jsonb NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_id ON txo_store USING btree (id, category, revision);

-- Insert versions bootstrap
INSERT INTO versions(version) VALUES ('202011110000');

