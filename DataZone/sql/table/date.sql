-- cSpell:disable

create table if not exists demo.date (
    dateid smallint not null distkey sortkey,
    caldate date not null,
    day character(3) not null,
    week smallint not null,
    month character(5) not null,
    qtr character(5) not null,
    year smallint not null,
    holiday boolean default('N'),
    primary key (dateid)
)
encode auto
;

comment on table demo.date is 'カレンダー';
comment on column demo.date.dateid is 'カレンダーid';
comment on column demo.date.caldate is 'カレンダー日付';
comment on column demo.date.day is '曜日 (短縮形)';
comment on column demo.date.week is '週番号';
comment on column demo.date.month is '月名 (短縮形)';
comment on column demo.date.qtr is '四半期番号 (1～4)';
comment on column demo.date.year is '4 桁の年';
comment on column demo.date.holiday is 'その日が祝日 (米国) であるかどうかを示すフラグ';
