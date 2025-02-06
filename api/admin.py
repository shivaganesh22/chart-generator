from django.contrib import admin

# Register your models here.
from .models import *
admin.site.register(Verification)
admin.site.register(Contact)
admin.site.register(ForgotPassword)
admin.site.register(ChartModel)