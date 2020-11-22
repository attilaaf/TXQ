
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

CREATE INDEX idx_txmeta_tags ON txmeta USING gin ((jdoc -> 'tags'));

CREATE TABLE txoutmeta (
    id varchar NOT NULL,
    category varchar NOT NULL,
    path varchar NULL,
    txid varchar NOT NULL,
    index integer NOT NULL,
    script text NULL,
    address varchar NULL,
    scripthash varchar NULL,
    satoshis bigint NULL,
    tags jsonb NULL,
    metadata jsonb NULL,
    data jsonb NULL,
    archived boolean NOT NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_utxostore_id ON utxostore USING btree (id, category, txid, index);
CREATE INDEX idx_utxostore_tags ON utxostore USING gin ((jdoc -> 'tags'));

ALTER TABLE txout ADD COLUMN metadata jsonb NULL;
ALTER TABLE txout ADD COLUMN extracted jsonb NULL;
ALTER TABLE txout ADD COLUMN tags jsonb NULL;

CREATE INDEX idx_txout_tags ON txout USING gin ((jdoc -> 'tags'));

INSERT INTO versions(version) VALUES ('202011110000');

