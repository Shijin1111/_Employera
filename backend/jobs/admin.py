from django.contrib import admin

# Register your models here.
from .models import Job,JobCategory,Skill,JobTemplate,Bid,JobImage,Review,SavedJob,WorkerAvailability
admin.site.register(Job)
admin.site.register(JobCategory)
admin.site.register(Skill)
admin.site.register(JobTemplate)
admin.site.register(Bid)
admin.site.register(JobImage)
admin.site.register(Review)
admin.site.register(SavedJob)
admin.site.register(WorkerAvailability)
