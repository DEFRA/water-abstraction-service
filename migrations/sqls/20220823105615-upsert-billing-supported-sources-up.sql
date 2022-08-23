INSERT INTO water.billing_supported_sources(reference, name, "order", region)
SELECT * FROM (
  VALUES
    ('SS.1.3','Earl Soham - Deben',1,'Anglian'),
    ('SS.1.4','Glen Groundwater',2,'Anglian'),
    ('SS.1.5','Great East Anglian Groundwater',3,'Anglian'),
    ('SS.1.6','Great East Anglian Surface Water',4,'Anglian'),
    ('SS.1.8','Lodes Granta Groundwater',5,'Anglian'),
    ('SS.1.11','Nene - Northampton',6,'Anglian'),
    ('SS.1.12','Nene - Water Newton',7,'Anglian'),
    ('SS.1.13','Ouse - Eaton Socon',8,'Anglian'),
    ('SS.1.14','Ouse - Hermitage',9,'Anglian'),
    ('SS.1.15','Ouse - Offord',10,'Anglian'),
    ('SS.1.16','Rhee Groundwater',11,'Anglian'),
    ('SS.1.19','Thet and Little Ouse Surface Water',12,'Anglian'),
    ('SS.1.20','Waveney Groundwater',13,'Anglian'),
    ('SS.1.21','Waveney Surface Water',14,'Anglian'),
    ('SS.1.22','Welland - Tinwell Sluices',15,'Anglian'),
    ('SS.1.23','Witham and Ancholme',16,'Anglian'),
    ('SS.1.17','Severn',1,'Midlands'),
    ('SS.1.7','Kielder',1,'North East'),
    ('SS.1.9','Lower Yorkshire Derwent',2,'North East'),
    ('SS.1.1','Candover',1,'Southern'),
    ('SS.1.10','Medway - Allington',2,'Southern'),
    ('SS.1.18','Thames',1,'Thames'),
    ('SS.1.2','Dee',1,'Wales'),
    ('SS.1.24','Wye',2,'Wales')
) AS supported_sources(reference, name, "order", region)
ON CONFLICT(reference)
DO UPDATE
  SET
    name = excluded.name,
    "order" = excluded."order",
    region = excluded.region
