-- cSpell:disable

create table if not exists demo.listing (
    listid integer not null distkey,
    sellerid integer not null,
    eventid integer not null,
    dateid smallint not null sortkey,
    numtickets smallint not null,
    priceperticket decimal(8,2),
    totalprice decimal(8,2),
    listtime timestamp,
    primary key (listid),
    foreign key (sellerid) references demo.users (userid),
    foreign key (eventid) references demo.event (eventid),
    foreign key (dateid) references demo.date (dateid)
)
encode auto
;

comment on table demo.listing is 'リスト';
comment on column demo.listing.listid is 'リストid';
comment on column demo.listing.sellerid is 'チケットを販売したユーザー';
comment on column demo.listing.eventid is 'イベントid';
comment on column demo.listing.dateid is 'カレンダーid';
comment on column demo.listing.numtickets is '販売可能なチケット数';
comment on column demo.listing.priceperticket is '各チケットの定価';
comment on column demo.listing.totalprice is 'このリストの定価総額 (NUMTICKETS*PRICEPERTICKET)';
comment on column demo.listing.listtime is 'リストが投稿された日時';
