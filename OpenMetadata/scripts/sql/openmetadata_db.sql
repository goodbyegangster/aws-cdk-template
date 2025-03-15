CREATE DATABASE IF NOT EXISTS openmetadata_db;
CREATE USER IF NOT EXISTS 'openmetadata_user'@'%' IDENTIFIED BY 'Passw0rd';
GRANT ALL PRIVILEGES ON openmetadata_db.* TO 'openmetadata_user'@'%' WITH GRANT OPTION;
commit;
