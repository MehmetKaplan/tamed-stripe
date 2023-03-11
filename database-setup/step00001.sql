\connect tamedstripedb;

--    ____                           _   _                  _                   
--   / ___| ___ _ __   ___ _ __ __ _| |_(_)_ __   __ _     / \   _ __ ___  __ _ 
--  | |  _ / _ \ '_ \ / _ \ '__/ _` | __| | '_ \ / _` |   / _ \ | '__/ _ \/ _` |
--  | |_| |  __/ | | |  __/ | | (_| | |_| | | | | (_| |  / ___ \| | |  __/ (_| |
--   \____|\___|_| |_|\___|_|  \__,_|\__|_|_| |_|\__, | /_/   \_\_|  \___|\__,_|
--                                               |___/                          

-- SCHEMA 

create user tamedstripeapp encrypted password 'tamedstripeapp.';

grant connect on database "tamedstripedb" to tamedstripeapp;

create schema tamedstripe authorization tamedstripeapp;

-- TABLES
create table tamedstripe.products (
	id integer generated by default as identity primary key,
	stripe_product_id varchar(255) not null,
	name varchar(255),
	description varchar(255),
	currency varchar(3) not null,
	unit_amount_decimal numeric(12) not null, -- in cents
	interval varchar(5) not null, -- day, week, month, year
	update_time timestamp not null,
	product_object jsonb not null,
	price_object jsonb not null
);
grant all on tamedstripe.products to tamedstripeapp;
create unique index products_idx1 on tamedstripe.products(stripe_product_id);


create table tamedstripe.customers (
	id integer generated by default as identity primary key,
	application_customer_id varchar(255),
	stripe_customer_id varchar(255) not null,
	state varchar(1), -- 'W'aiting for payment method, 'A'ctive, 'C'ancel, 'U'nlinked
	update_time timestamp not null,
	email varchar(255) not null,
	name varchar(255) not null,
	phone varchar(255) not null,
	address jsonb not null,
	metadata jsonb not null,
	checkout_session_id varchar(255), -- initial checkout to define payment method
	payment_method_id varchar(255), -- payment method id
	customer_object jsonb not null
);
grant all on tamedstripe.customers to tamedstripeapp;
create unique index customers_idx1 on tamedstripe.customers(stripe_customer_id);
create index customers_idx2 on tamedstripe.customers(email);
create unique index customers_idx3 on tamedstripe.customers(application_customer_id) where application_customer_id is not null;
create unique index customers_idx4 on tamedstripe.customers(checkout_session_id);
alter table
	tamedstripe.customers
add
	constraint customers_check1 check (state in ('W', 'A', 'C', 'U')); 


create table tamedstripe.subscriptions (
	id integer generated by default as identity primary key,
	stripe_subscription_id varchar(255) not null,
	stripe_customer_id varchar(255) not null,
	stripe_product_id varchar(255) not null,
	description varchar(255) not null,
	currency varchar(3) not null,
	unit_amount_decimal numeric(12) not null, -- in cents
	interval varchar(20) not null,
	update_time timestamp not null,
	subscription_object jsonb not null
);
grant all on tamedstripe.subscriptions to tamedstripeapp;
create unique index subscriptions_idx1 on tamedstripe.subscriptions(stripe_subscription_id);
alter table
	tamedstripe.subscriptions
add
	constraint fk_subscriptions_customers foreign key (stripe_customer_id) references tamedstripe.customers(stripe_customer_id);
alter table
	tamedstripe.subscriptions
add
	constraint fk_subscriptions_products foreign key (stripe_product_id) references tamedstripe.products(stripe_product_id);


create table tamedstripe.subscription_payments (
	id integer generated by default as identity primary key,
	stripe_subscription_id varchar(255) not null,
	invoice_id varchar(255) not null,
	hosted_invoice_url varchar(255) not null,
	insert_time timestamp not null,
	unit_amount_decimal numeric(12) not null, -- in cents, should be same as in subscription
	currency varchar(3) not null,
	state varchar(1) not null, -- 'P'aid, 'F'ailed
	subscription_covered_from timestamp not null,
	subscription_covered_to timestamp not null,
	subscription_payment_object jsonb not null
);
grant all on tamedstripe.subscription_payments to tamedstripeapp;
alter table
	tamedstripe.subscription_payments
add
	constraint fk_subscription_payments_subscriptions foreign key (stripe_subscription_id) references tamedstripe.subscriptions(stripe_subscription_id);


create table tamedstripe.connected_accounts (
	id integer generated by default as identity primary key,
	stripe_account_id varchar(255) not null,
	update_time timestamp not null,
	capabilities jsonb not null,
	email varchar(255) not null,
	payment_schedule jsonb not null,
	account_object jsonb not null
);
grant all on tamedstripe.connected_accounts to tamedstripeapp;
create index connected_accounts_idx1 on tamedstripe.connected_accounts(stripe_account_id);
create index connected_accounts_idx2 on tamedstripe.connected_accounts(email);
alter table
	tamedstripe.connected_accounts
add
	constraint connected_accounts_check1 unique (stripe_account_id);
