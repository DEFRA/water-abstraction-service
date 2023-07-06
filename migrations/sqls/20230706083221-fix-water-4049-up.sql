-- Fix error when viewing 6/33/48/*G/0033

/*
  https://eaflood.atlassian.net/browse/WATER-4049

  You can search for and find the licence without issue. But if you then attempt to view the licence you get an
  error page. We did some digging and this is our current understanding.

  A licence will be linked to returns.returns. In this case there are 29 of them. In each one we have another of those
  frustrating JSONB fields (metadata) that holds a bunch more data. Specifically a regionCode and formatId.

  What the code in water-abstraction-returns src/lib/services/returns/returns-mapping-service.js is doing is iterating
  through the 29 returns and coming up with a distinct list of 'externalIds' using those values.

  The returns-mapping-service.js takes those external ID's and uses them to find the matching water.return_requirements
  records. And that is where we get our problem. For this licence only 2 out of the 3 find a match. There isn't a return
  requirement with the external ID 1:10053879. The code is written that this is not possible. Hence it's running logic
  assuming a match has been found and erroring.

  Our best guess is that something failed during the import of this return. In testing we have found simply deleting
  the problem returns.returns record resolves the issue.
*/
DELETE FROM returns.returns WHERE returns.return_id = 'v1:1:6/33/48/*G/0033:10053879:2018-04-01:2019-03-31'
