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

ALTER TABLE txfilter ADD COLUMN groupname varchar NULL;

CREATE INDEX idx_txfilter_groupname ON txfilter USING btree (groupname);
 
-- Insert versions bootstrap
INSERT INTO versions(version) VALUES ('202101260000');

