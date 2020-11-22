
CREATE TABLE txstore (
    id varchar NOT NULL,
    category varchar NOT NULL,
    revision integer NOT NULL,
    tags jsonb NULL,
    metadata jsonb NULL,
    data jsonb NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_txstore_id ON txstore USING btree (id, category, revision);
CREATE INDEX idx_txstore_tags ON txstore USING gin ((jdoc -> 'tags'));

CREATE INDEX idx_txout_tags ON txout USING gin ((jdoc -> 'tags'));

INSERT INTO versions(version) VALUES ('202011110000');

