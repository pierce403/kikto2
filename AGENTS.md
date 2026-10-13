# Kik.to migration

Cloudflare native Git publishing owns production. Keep credentials out of GitHub.
D1 stores every original url field, ID, edit key and timestamp. Production remains
read-only until every Heroku writer is frozen and a final consistent copy reconciles.
Previews never share production data. Tests use isolated data and make no accepted
production mutation. Logs must not contain edit keys, URL values or credentials.
Keep Heroku backups and source for recovery; reverse-transfer new writes before rollback.
