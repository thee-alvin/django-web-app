from pathlib import PurePosixPath

from django.http import Http404, JsonResponse
from django.shortcuts import render
from django.template import TemplateDoesNotExist
from django.views.decorators.http import require_GET


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


@require_GET
def system_health(request):
    return render(request, "portal/pages/tlc_health.html")


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
