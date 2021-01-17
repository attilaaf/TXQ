
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
 

CREATE TABLE versions (
    version_id SERIAL PRIMARY KEY,
    version text NOT NULL
);

CREATE UNIQUE INDEX idx_uk_versions_version ON versions USING btree (version);
 

INSERT INTO versions(version) VALUES ('mempool202101070000');

