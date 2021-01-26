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

CREATE TABLE tx (
    id bigserial,
    txid varchar PRIMARY KEY,
    rawtx bytea NOT NULL,
    h varchar NULL,
    i integer NULL,
    time integer NULL,
    send jsonb NULL,
    status jsonb NULL,
    size integer NULL,
    locktime integer NULL,
    txsource smallint NULL,
    orphaned boolean NULL, 
    completed boolean NULL,
    sync integer NOT NULL,
    status_retries integer NULL,
    dlq varchar NULL,
    updated_at integer NOT NULL,
    created_at integer NOT NULL
);

CREATE INDEX idx_tx_i ON tx USING btree (i);
CREATE INDEX idx_tx_completed ON tx USING btree (completed);
CREATE INDEX idx_tx_time ON tx USING btree (time);
CREATE INDEX idx_tx_sync ON tx USING btree (sync);
CREATE INDEX idx_tx_dlq ON tx USING btree (dlq);
CREATE INDEX idx_tx_orphaned ON tx USING btree (orphaned);
CREATE INDEX idx_tx_id ON tx USING btree (id);
CREATE INDEX idx_tx_created_at ON tx USING btree (created_at);

CREATE TABLE txin (
    txid varchar NOT NULL,
    index integer NOT NULL,
    seq bigint NULL,
    prevtxid varchar NOT NULL,
    previndex integer NOT NULL,
    unlockscript bytea NOT NULL
);

CREATE UNIQUE INDEX idx_uk_txin_txid_index ON txin USING btree (txid, index);
CREATE UNIQUE INDEX idx_uk_txin_prevtxid_previndex ON txin USING btree (prevtxid, previndex);

CREATE TABLE txout (
    txid varchar NOT NULL,
    index integer NOT NULL,
    script bytea NOT NULL,
    address varchar NULL,
    scripthash varchar NOT NULL,
    satoshis bigint NOT NULL
);

-- Do not need index on txid because we always query with (txid, channel)
CREATE UNIQUE INDEX idx_uk_txout_txid_index ON txout USING btree (txid, index);
CREATE INDEX idx_txout_address_index ON txout USING btree (address);
CREATE INDEX idx_txout_scripthash_index ON txout USING btree (scripthash);

CREATE TABLE txmeta (
    id bigserial PRIMARY KEY,
    txid varchar NOT NULL,
    channel varchar NOT NULL,
    metadata jsonb NULL,
    tags jsonb NULL,
    extracted jsonb NULL,
    updated_at integer NOT NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_txmeta_txid_channel ON txmeta USING btree (txid, channel);
CREATE INDEX idx_txmeta_created_at ON txmeta USING btree (created_at);

CREATE TABLE block_header (
    height int PRIMARY KEY,
    hash varchar NOT NULL,
    header bytea NOT NULL,
    version int NULL,
    merkleroot varchar NOT NULL,
    time int NOT NULL,
    nonce bigint NOT NULL,
    bits varchar NOT NULL,
    difficulty varchar NOT NULL,
    previousblockhash varchar NULL
);

CREATE UNIQUE INDEX idx_key_block_header_hash ON block_header USING btree (hash);
CREATE UNIQUE INDEX idx_key_block_header_height ON block_header USING btree (height);

CREATE TABLE txoutgroup (
    groupname varchar NOT NULL,
    scriptid varchar NOT NULL,
    created_at integer NOT NULL,
    metadata jsonb NULL
);

CREATE INDEX idx_txoutgroup_groupname ON txoutgroup USING btree (groupname);
CREATE INDEX idx_txoutgroup_scriptid ON txoutgroup USING btree (scriptid);
CREATE UNIQUE INDEX idx_uk_txoutgroup_groupname_scriptid ON txoutgroup USING btree (groupname, scriptid);

CREATE TABLE txstore (
    id varchar NOT NULL,
    category varchar NOT NULL,
    revision integer NOT NULL,
    data jsonb NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_txstore_id ON txstore USING btree (id, category, revision);

CREATE TABLE merchantapilog (
    id SERIAL PRIMARY KEY,
    event_type varchar NULL,
    txid varchar NULL,
    response jsonb NULL,
    miner varchar NULL
);

CREATE TABLE updatelog (
    id SERIAL PRIMARY KEY,
    channel varchar NOT NULL,
    event_type varchar NULL,
    txid varchar NULL,
    response jsonb NULL
);

CREATE INDEX idx_updatelog_channel ON updatelog USING btree (channel);

CREATE TABLE versions (
    version_id SERIAL PRIMARY KEY,
    version text NOT NULL
);

CREATE UNIQUE INDEX idx_uk_versions_version ON versions USING btree (version);
 
CREATE TABLE txfilter (
    id SERIAL PRIMARY KEY,
    name varchar NOT NULL,
    payload varchar NOT NULL,
    enabled boolean NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
);

CREATE INDEX idx_txfilter_id ON txfilter USING btree (id);
CREATE INDEX idx_txfilter_enabled ON txfilter USING btree (enabled);
CREATE UNIQUE INDEX idx_txfilter_name ON txfilter USING btree (name);

CREATE TABLE outpointmonitor (
    txid varchar NOT NULL,
    index integer NOT NULL,
    spend_height integer NULL,
    spend_blockhash varchar NULL,
    spend_txid varchar NULL,
    spend_index varchar NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_outpointmonitor_txid_index ON outpointmonitor USING btree (txid, index);
CREATE INDEX idx_outpointmonitor_spend_height_index ON outpointmonitor USING btree (spend_height);

INSERT INTO versions(version) VALUES ('202012080000');

ALTER TABLE txfilter ADD COLUMN groupname varchar NULL;
CREATE INDEX idx_txfilter_groupname ON txfilter USING btree (groupname);

-- Insert versions bootstrap
INSERT INTO versions(version) VALUES ('202101260000');


 
  