CREATE TABLE txasset (
    assetid varchar NOT NULL,
    owner_address varchar NULL,
    owner_pubkey varchar NULL,
    data jsonb NULL,
    txid varchar NOT NULL,
    index integer NOT NULL
);

CREATE UNIQUE INDEX idx_asset_txid_index ON txasset USING btree (txid, index);
CREATE INDEX idx_asset_assetid ON txasset USING btree (assetid);
CREATE INDEX idx_asset_owner_pubkey ON txasset USING btree (owner_pubkey);
CREATE INDEX idx_asset_owner_address ON txasset USING btree (owner_address);