# Water Abstraction service

|               |              |  
|---------------|--------------|
| Build         |  ![CI](https://github.com/DEFRA/water-abstraction-service/workflows/CI/badge.svg) |
| Test coverage | [![Test Coverage](https://api.codeclimate.com/v1/badges/9ee43d8d24011c130e15/test_coverage)](https://codeclimate.com/github/DEFRA/water-abstraction-service/test_coverage)  |
| Quality check |  [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_water-abstraction-service&metric=alert_status)](https://sonarcloud.io/dashboard?id=DEFRA_water-abstraction-service) |

The water abstraction service is a layer which contains the business logic that is required for the water abstraction service to function, without such logic making its way into the underlying and potentially reusable IDM, CRM or Permit projects.

## Development Team

This module was developed by the Water Resource Licensing Service team as part of a digital transformation project at [DEFRA](https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs), a department of the UK government

To find out more about planned reforms to the abstraction licensing service, see the policy paper: [Water abstraction plan: Abstraction licensing service](https://www.gov.uk/government/publications/water-abstraction-plan-2017/water-abstraction-plan-abstraction-licensing-service)

## Contributing to this project

If you have an idea you'd like to contribute please log an issue.

All contributions should be submitted via a pull request.

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.

## Environment Variables

The required environment variables for local development can be found in the [.env.example file](./.env.example).
