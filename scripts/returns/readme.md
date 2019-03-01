# Test Returns Helper

This script provides a means of quickly creating test returns that can be completed in the UI then deleted from the service.

It makes a copy of an existing return and resets the data to be in the 'due' state.

Each test return created has the `metadata.copiedForTesting` value set to true.

Start and end dates are hard coded to a known period.

## Usage

This script relies on `dotenv` having parsed the `.env` file so must be run from the root of the water service.

### Create

To create a new return, find the return id of a return then run:

`node scripts/returns create the-return-id`

### View all created test returns

To find all test returns that have been created run:

`node scripts/returns show` to get the return ids or `node scripts/returns show -v` to get the full return records.

### Delete a single return

`node scripts/returns delete the-return-id`

This will find any versions and lines for the return and delete then before finally deleting the return.

### Delete all test returns

`node scripts/returns delete-all`
