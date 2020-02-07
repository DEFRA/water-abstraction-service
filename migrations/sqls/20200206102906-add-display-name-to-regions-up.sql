alter table water.regions
  add column display_name text;

update water.regions
set display_name = (
  case name
    when 'EA Wales' then 'Wales'
    else name
  end
);

alter table water.regions
  alter column display_name set not null;
