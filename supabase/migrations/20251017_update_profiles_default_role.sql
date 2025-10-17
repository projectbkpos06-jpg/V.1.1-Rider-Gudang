alter table profiles alter column role set default 'rider';
update profiles set role = 'rider' where role is null;