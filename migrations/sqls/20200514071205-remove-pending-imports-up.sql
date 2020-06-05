do $$
  begin
    if exists
      (
        select 1
        from   information_schema.tables
        where  table_schema = 'water'
        and    table_name = 'job'
      )
    then
        delete from water.job
        where name in('import.licence', '__state__completed__import.licence');
    end if ;
  end
$$ ;

drop table water.pending_import;
