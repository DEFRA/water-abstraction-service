alter table water.purposes_uses
  add column loss_factor water.charge_element_loss;

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '10';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '20';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '30';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '40';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '50';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '60';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '70';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '80';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '90';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '100';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '110';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '120';

update water.purposes_uses
set loss_factor = 'low'
where legacy_id = '130';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '140';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '150';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '160';

update water.purposes_uses
set loss_factor = 'low'
where legacy_id = '170';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '180';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '190';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '200';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '210';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '220';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '230';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '240';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '250';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '260';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '270';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '280';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '290';

update water.purposes_uses
set loss_factor = 'low'
where legacy_id = '300';

update water.purposes_uses
set loss_factor = 'low'
where legacy_id = '310';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '320';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '330';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '340';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '350';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '360';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '370';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '380';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '390';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '400';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '410';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '420';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '430';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '440';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '450';

update water.purposes_uses
set loss_factor = 'low'
where legacy_id = '460';

update water.purposes_uses
set loss_factor = 'medium'
where legacy_id = '470';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '480';

update water.purposes_uses
set loss_factor = 'non-chargeable'
where legacy_id = '490';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '600';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '610';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '620';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '630';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '640';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '650';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '660';

update water.purposes_uses
set loss_factor = 'high'
where legacy_id = '670';

update water.purposes_uses
set loss_factor = 'very low'
where legacy_id = '645';

alter table water.purposes_uses
  alter column loss_factor set not null;
