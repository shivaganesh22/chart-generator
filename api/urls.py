from django.contrib import admin
from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import *
router = DefaultRouter()
router.register('save', SaveChartView,basename="save-charts")
urlpatterns = [
    path('', include(router.urls)),
    path('signup/',SignupView.as_view()),
    path('verifyemail/',VerificationView.as_view()),
    path('login/',LoginView.as_view()),
    path('logout/',SignOutView.as_view()),
    path('forgotpassword/',ForgotView.as_view()),
    path('resetpassword/',ResetView.as_view()),
    path('contact/',ContactView.as_view()),

    path('insights/',GenerateInsightsView.as_view()),
    path('upload/',upload_file),


]
