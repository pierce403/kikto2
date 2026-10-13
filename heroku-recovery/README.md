# Preserved Heroku build configuration

These files belong to the original Flask recovery runtime. They are kept outside
the repository root so Cloudflare native builds install only the Worker npm lockfile.
The exact deployed Heroku source is commit33de21134d02ba882ba6773ac636b3a0d92481d2,
with its original runtime/requirements paths. Private deployed slug and database
backups are preserved separately in the local migration coordination project.
