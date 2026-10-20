web: python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn tlc_portal.wsgi:application
worker: python manage.py run_portal_workers
