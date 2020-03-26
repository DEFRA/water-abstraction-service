# Upload process

## returns-upload
gets the data from the S3 bucket and validates
it conforms to basic CSV template or valid XSLT

## returns-upload-to-json
maps the CSV/XML data to a standard JSON format
and stores back in S3 as event-id-guid.json

## validate-returns
the json data in S3 is validated
validation results placed in event metadata.validationResults

## persist-returns
each return in the JSON without any validation errors is
submitted to the returns service