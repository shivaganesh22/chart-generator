from django.db import models
from django.contrib.auth.models import User
from datetime import timedelta
from django.utils import timezone
# Create your models here.

class Verification(models.Model):
    token=models.CharField(max_length=100)
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    is_verified=models.BooleanField(default=False)
    def __str__(self):
        return self.user.username+" "+self.token
class ForgotPassword(models.Model):
    token=models.CharField(max_length=100)
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    expire_date=models.DateTimeField(default=timezone.now() + timedelta(days=1))
    def __str__(self):
        return self.user.username+" "+self.token
class Contact(models.Model):
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    subject=models.CharField(max_length=100)
    message=models.TextField()
    def __str__(self) :
        return self.user.username+"  "+self.subject
class ChartModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    chart = models.ImageField(upload_to='charts')
    dataset = models.CharField(blank=True, null=True, max_length=100)
    date = models.DateField(auto_now_add=True)
    is_in_dashboard = models.BooleanField(default=False)
    dashboard_position = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return self.user.username