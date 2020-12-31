
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

CREATE TABLE project
(
    id varchar PRIMARY KEY,
    project_id varchar NOT NULL,
    name varchar NOT NULL,
    api_key varchar NOT NULL,
    account_id varchar NOT NULL,
    created_at integer NOT NULL,
    service_key varchar NULL,
    service_txq_db jsonb NULL,
    service_txq_config jsonb NULL
);

CREATE UNIQUE INDEX idx_project_api_key ON public.project USING btree (api_key);
CREATE UNIQUE INDEX idx_project_service_key ON public.project USING btree (service_key);
CREATE UNIQUE INDEX idx_project_name ON public.project USING btree (name);
CREATE UNIQUE INDEX idx_project_project_id ON public.project USING btree (project_id);

CREATE TABLE versions (
    version_id SERIAL PRIMARY KEY,
    version text NOT NULL
);
 
INSERT INTO versions(version) VALUES ('202012080000');
