#!/bin/sh
set -eu
# Upgrade the existing private demo database without replacing its volume.
docker compose up -d --no-build --pull never --wait --wait-timeout 300 db
docker compose exec -T -u postgres db sh -eu <<'DATABASE'
backup="$PGDATA/quickcart-before-passwordless.sql"
if [ ! -f "$PGDATA/pg_hba.conf.before-passwordless" ]; then
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$backup.tmp"
  mv "$backup.tmp" "$backup"
  cp "$PGDATA/pg_hba.conf" "$PGDATA/pg_hba.conf.before-passwordless"
fi
# The database has no published host port and is on the backend network only.
printf 'local all all trust\nhost all all all trust\n' > "$PGDATA/pg_hba.conf"
pg_ctl reload -D "$PGDATA"
attempt=0
until psql -w -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atqc 'SELECT 1' >/dev/null; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 15 ] || exit 1
  sleep 1
done
DATABASE
docker compose up -d --no-build --pull never --wait --wait-timeout 600 --remove-orphans
