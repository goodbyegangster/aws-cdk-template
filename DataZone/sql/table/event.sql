-- cSpell:disable

create table if not exists demo.event (
    eventid integer not null distkey,
    venueid smallint not null,
    catid smallint not null,
    dateid smallint not null sortkey,
    eventname varchar(200),
    starttime timestamp,
    primary key (eventid),
    foreign key (venueid) references demo.venue (venueid),
    foreign key (catid) references demo.category (catid),
    foreign key (dateid) references demo.date (dateid)
)
encode auto
;

comment on table demo.event is 'イベント';
comment on column demo.event.eventid is 'イベントid';
comment on column demo.event.venueid is '会場id';
comment on column demo.event.catid is 'カテゴリーid';
comment on column demo.event.dateid is 'カレンダーid';
comment on column demo.event.eventname is 'イベントの名前';
comment on column demo.event.starttime is 'イベントの日付と開始時刻';
