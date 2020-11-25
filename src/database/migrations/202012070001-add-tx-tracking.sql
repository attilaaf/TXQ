
-- ALTER TABLE txout ADD COLUMN auto_spend_tracker integer NULL;
-- CREATE INDEX idx_txout_auto_spend_tracker_index ON txout USING btree (auto_spend_tracker);
 
ALTER TABLE txin ADD COLUMN seq bigint NULL;

 
ALTER TABLE tx ADD COLUMN size integer NULL;
ALTER TABLE tx ADD COLUMN locktime integer NULL;

-- txsource 0=client_published, 1=blockfilter
ALTER TABLE tx ADD COLUMN txsource integer NULL; 
ALTER TABLE tx ADD COLUMN orphaned boolean NULL; 
CREATE INDEX idx_tx_orphaned ON tx USING btree (orphaned);
CREATE INDEX idx_tx_completed_index ON tx USING btree (completed);
 
-- No longer needed since we track spends with tx and txin
ALTER TABLE txout DROP COLUMN spend_index;
ALTER TABLE txout DROP COLUMN spend_txid;

CREATE TABLE txfilter (
    id SERIAL PRIMARY KEY,
    name varchar NOT NULL,
    payload varchar NOT NULL,
    match_type smallint NOT NULL,
    match_location smallint NOT NULL,
    enabled boolean NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
);

CREATE INDEX idx_txfilter_enabled ON txfilter USING btree (enabled);
CREATE INDEX idx_txfilter_id ON txfilter USING btree (id);
CREATE UNIQUE INDEX idx_txfilter_name ON txfilter USING btree (name);

INSERT INTO versions(version) VALUES ('202012080000');

 