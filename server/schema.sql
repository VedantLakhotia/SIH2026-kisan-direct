CREATE TABLE users(
  id Serial primary key,
  name varchar(100) not null,
  role varchar(20) check (role in ('Farmer','Consumer','CLead','Admin')),
  phone varchar(15),
  society_id Integer
);
CREATE Table listings(
  id serial primary key,
  farmer_id integer references users(id),
  crop_name varchar(50) not null,
  quantity_kg numeric(10,2) not null,
  price_per_kg numeric(10,2) not null,
  grade char(1) check (grade in('A','B','C')));

CREATE Table society_pools(
  id serial primary key,
  society_id integer not null,
  crop_name varchar(50) not null,
  target_kg numeric (10,2) not null,
  current_kg numeric(10,2) default 0,
  status varchar(20) default 'Open' check (status in ('Open','Locked','Fulfilled'))
);
CREATE Table orders(
  id serial primary key,
  consumer_id integer references users(id),
  pool_id integer references society_pools(id),
  quantity_ordered NUMERIC(10,2) NOT NULL,
  delivery_type VARCHAR(20) check(delivery_type in ('Hub Pickup','Doorstep')),status Varchar(20) default 'Pending' 
);