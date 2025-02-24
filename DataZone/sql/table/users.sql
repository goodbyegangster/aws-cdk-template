-- cSpell:disable

create table if not exists demo.users (
    userid integer not null distkey sortkey,
    username char(8),
    firstname varchar(30),
    lastname varchar(30),
    city varchar(30),
    state char(2),
    email varchar(100),
    phone char(14),
    likesports boolean,
    liketheatre boolean,
    likeconcerts boolean,
    likejazz boolean,
    likeclassical boolean,
    likeopera boolean,
    likerock boolean,
    likevegas boolean,
    likebroadway boolean,
    likemusicals boolean,
    primary key (userid)
)
encode auto
;

comment on table demo.users is 'ユーザー';
comment on column demo.users.userid is 'ユーザーid';
comment on column demo.users.username is '英数字 8 文字のユーザー名';
comment on column demo.users.firstname is 'ユーザーの名';
comment on column demo.users.lastname is 'ユーザーの姓';
comment on column demo.users.city is 'ユーザーの自宅住所の市町村';
comment on column demo.users.state is 'ユーザーの自宅住所の州';
comment on column demo.users.email is 'ユーザーの E メールアドレス';
comment on column demo.users.phone is 'ユーザーの 14 文字の電話番号';
comment on column demo.users.likesports is 'ユーザーの好き嫌い (スポーツ)';
comment on column demo.users.liketheatre is 'ユーザーの好き嫌い (舞台)';
comment on column demo.users.likeconcerts is 'ユーザーの好き嫌い (コンサート)';
comment on column demo.users.likejazz is 'ユーザーの好き嫌い (ジャズ)';
comment on column demo.users.likeclassical is 'ユーザーの好き嫌い (クラシック)';
comment on column demo.users.likeopera is 'ユーザーの好き嫌い (オペラ)';
comment on column demo.users.likerock is 'ユーザーの好き嫌い (ロック)';
comment on column demo.users.likevegas is 'ユーザーの好き嫌い (ラスベガス)';
comment on column demo.users.likebroadway is 'ユーザーの好き嫌い (ブロードウェイ)';
comment on column demo.users.likemusicals is 'ユーザーの好き嫌い (ミュージカル)';
