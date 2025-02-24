-- cSpell:disable

copy demo.users from 's3://datazone-source-ACCOUNT/tickitdb/allusers_pipe.txt'
delimiter '|'
timeformat 'YYYY-MM-DD HH:MI:SS'
ignoreheader 1
iam_role :'role'
;

copy demo.venue from 's3://datazone-source-ACCOUNT/tickitdb/venue_pipe.txt'
delimiter '|'
timeformat 'YYYY-MM-DD HH:MI:SS'
ignoreheader 1
iam_role :'role'
;

copy demo.category from 's3://datazone-source-ACCOUNT/tickitdb/category_pipe.txt'
delimiter '|'
timeformat 'YYYY-MM-DD HH:MI:SS'
ignoreheader 1
iam_role :'role'
;

copy demo.date from 's3://datazone-source-ACCOUNT/tickitdb/date2008_pipe.txt'
delimiter '|'
timeformat 'YYYY-MM-DD HH:MI:SS'
ignoreheader 1
iam_role :'role'
;

copy demo.event from 's3://datazone-source-ACCOUNT/tickitdb/allevents_pipe.txt'
delimiter '|'
timeformat 'YYYY-MM-DD HH:MI:SS'
ignoreheader 1
iam_role :'role'
;

copy demo.listing from 's3://datazone-source-ACCOUNT/tickitdb/listings_pipe.txt'
delimiter '|'
timeformat 'YYYY-MM-DD HH:MI:SS'
ignoreheader 1
iam_role :'role'
;

copy demo.sales from 's3://datazone-source-ACCOUNT/tickitdb/sales_tab.txt'
delimiter '\t'
timeformat 'MM/DD/YYYY HH:MI:SS'
ignoreheader 1
iam_role :'role'
;
