-- cSpell:disable

create table if not exists demo.venue (
    venueid smallint not null distkey sortkey,
    venuename varchar(100),
    venuecity varchar(30),
    venuestate char(2),
    venueseats integer,
    primary key (venueid)
)
encode auto
;

comment on table demo.venue is '会場';
comment on column demo.venue.venueid is '会場id';
comment on column demo.venue.venuename is '施設の正式名称';
comment on column demo.venue.venuecity is '市町村名';
comment on column demo.venue.venuestate is '州または地域の 2 文字の略称 (米国およびカナダ)';
comment on column demo.venue.venueseats is '施設で利用できる座席の最大数 (ただし、確認済みの場合)';
