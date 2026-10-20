# TLC Portal - Django

This directory contains the Django deployment project. The legacy root application is
left untouched while its user interface is brought into Django templates and static
files.

## Local setup

1. Create and activate a virtual environment.
2. Install dependencies with `python -m pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and generate a unique `DJANGO_SECRET_KEY`.
4. Set `TLC_DATA_DIR` to the directory containing TLC spreadsheet and document data.
   The default points to `DjangoWebApp/data`.
5. Run `python manage.py migrate`, then `python manage.py collectstatic --noinput`.
6. Start locally with `python manage.py runserver`.

For local HTTP development, set `DJANGO_DEBUG=True` and
`DJANGO_SECURE_SSL_REDIRECT=False` in `.env`.

For production, set `DJANGO_DEBUG=False`, provide the deployed hostname in
`DJANGO_ALLOWED_HOSTS`, set HTTPS origins in `DJANGO_CSRF_TRUSTED_ORIGINS`, and
provide unique credentials through environment variables. Set `DATABASE_URL` to the
hosting provider's PostgreSQL connection string and mount `TLC_DATA_DIR` as persistent
storage. The included `Procfile` runs database migrations and collects static files
for the web service and starts a separate worker service for background jobs. Do not
include live member records or generated receipts in source control.

The current migration stage includes Django project configuration, template-based
portal pages, static assets, and the health/status endpoint. Feature API conversion
must be completed before switching production traffic from the existing portal.
