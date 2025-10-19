from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

User = get_user_model()

class JobCategory(models.Model):
    CATEGORY_CHOICES = [
        ('home', 'Home'),
        ('errands', 'Errands & Delivery'),
        ('events', 'Events'),
        ('petcare', 'Pet Care'),
        ('office', 'Office/Retail'),
    ]
    
    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "Job Categories"
        ordering = ['display_name']
    
    def __str__(self):
        return self.display_name

class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(JobCategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class JobTemplate(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(JobCategory, on_delete=models.CASCADE)
    description_template = models.TextField()
    estimated_duration = models.IntegerField(help_text="Duration in minutes")
    suggested_min_price = models.DecimalField(max_digits=10, decimal_places=2)
    suggested_max_price = models.DecimalField(max_digits=10, decimal_places=2)
    required_skills = models.ManyToManyField(Skill, blank=True)
    checklist = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.category})"

class Job(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open for Bidding'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    URGENCY_CHOICES = [
        ('low', 'Low - Flexible timing'),
        ('medium', 'Medium - Within a week'),
        ('high', 'High - Within 2-3 days'),
        ('urgent', 'Urgent - ASAP'),
    ]
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(JobCategory, on_delete=models.SET_NULL, null=True)
    skills_required = models.ManyToManyField(Skill, blank=True)
    
    # Location
    location_type = models.CharField(max_length=20, choices=[
        ('onsite', 'On-site'),
        ('remote', 'Remote'),
    ], default='onsite')
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Timing
    posted_date = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    estimated_duration = models.IntegerField(help_text="Duration in minutes", null=True, blank=True)
    is_flexible = models.BooleanField(default=False)
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='medium')
    
    # Pricing
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    instant_hire_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Price for instant hire without bidding"
    )
    
    # Requirements
    number_of_workers = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    tools_provided = models.BooleanField(default=True)
    tools_required = models.TextField(blank=True, help_text="Tools worker needs to bring")
    physical_requirements = models.CharField(max_length=50, choices=[
        ('light', 'Light Work'),
        ('moderate', 'Moderate Physical Work'),
        ('heavy', 'Heavy Lifting Required'),
    ], default='moderate')
    
    # Auto-match criteria
    auto_match_enabled = models.BooleanField(default=False)
    auto_match_min_rating = models.DecimalField(
        max_digits=2, decimal_places=1, default=4.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    auto_match_max_distance = models.IntegerField(
        default=10, help_text="Maximum distance in km",
        validators=[MinValueValidator(1)]
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    selected_bid = models.OneToOneField(
        'Bid', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='selected_for_job'
    )
    completion_date = models.DateTimeField(null=True, blank=True)
    
    # Additional
    images = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-posted_date']
        indexes = [
            models.Index(fields=['status', 'posted_date']),
            models.Index(fields=['employer', 'status']),
            models.Index(fields=['category', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.employer.get_full_name()}"
    
    @property
    def is_active(self):
        return self.status == 'open'
    
    @property
    def bid_count(self):
        return self.bids.count()

class Bid(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='bids')
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bids')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    message = models.TextField(blank=True)
    estimated_completion_time = models.IntegerField(help_text="Time in minutes", null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # For team bids
    is_team_bid = models.BooleanField(default=False)
    team_members = models.ManyToManyField(User, blank=True, related_name='team_bids')
    
    class Meta:
        ordering = ['amount', 'created_at']
        unique_together = ['job', 'worker']
        indexes = [
            models.Index(fields=['job', 'status']),
            models.Index(fields=['worker', 'status']),
        ]
    
    def __str__(self):
        return f"Bid by {self.worker.get_full_name()} for {self.job.title}"

class JobImage(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='job_images')
    image = models.ImageField(upload_to='job_images/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']

class Review(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    reviewed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    
    # Separate ratings
    quality_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    communication_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    punctuality_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    professionalism_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    overall_rating = models.DecimalField(max_digits=2, decimal_places=1)
    comment = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['job', 'reviewer', 'reviewed_user']
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Calculate overall rating
        self.overall_rating = (
            self.quality_rating + 
            self.communication_rating + 
            self.punctuality_rating + 
            self.professionalism_rating
        ) / 4
        super().save(*args, **kwargs)

class SavedJob(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'job']
        ordering = ['-saved_at']

class WorkerAvailability(models.Model):
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedule_records')
    day_of_week = models.IntegerField(choices=[
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['worker', 'day_of_week', 'start_time']
        ordering = ['day_of_week', 'start_time']