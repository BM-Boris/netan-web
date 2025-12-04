# network/urls.py
from django.urls import path
from .views import BuildNetworkView
from .annot_views import AnnotateView

urlpatterns = [
    path("build-network/", BuildNetworkView.as_view(), name="build-network"),
    path("annotate/", AnnotateView.as_view(), name="annotate"),
]

