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
	phone varchar(255),
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

create table tamedstripe.connected_accounts (
	id integer generated by default as identity primary key,
	application_customer_id varchar(255),
	stripe_account_id varchar(255) not null,
	state varchar(1), -- 'W'aiting for account url action, 'A'ctive
	update_time timestamp not null,
	capabilities jsonb not null,
	email varchar(255) not null,
	payment_schedule jsonb not null,
	account_object jsonb not null
);
grant all on tamedstripe.connected_accounts to tamedstripeapp;
create index connected_accounts_idx1 on tamedstripe.connected_accounts(stripe_account_id);
create index connected_accounts_idx2 on tamedstripe.connected_accounts(email);
create unique index connected_accounts_idx3 on tamedstripe.connected_accounts(application_customer_id) where application_customer_id is not null;
alter table
	tamedstripe.connected_accounts
add
	constraint connected_accounts_check1 unique (stripe_account_id);
alter table
	tamedstripe.connected_accounts
add
	constraint connected_accounts_check2 check (state in ('W', 'A'));

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
	state varchar(1) not null, -- 'A'ctive, 'C'ancelled
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
alter table
	tamedstripe.subscriptions
add
	constraint subscriptions_check1 check (state in ('A', 'C'));

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

create table tamedstripe.one_time_payments (
	id integer generated by default as identity primary key,
	application_customer_id varchar(255) not null,
	stripe_customer_id varchar(255) not null,
	checkout_session_id varchar(255) not null,
	update_time timestamp not null,
	total_amount_decimal numeric(12) not null, -- in cents, should be same as in subscription
	currency varchar(3) not null,
	state varchar(1) not null, -- 'W': waiting for url action, 'P': paid, 'F': Failed, 'R': Refunded
	invoice_id varchar(255),
	hosted_invoice_url varchar(255),
	payout_amount numeric(12), 
	payout_account_id varchar(255),
	payout_state varchar(1), -- 'W'aiting for payout action, 'P'aid, 'F'ailed
	items jsonb not null,
	one_time_payment_object jsonb not null
);
grant all on tamedstripe.one_time_payments to tamedstripeapp;
create index one_time_payments_idx1 on tamedstripe.one_time_payments(application_customer_id);
create index one_time_payments_idx2 on tamedstripe.one_time_payments(invoice_id) where invoice_id is not null;
create index one_time_payments_idx3 on tamedstripe.one_time_payments(payout_account_id) where payout_account_id is not null;
create unique index one_time_payments_idx4 on tamedstripe.one_time_payments(checkout_session_id);
alter table
	tamedstripe.one_time_payments
add
	constraint one_time_payments_check1 check (state in ('W', 'P', 'F', 'R'));
alter table
	tamedstripe.one_time_payments
add
	constraint one_time_payments_check2 check (payout_state in ('W', 'P', 'F') or payout_state is null);
alter table
	tamedstripe.one_time_payments
add
	constraint fk1_one_time_payments_accounts foreign key (stripe_customer_id) references tamedstripe.customers(stripe_customer_id);
alter table
	tamedstripe.one_time_payments
add
	constraint fk2_one_time_payments_accounts foreign key (payout_account_id) references tamedstripe.connected_accounts(stripe_account_id);


create table tamedstripe.one_time_payment_refunds (
	id integer generated by default as identity primary key,
	checkout_session_id varchar(255) not null,
	refund_id varchar(255) not null
);
grant all on tamedstripe.one_time_payment_refunds to tamedstripeapp;
create unique index one_time_payment_refunds_idx1 on tamedstripe.one_time_payment_refunds(checkout_session_id);
alter table
	tamedstripe.one_time_payment_refunds
add
	constraint fk1_one_time_payment_refunds foreign key (checkout_session_id) references tamedstripe.one_time_payments(checkout_session_id);
