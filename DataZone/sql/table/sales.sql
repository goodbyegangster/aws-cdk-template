-- cSpell:disable

create table if not exists demo.sales (
    salesid integer not null,
    listid integer not null distkey,
    sellerid integer not null,
    buyerid integer not null,
    eventid integer not null,
    dateid smallint not null sortkey,
    qtysold smallint not null,
    pricepaid decimal(8,2),
    commission decimal(8,2),
    saletime timestamp,
    primary key (salesid),
    foreign key (listid) references demo.listing (listid),
    foreign key (sellerid) references demo.users (userid),
    foreign key (buyerid) references demo.users (userid),
    foreign key (eventid) references demo.event (eventid),
    foreign key (dateid) references demo.date (dateid)
)
encode auto
;

comment on table demo.sales is '販売';
comment on column demo.sales.salesid is '販売id';
comment on column demo.sales.listid is 'リストid';
comment on column demo.sales.sellerid is 'チケットを販売したユーザー';
comment on column demo.sales.buyerid is 'チケットを購入したユーザー';
comment on column demo.sales.eventid is 'イベントid';
comment on column demo.sales.dateid is 'カレンダーid';
comment on column demo.sales.qtysold is '販売されたチケット数 (1～8)(1 回の取引で最大 8 枚のチケットを販売可能)';
comment on column demo.sales.pricepaid is 'チケットの合計支払額 (PRICEPAID/QTYSOLD)';
comment on column demo.sales.commission is 'そのビジネスで販売価格から徴収される 15% のコミッション (販売者は PRICEPAID 値の 85% を受け取る)';
comment on column demo.sales.saletime is '販売が完了した日時';
