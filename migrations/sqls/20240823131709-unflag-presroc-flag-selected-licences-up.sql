/*
 * Remove presroc supp. billing flag migration
 *
 * https://eaflood.atlassian.net/browse/WATER-4644
 *
 * A long-standing issue with the old scheme and the legacy code has resulted in large numbers of licences being flagged
 * for presroc supplementary billing. By design, there is no front-end way to remove billing flags to maintain an audit
 * trail of licences that should be billed.
 *
 * B&D has completed work identifying licences that have a billing flag but are billed to date. They've asked if we can
 * remove the billing flag because there is no other way to do so.
 *
 * We've done this before (see <https://github.com/DEFRA/water-abstraction-service/pull/2300> and WATER-4160), and we
 * thought then this would be the last time we'd have to do this. We were wrong!
 *
 * We suspect something is going on, either with pre-sroc billing not removing the flags or with the import still
 * flagging stuff it shouldn't. Either way, the sooner the legacy code is dead, the better!
 *
 * Till then, here is another migration. 😩
*/
BEGIN TRANSACTION;
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/054/0008/030';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0075/013/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/04/1043';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0071/003/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/64/0200/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/03/0132';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/04/0017';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/64/0243/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/11/0145';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/64/0198/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/76/0007';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/70/0088/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0084/013';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/75/0102';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0064/032/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/74/0061/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/05/0039';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/05/0156';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/09/0015';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0062/002';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/64/0214/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/02/0140';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/054/0005/010';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/83/0088';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/83/0188';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/34/0052';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/08/0165';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/17/0657';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/04/1051';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/70/0063/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/64/0318/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/054/0002/044/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/55/0097';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/64/0303/1/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/02/0668/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/04/1456';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/02/0565';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/84/0031/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0075/011/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/36/0124';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/15/0231';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0064/035/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/53/0048';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/81/0028';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/55/0094';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/04/0882';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/64/0196/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/69/0246';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/64/0199/2/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/054/0017/015';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/08/0379';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/84/0030/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/77/0008';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0075/016/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/04/1082';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/66/0037';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/84/0022/1/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/14/0194';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/08/0553/S/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/54/17/0656';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2/26/34/016';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2/26/34/016';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'NE/027/0023/041';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2/27/06/043';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '16/52/003/S/188';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '14/45/002/2266';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '13/43/034/S/026';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '13/44/058/S/102';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/69/0246';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/054/0002/021/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0075/011/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'MD/028/0083/006/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '4/30/05/*S/0002';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/35/03/*G/0060';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/09/*G/0056';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/44/*S/0065';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0052/013';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/45/*G/0073/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/034/0016/003';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '5/32/11/*S/0077';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/35/*S/0107';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/25/*G/0289';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '4/30/12/*S/0184';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0045/001';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0044/014';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/26/*S/0370';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '4/30/13/*G/0351/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0026/056';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0050/004';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/48/*S/0234';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/19/*G/0117';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/58/*G/0266/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/034/0006/018';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/39/*S/0302/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '5/32/11/*S/0065';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/034/0001/003/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/36/*S/0020';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/25/*G/0275';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/06/*G/0190';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/58/*S/0051';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '4/29/10/*S/0106';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/14/*S/0072/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0053/149';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/56/*S/0258';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/39/*S/0005';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/36/15/*S/0178';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/39/*S/0030';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/34/*S/0049';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0053/117';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/20/*S/0123';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/030/0013/058';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '4/30/09/*S/0117';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '4/29/08/*S/0017';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/19/*S/0079A';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/19/*S/0443/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/44/*G/0324/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/15/*S/0123';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/52/*G/0011';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/35/02/*G/0138';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/41/*S/0180';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/37/*S/0100';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/36/18/*G/0042';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/030/0013/087';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/030/0013/031';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/31/*S/0221';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/35/04/*G/0073';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/45/*G/0075/R02';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/53/*S/0664';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0039/015';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '5/32/11/*S/0132';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0026/055';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/47/*S/0177';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '5/31/14/*S/0109';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/35/10/*S/0059';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/36/*S/0264';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/31/*S/0212A/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/64/*S/0070/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0044/031';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/41/*S/0178';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/24/*G/0051';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/06/*G/0245';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/36/19/*S/0034';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/53/*S/0661';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/47/*S/0226/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/37/*S/0032';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0050/002';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/53/*S/0655';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/19/*S/0270';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/12/*S/0013';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/12/*G/0120';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/36/*S/0221/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '6/33/53/*S/0654/L';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/13/*G/0280B/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/15/*S/0225/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '7/34/18/*G/0041';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/37/33/*S/0018';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/032/0005/014';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0035/016';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'AN/033/0053/145';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2/27/20/092';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'TH/039/0039/048';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2671303009';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'NW/076/0012/005/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'NW/076/0012/006/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'SO/040/0001/019';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/03/0599/S';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '11/42/25.3/27A';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/06/0134/SR';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '10/41/434201';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/03/0611/G';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/02/0230/G';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '11/42/10.3/6';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/04/0514/CA';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/03/0183/SR';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '09/173/CA';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/04/0223/SR';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/04/0498/CA';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '09/204';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '10/41/436003';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '12/101/6/S/11';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '08/120';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/03/0333/GR';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '18/040';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '35/063';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/03/0606/CA';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '10/41/541201';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '9/40/03/0003/SR';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'NE/023/0001/010';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '14/45/000/0402';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '16/52/001/G/077';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'NE/023/0001/010/1';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'WA/055/0017/013';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'WA/055/0017/014';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'WA/055/0017/015';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'WA/055/0017/016';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'NE/023/0003/033/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '16/52/007/S/013';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '13/44/057/S/011';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '13/44/058/S/102';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '15/47/141/S/031';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'WA/055/0014/006';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '13/44/058/S/102';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '28/39/41/0023';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2670102019';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2670102020';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2670102021';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2670102001';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '8/39/22/0467';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '28/39/22/0467';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '28/39/22/0467';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '28/39/19/0228/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '28/39/19/0228/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '28/39/19/0228/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = 'TH/039/0042/064';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2569025055';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2/27/28/291/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2/27/21/074';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2/27/20/043';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '2/27/06/090/R01';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '16/51/009/S/095';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '03/28/40/0076';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '28/39/14/0227';
UPDATE water.licences SET "include_in_supplementary_billing" = 'no' WHERE licence_ref = '28/39/30/0362';
COMMIT;
