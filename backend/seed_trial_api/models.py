from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

def generate_seed_id():
    return f"SD_{uuid.uuid4().hex[:8].upper()}"

def generate_plot_id():
    return f"PL_{uuid.uuid4().hex[:8].upper()}"

def generate_trial_id():
    return f"TR_{uuid.uuid4().hex[:8].upper()}"

def generate_incident_id():
    return f"IN_{uuid.uuid4().hex[:8].upper()}"

class Seed(models.Model):
    name = models.CharField(max_length=100)
    variety = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.variety}"

class Plot(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    area = models.FloatField(help_text="Area in square meters")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class TrialObservation(models.Model):
    seed = models.ForeignKey(Seed, on_delete=models.CASCADE)
    plot = models.ForeignKey(Plot, on_delete=models.CASCADE)
    observation_date = models.DateField()
    growth_stage = models.CharField(max_length=50)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.seed.name} - {self.plot.name} - {self.observation_date}"

class Incident(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    plot = models.ForeignKey(Plot, on_delete=models.CASCADE)
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE)
    incident_date = models.DateField()
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.severity}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"
