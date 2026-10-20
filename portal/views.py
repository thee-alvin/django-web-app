from mimetypes import guess_type
from pathlib import Path, PurePosixPath, PureWindowsPath

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import render
from django.template import TemplateDoesNotExist
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
@require_GET
def home(request):
    return render(request, "portal/index.html")


@require_GET
def status(request):
    return JsonResponse(
        {
            "system": "The Legacy Circle",
            "short_name": "TLC",
            "status": "online",
        }
    )


@ensure_csrf_cookie
@require_GET
def system_health(request):
    return render(request, "portal/pages/tlc_health.html")


@require_GET
def profile_picture(request, file_name):
    if (
        PurePosixPath(file_name).name != file_name
        or PureWindowsPath(file_name).name != file_name
        or PurePosixPath(file_name).suffix.lower()
        not in {".jpg", ".jpeg", ".png", ".webp"}
    ):
        raise Http404

    picture_path = Path(settings.TLC_PROFILE_PICTURE_DIR) / file_name
    try:
        picture = picture_path.open("rb")
    except FileNotFoundError as exc:
        raise Http404 from exc

    return FileResponse(
        picture,
        content_type=guess_type(picture_path.name)[0] or "application/octet-stream",
    )


@ensure_csrf_cookie
@require_GET
def page(request, page_path):
    requested = PurePosixPath(page_path)
    if requested.is_absolute() or ".." in requested.parts:
        raise Http404

    template_name = f"portal/pages/{requested.as_posix()}"
    if not template_name.endswith(".html"):
        template_name += ".html"

    try:
        return render(request, template_name)
    except TemplateDoesNotExist as exc:
        raise Http404 from exc
