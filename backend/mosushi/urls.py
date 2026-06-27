from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("store.urls")),
]

# Serve media files in development
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path("media/<path:path>", serve, {"document_root": settings.MEDIA_ROOT}),
    path("static/<path:path>", serve, {"document_root": settings.STATIC_ROOT}),
]