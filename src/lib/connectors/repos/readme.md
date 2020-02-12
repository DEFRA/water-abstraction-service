This directory contains repositories for DB access that are written in a
a newer style:
- Bookshelf.js is used rather than the Repository class from hapi-pg-rest-api
- Data is camel-cased automatically

Finding a single record:
- findOne(id) - find a single record by ID
- findOneBySomeParam() - find a single record by some other query, e.g. findOneByName('Bob')

Note: these methods throw an error if the item is not found (default Bookshelf behaviour)
normally the expectation would be for findOneBy... that the field is unique.

Finding multiple records:
- find() - find all records
- findBySomeParam() - find all records by some other query, e.g. findByArea('Anglian')
- findPage() - find a page of results
- findPageBySomeParam()

Note: these methods return an empty result set if nothing found (default Bookshelf behaviour)

Other operations:
- create(data)
- update(id, data)
- upsert(data)
- delete(id)