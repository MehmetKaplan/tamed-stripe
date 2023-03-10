\connect tamedstripedb;

--   ____ _                 _                  _                   
--  / ___| | ___  __ _ _ __(_)_ __   __ _     / \   _ __ ___  __ _ 
-- | |   | |/ _ \/ _` | '__| | '_ \ / _` |   / _ \ | '__/ _ \/ _` |
-- | |___| |  __/ (_| | |  | | | | | (_| |  / ___ \| | |  __/ (_| |
--  \____|_|\___|\__,_|_|  |_|_| |_|\__, | /_/   \_\_|  \___|\__,_|
--                                  |___/

-- TABLES 

revoke all on tamedstripe.subscriptions
from
	tamedstripeapp;

drop table tamedstripe.subscriptions;

revoke all on tamedstripe.connected_accounts
from
	tamedstripeapp;

drop table tamedstripe.connected_accounts;

revoke all on tamedstripe.customers
from
	tamedstripeapp;

drop table tamedstripe.customers;

revoke all on tamedstripe.products
from
	tamedstripeapp;

drop table tamedstripe.products;


-- SCHEMA

drop schema if exists tamedstripe;

revoke connect on database "tamedstripedb"
from
	tamedstripeapp;

drop user if exists tamedstripeapp;