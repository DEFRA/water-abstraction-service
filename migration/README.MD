usage:

node node_modules/db-migrate/bin/db-migrate up

Requires database.json - i.e.

{
  "dev": {
    "driver": "pg",
    "user": "postgres",
    "password": "postgres",
    "host": "127.0.0.1",
    "port":"5432",
    "database": "permits",
    "schema": "permit"
  }
}
