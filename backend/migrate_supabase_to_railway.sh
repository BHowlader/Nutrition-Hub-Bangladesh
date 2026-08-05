#!/usr/bin/env bash
# Copy app data from the old Supabase Postgres into the Railway Postgres.
#
#   SUPABASE_URL=... RAILWAY_URL=... ./migrate_supabase_to_railway.sh [--replace]
#
# Default mode appends and refuses to touch a non-empty target.
# --replace TRUNCATEs the nine app tables first, making Railway an exact
# mirror of Supabase. Use it when Railway holds only app-seeded rows.
#
# Why --replace is usually the right one here: the backend seeds products and
# categories on first boot with freshly generated UUIDs. Those do not match
# Supabase's, and order_items.product_id / products.category_id are real FKs,
# so appending Supabase orders on top of Railway-seeded products fails every
# FK. Mirroring keeps every ID internally consistent.
#
# Truncate and load share one transaction: either Railway ends up a complete
# mirror, or it is left exactly as it was.
#
# ponytail: plain pg_dump|psql, no ID-mapping layer. The Railway schema is a
# superset of Supabase's (startup migrations in main.py only ever ADD COLUMN
# IF NOT EXISTS), and pg_dump writes explicit column lists, so older-source
# into newer-target just works. Add a mapping step only if a column is ever
# renamed or dropped.
set -euo pipefail

: "${SUPABASE_URL:?set SUPABASE_URL to the Supabase connection string}"
: "${RAILWAY_URL:?set RAILWAY_URL to the Railway connection string}"

REPLACE=0
[[ "${1:-}" == "--replace" ]] && REPLACE=1

# pg_dump sorts by FK dependency, so listing order here does not matter.
TABLES=(users categories products coupons orders order_items cart_items site_settings audit_logs)

counts_sql=""
for t in "${TABLES[@]}"; do
  [[ -n "$counts_sql" ]] && counts_sql+=" union all "
  counts_sql+="select '$t' t, count(*) n from $t"
done

table_list_sql=$(printf ",'%s'" "${TABLES[@]}"); table_list_sql=${table_list_sql:1}

echo "==> Source (Supabase)"
psql "$SUPABASE_URL" -At -F' ' -c "select * from ($counts_sql) x order by t"

echo
echo "==> Target (Railway), before"
missing=$(psql "$RAILWAY_URL" -At -c "
  select coalesce(string_agg(t, ', '), '')
  from unnest(array[$table_list_sql]) t
  where to_regclass('public.'||t) is null")
if [[ -n "$missing" ]]; then
  echo "ERROR: these tables do not exist on Railway yet: $missing" >&2
  echo "Boot the backend against Railway once so create_all() builds the schema, then re-run." >&2
  exit 1
fi
psql "$RAILWAY_URL" -At -F' ' -c "select * from ($counts_sql) x order by t"

existing=$(psql "$RAILWAY_URL" -At -c "select coalesce(sum(n),0) from ($counts_sql) x")
if [[ "$existing" != "0" ]]; then
  echo
  if [[ "$REPLACE" == "0" ]]; then
    echo "ERROR: Railway holds $existing rows and --replace was not given." >&2
    echo "Appending would duplicate seeded products and break order_items FKs." >&2
    echo "Re-run with --replace to mirror Supabase exactly." >&2
    exit 1
  fi
  echo "!! --replace will DELETE all $existing existing rows on Railway,"
  echo "   then load Supabase's data in their place. This cannot be undone."
  read -r -p "   Type 'replace' to proceed: " ok
  [[ "$ok" == "replace" ]] || { echo "Aborted."; exit 1; }
fi

echo
echo "==> Copying..."
# TRUNCATE and COPY go through one psql so they share a single transaction.
{
  if [[ "$REPLACE" == "1" ]]; then
    printf 'TRUNCATE TABLE %s RESTART IDENTITY CASCADE;\n' "$(IFS=,; echo "${TABLES[*]}")"
  fi
  pg_dump "$SUPABASE_URL" \
    --data-only --no-owner --no-privileges --schema=public \
    $(printf -- '--table=public.%s ' "${TABLES[@]}")
} | psql "$RAILWAY_URL" --single-transaction -v ON_ERROR_STOP=1 -q

echo
echo "==> Target (Railway), after"
psql "$RAILWAY_URL" -At -F' ' -c "select * from ($counts_sql) x order by t"
echo
echo "Done. Source and after counts above should match."
