-- cSpell:disable

create table if not exists demo.category (
    catid smallint not null distkey sortkey,
    catgroup varchar(10),
    catname varchar(10),
    catdesc varchar(50),
    primary key (catid)
)
encode auto
;

comment on table demo.category is 'カテゴリー';
comment on column demo.category.catid is 'カテゴリーid';
comment on column demo.category.catgroup is 'イベントのグループの記述名';
comment on column demo.category.catname is 'グループ内のイベントのタイプの短い記述名';
comment on column demo.category.catdesc is 'イベントのタイプの長い記述名';
