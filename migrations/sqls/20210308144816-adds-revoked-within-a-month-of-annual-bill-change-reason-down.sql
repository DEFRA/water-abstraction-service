delete from water.change_reasons 
where description='Licence revoked within a month of annual billing';

alter table water.change_reasons
  add column position int;

update water.change_reasons
set position=0
where description='Major change';

update water.change_reasons
set position=1
where description='Minor change';

update water.change_reasons
set position=2
where description='Succession or transfer of licence';

update water.change_reasons
set position=3
where description='Succession to a remainder licence or licence apportionment';

update water.change_reasons
set position=4
where description='New special agreement';

update water.change_reasons
set position=5
where description='Change to a special agreement';

update water.change_reasons
set position=6
where description='New licence in part succession or licence apportionment';

update water.change_reasons
set position=7
where description='New licence';

update water.change_reasons
set position=8
where description='Licence holder name or address change';

update water.change_reasons
set position=9
where description='Licence transferred and now chargeable';

update water.change_reasons
set position=10
where description='Billing contact change';

update water.change_reasons
set position=11
where description='Limited extension of licence validity (LEV)';

update water.change_reasons
set position=12
where description='Charge information cancelled before licence expiry date';

update water.change_reasons
set position=100
where description in ('Chloride content more than 8000 milligrams per litre', 'Held by Environment Agency', 'Power generation less than 5 megawatts (S125)');

update water.change_reasons
set position=101
where description='Aggregate licence';

update water.change_reasons
set position=102
where description='Abatement (S126)';

update water.change_reasons
set position=103
where description='Temporary trade';

update water.change_reasons
set position=104
where description='Temporary type licence';

update water.change_reasons
set position=105
where description='Transfer type licence';

update water.change_reasons
set position=106
where description='Shell licence ';

update water.change_reasons
set position=1000
where description='NALD gap';