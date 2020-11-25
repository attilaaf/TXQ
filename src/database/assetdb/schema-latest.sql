
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

CREATE TABLE block_header (
    block_header_pre_id SERIAL PRIMARY KEY,
    height int NOT NULL,
    hash varchar NULL
);

CREATE INDEX idx_key_block_header_height ON block_header USING btree (height);

CREATE TABLE block_header (
    height int NOT NULL,
    hash varchar NOT NULL,
    hashbytes bytea NULL,
    size int NULL,
    version int NULL,
    versionHex varchar NULL,
    merkleroot varchar NOT NULL,
    time int NOT NULL,
    nonce bigint NOT NULL,
    bits varchar NOT NULL,
    difficulty varchar NOT NULL,
    previousblockhash varchar NULL,
    nextblockhash varchar NULL,
    txcnt int NULL,
    coinbaseinfo bytea NULL,
    coinbasetxid varchar NULL,
    chainwork varchar NULL
);

CREATE INDEX idx_key_block_header_height ON block_header USING btree (height);
CREATE INDEX idx_key_block_header_hash ON block_header USING btree (hash);
CREATE INDEX idx_key_block_header_hashbytes ON block_header USING btree (hashbytes);

CREATE TABLE versions (
    version_id SERIAL PRIMARY KEY,
    version text NOT NULL
);

CREATE UNIQUE INDEX idx_uk_versions_version ON versions USING btree (version);

CREATE TABLE assettype (
    id BIGSERIAL,
    name varchar NOT NULL,
    coinbase_prefix bytea NOT NULL,
    output_prefix bytea NOT NULL
);

CREATE TABLE txasset (
    /*
     General tx info
    */
    id BIGSERIAL,
    assettypeid integer NULL,
    assetid bytea NULL,
    issuer bytea NULL,
    owner bytea NULL,
    address bytea NULL,
    size integer NULL,
    txid bytea NOT NULL,
    version int NULL,
    blockhash bytea NULL,
    height int NOT NULL,
    locktime bigint NULL,
    ins int NULL,
    outs int NULL,
    txindex int NULL,
    /*
      Inputs for tx at input index n
    */
    n int NOT NULL,
    prevtxid bytea NULL,
    prevn int NULL,
    seq bigint NULL,
    unlockscript TEXT NULL,
    /*
     Outputs for tx at output index n
    */
    satoshis bigint NULL,
    lockscript TEXT NULL,
    scripthash bytea NULL,
    metadata jsonb NULL
);
CREATE INDEX idx_key_txasset_assetid ON txasset USING btree (assetid);
CREATE INDEX idx_key_txasset_assettypeid ON txasset USING btree (assettypeid);
CREATE INDEX idx_key_txasset_issuer ON txasset USING btree (issuer);
CREATE INDEX idx_key_txasset_owner ON txasset USING btree (owner);
CREATE INDEX idx_key_txasset_address ON txasset USING btree (address);
CREATE INDEX idx_key_txasset_txid ON txasset USING btree (txid);
CREATE INDEX idx_key_txasset_blockhash ON txasset USING btree (blockhash);
CREATE INDEX idx_key_txasset_height ON txasset USING btree (height);
CREATE INDEX idx_key_txasset_prevtxid ON txasset USING btree (prevtxid);

INSERT INTO versions(version) VALUES ('202011210000');
