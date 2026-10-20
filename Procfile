release: python -m playwright install chromium && python manage.py migrate --noinput && python manage.py collectstatic --noinput
web: gunicorn tlc_portal.wsgi:application
worker: python manage.py run_portal_workers
