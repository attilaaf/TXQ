
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_with_oids = false;

CREATE TABLE mempool_filtered_txs (
    id bigserial PRIMARY KEY,
    txid varchar,
    rawtx bytea NOT NULL,
    session_id varchar NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX uk_mempool_filtered_txs ON mempool_filtered_txs USING btree (txid, session_id);
CREATE INDEX idx_mempool_filtered_txs_updated_at ON mempool_filtered_txs USING btree (created_at);

CREATE TABLE txfilter (
    id SERIAL PRIMARY KEY,
    name varchar NOT NULL,
    enabled boolean NULL,
    payload varchar NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
);

CREATE TABLE txmap (
    txid bytea PRIMARY KEY,
    rawtx TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_uk_txmap_created_at ON txmap USING btree (created_at);

CREATE TABLE txmempool (
    /*
     General tx info
    */
    id BIGSERIAL PRIMARY KEY,
    address bytea NULL,
    size integer NULL,
    txid bytea NOT NULL,
    version int NULL,
    locktime bigint NULL,
    ins int NULL,
    outs int NULL,
    /*
      Inputs for tx at input index n
    */
    n int NOT NULL,
    prevtxid bytea NULL,
    prevn int NULL,
    seq bigint NULL,
    unlockscript bytea NULL
    /*
     Outputs for tx at output index n
    */
    satoshis bigint NULL,
    lockscript bytea NULL,
    scripthash bytea NULL,
    created_at TIMESTAMPTZ NOT NULL
);
 
CREATE UNIQUE INDEX idx_key_txmempool_txid_n ON txmempool USING btree (txid, n);
CREATE INDEX idx_key_txmempool_address ON txmempool USING btree (address);
CREATE INDEX idx_key_txmempool_txid ON txmempool USING btree (txid);
CREATE INDEX idx_key_txmempool_prevtxid ON txmempool USING btree (prevtxid);
CREATE INDEX idx_key_txmempool_prevn ON txmempool USING btree (prevn);
CREATE INDEX idx_key_txmempool_n ON txmempool USING btree (n);
CREATE INDEX idx_key_txmempool_scripthash ON txmempool USING btree (scripthash);
CREATE INDEX idx_key_txmempool_created_at ON txmempool USING btree (created_at);
CREATE INDEX idx_key_txmempool_lockscript ON txmempool USING btree (lockscript);
CREATE INDEX idx_key_txmempool_unlockscript ON txmempool USING btree (unlockscript);

CREATE TABLE versions (
    version_id SERIAL PRIMARY KEY,
    version text NOT NULL
);
CREATE UNIQUE INDEX idx_uk_versions_version ON versions USING btree (version);
INSERT INTO versions(version) VALUES ('mempool202101070000');

