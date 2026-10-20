release: python -m playwright install chromium && python manage.py migrate --noinput && python manage.py collectstatic --noinput
web: gunicorn --bind 0.0.0.0:${PORT:-8000} --timeout 120 tlc_portal.wsgi:application
worker: python manage.py run_portal_workers
