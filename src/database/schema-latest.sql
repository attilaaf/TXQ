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
    txid varchar NOT NULL,
    rawtx text NULL,
    h varchar NULL,
    i integer NULL,
    send jsonb NULL,
    status jsonb NULL,
    completed boolean NOT NULL,
    updated_at integer NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_tx_txid ON tx USING btree (txid);

CREATE TABLE txsync (
    txid varchar NOT NULL,
    sync integer NOT NULL,
    status_retries integer NULL,
    dlq varchar NULL,
    updated_at integer NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_txsync_txid ON txsync USING btree (txid);
CREATE INDEX idx_txsync_sync ON txsync USING btree (sync);
CREATE INDEX idx_txsync_dlq ON txsync USING btree (dlq);

CREATE TABLE txin (
    txid varchar NOT NULL,
    index integer NOT NULL,
    prevtxid varchar NOT NULL,
    previndex integer NOT NULL,
    unlockscript text NOT NULL
);

CREATE UNIQUE INDEX idx_uk_txin_txid_index ON txin USING btree (txid, index);
CREATE UNIQUE INDEX idx_uk_txin_prevtxid_previndex ON txin USING btree (prevtxid, previndex);

CREATE TABLE txout (
    txid varchar NOT NULL,
    index integer NOT NULL,
    script text NOT NULL,
    address varchar NULL,
    scripthash varchar NOT NULL,
    satoshis bigint NOT NULL,
    is_receive boolean NOT NULL DEFAULT true,
    spend_txid varchar NULL,
    spend_index integer NULL
);

-- Do not need index on txid because we always query with (txid, channel)
CREATE UNIQUE INDEX idx_uk_txout_txid_index ON txout USING btree (txid, index);
CREATE INDEX idx_txout_address_index ON txout USING btree (address);
CREATE INDEX idx_txout_scripthash_index ON txout USING btree (scripthash);

CREATE TABLE txmeta (
    id SERIAL PRIMARY KEY,
    txid varchar NOT NULL,
    channel varchar NOT NULL,
    metadata jsonb NULL,
    tags jsonb NULL,
    extracted jsonb NULL,
    updated_at integer NOT NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_txmeta_txid_channel ON txmeta USING btree (txid, channel);

CREATE TABLE merchantapilog (
    id SERIAL PRIMARY KEY,
    event_type varchar NULL,
    txid varchar NULL,
    response jsonb NULL
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

INSERT INTO versions(version) VALUES ('202006210000');

ALTER TABLE merchantapilog ADD COLUMN miner varchar NULL;

INSERT INTO versions(version) VALUES ('202006260000');

CREATE TABLE txoutgroup (
    groupname varchar NOT NULL,
    scriptid varchar NOT NULL,
    created_at integer NOT NULL,
    metadata jsonb NULL
);

CREATE INDEX idx_txoutgroup_groupname ON txoutgroup USING btree (groupname);
CREATE INDEX idx_txoutgroup_scriptid ON txoutgroup USING btree (scriptid);
CREATE UNIQUE INDEX idx_uk_txoutgroup_groupname_scriptid ON txoutgroup USING btree (groupname, scriptid);

INSERT INTO versions(version) VALUES ('202009010000');

CREATE TABLE txstore (
    id varchar NOT NULL,
    category varchar NOT NULL,
    revision integer NOT NULL,
    data jsonb NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX idx_uk_txstore_id ON txstore USING btree (id, category, revision);

INSERT INTO versions(version) VALUES ('202011110000');

