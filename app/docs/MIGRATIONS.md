# Database Migrations

## Current approach

The application uses SQLite and initializes the `orders` and `webhook_events`
tables with `CREATE TABLE IF NOT EXISTS` when the backend starts. This keeps a
new local database usable without a separate setup command.

The canonical schema is documented in [`../sql/schema.sql`](../sql/schema.sql). Runtime
data is stored in `orders.db`; automated tests use `orders.test.db`.

## Safe migration workflow

1. Back up the database before changing the schema:

   ```bash
   cp orders.db orders.db.backup
   ```

2. Write a forward-only migration in this directory, using a numbered name,
   such as `001_add_vendor_id.sql`.
3. Test the migration against a copy of the database, not production data.
4. Run the checks in [`validation.sql`](./validation.sql).
5. Update `../sql/schema.sql` and the application queries to match the new schema.
6. Record the change, rollout date, and rollback plan in this document.

## Example migration

The following example adds an optional vendor identifier:

```sql
ALTER TABLE orders ADD COLUMN vendor_id TEXT;
```

SQLite has limited `ALTER TABLE` support. For changes that remove or alter
columns, create a replacement table, copy the validated data, rename the
table, and recreate indexes and foreign keys.

## Rollback guidance

For additive changes, rollback normally means deploying application code that
does not use the new column. For destructive changes, restore the verified
database backup instead of attempting an unsafe reverse migration.

Never commit runtime database files or backups to Git.
