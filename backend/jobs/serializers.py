from rest_framework import serializers
from .models import (
    Job, JobCategory, Skill, Bid, Review, 
    SavedJob, JobTemplate, WorkerAvailability
)
from accounts.serializers import UserSerializer

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category']

class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ['name', 'display_name', 'icon', 'description']

class JobTemplateSerializer(serializers.ModelSerializer):
    required_skills = SkillSerializer(many=True, read_only=True)
    
    class Meta:
        model = JobTemplate
        fields = '__all__'
# THIS IS THE CORRECTED CODE (FIXED)

class JobListSerializer(serializers.ModelSerializer):
    employer = UserSerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)
    bids_count = serializers.IntegerField(read_only=True)
    lowest_bid = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'employer', 'category',
            'location_type', 'city', 'state', 'budget_min', 'budget_max',
            'instant_hire_price', 'start_date', 'urgency', 'status',
            'bids_count', 'lowest_bid', 'posted_date', 'number_of_workers',
            'physical_requirements','bid_count'
        ]
    
    def get_lowest_bid(self, obj):
        lowest_bid = obj.bids.filter(status='pending').order_by('amount').first()
        return lowest_bid.amount if lowest_bid else None
    
class BidSerializer(serializers.ModelSerializer):
    worker = UserSerializer(read_only=True)
    worker_id = serializers.UUIDField(write_only=True, required=False)
    job = JobListSerializer(read_only=True)  # <--- 1. ADD THIS LINE
    class Meta:
        model = Bid
        fields = [
        'id', 'job', 'worker', 'worker_id', 'amount', 
        'message', 'estimated_completion_time', 'status',
        'is_team_bid', 'team_members', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status'] 

    def create(self, validated_data):
        validated_data['worker'] = self.context['request'].user
        return super().create(validated_data)
    

class JobDetailSerializer(serializers.ModelSerializer):
    employer = UserSerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)
    skills_required = SkillSerializer(many=True, read_only=True)
    bids = BidSerializer(many=True, read_only=True)
    bid_count = serializers.IntegerField(read_only=True)
    user_has_bid = serializers.SerializerMethodField()
    user_bid = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ['id', 'posted_date', 'view_count']
    
    def get_user_has_bid(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bids.filter(worker=request.user).exists()
        return False
    
    def get_user_bid(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            bid = obj.bids.filter(worker=request.user).first()
            return BidSerializer(bid).data if bid else None
        return None
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedJob.objects.filter(user=request.user, job=obj).exists()
        return False

class JobCreateSerializer(serializers.ModelSerializer):
    skills_required = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Skill.objects.all(), required=False
    )
    
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ['id', 'employer', 'posted_date', 'view_count']
    
    def create(self, validated_data):
        skills = validated_data.pop('skills_required', [])
        validated_data['employer'] = self.context['request'].user
        job = Job.objects.create(**validated_data)
        job.skills_required.set(skills)
        return job

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewed_user = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['id', 'overall_rating', 'created_at', 'updated_at']

class SavedJobSerializer(serializers.ModelSerializer):
    job = JobListSerializer(read_only=True)
    
    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'saved_at']
        read_only_fields = ['id', 'saved_at']

class WorkerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerAvailability
        fields = '__all__'
        read_only_fields = ['id', 'worker']
        
        # Update JobDetailSerializer to include worker info
from .models import Job, SavedJob, Bid # Make sure to import SavedJob and Bid
from .serializers import UserSerializer, JobCategorySerializer, SkillSerializer, BidSerializer # Import your other serializers

# ...

class JobDetailSerializer(serializers.ModelSerializer):
    employer = UserSerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)
    skills_required = SkillSerializer(many=True, read_only=True)
    
    # We only show bids if the user is the employer
    bids = serializers.SerializerMethodField()
    bid_count = serializers.IntegerField(read_only=True) # Assumes this is annotated in the view
    
    # Custom fields for the request.user
    user_has_bid = serializers.SerializerMethodField()
    user_bid = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    
    # Fields for completed jobs
    has_review = serializers.BooleanField(read_only=True, default=False) # Assumes this is annotated
    worker = serializers.SerializerMethodField() 
    final_amount = serializers.SerializerMethodField()

    class Meta:
        model = Job
        # DO NOT USE '__all__'. Explicitly list your fields.
        fields = [
            'id', 'employer', 'title', 'description', 'category', 'skills_required',
            'location_type', 'address', 'city', 'state', 'zip_code', 'latitude', 'longitude',
            'posted_date', 'start_date', 'start_time', 'end_date', 'estimated_duration',
            'is_flexible', 'urgency', 'budget_min', 'budget_max', 'instant_hire_price',
            'number_of_workers', 'tools_provided', 'tools_required', 'physical_requirements',
            'auto_match_enabled', 'auto_match_min_rating', 'auto_match_max_distance',
            'status', 'completion_date', 'images', 'is_featured', 'view_count',
            
            # Serializer fields
            'bids', 'bid_count', 'user_has_bid', 'user_bid', 'is_saved', 'has_review',
            'worker', 'final_amount'
        ]
        read_only_fields = ['id', 'posted_date', 'view_count']

    def get_user_has_bid(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bids.filter(worker=request.user).exists()
        return False

    def get_user_bid(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            bid = obj.bids.filter(worker=request.user).first()
            return BidSerializer(bid).data if bid else None
        return None

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Assumes your SavedJob model is imported
            return SavedJob.objects.filter(user=request.user, job=obj).exists()
        return False

    def get_bids(self, obj):
        """
        Only show the list of bids to the job employer.
        """
        request = self.context.get('request')
        if request and request.user == obj.employer:
            # Pass context to BidSerializer if it needs the request
            return BidSerializer(obj.bids.all(), many=True, context=self.context).data
        # Return an empty list for non-employers
        return []

    # --- YOU MUST ADD LOGIC TO THESE METHODS ---
    
    def get_worker(self, obj):
        """
        Logic to get the accepted worker(s) info after job is in_progress/completed.
        """
        if obj.status in ['in_progress', 'completed']:
            # Get all accepted bids
            accepted_bids = obj.bids.filter(status='accepted')
            # Get all workers from those bids
            workers = [bid.worker for bid in accepted_bids]
            # Serialize the worker data
            return UserSerializer(workers, many=True, context=self.context).data
        return None # Or []

    def get_final_amount(self, obj):
        """
        Logic to get the final agreed-upon price(s).
        """
        if obj.status in ['in_progress', 'completed']:
            # Get all accepted bids
            accepted_bids = obj.bids.filter(status='accepted')
            # You could sum them, or return a list of amounts
            total_amount = sum(bid.amount for bid in accepted_bids)
            return total_amount
        return None
    
    
from .models import User

# Add a serializer for worker listing
class WorkerSerializer(serializers.ModelSerializer):
    completed_jobs = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'profile_picture', 'bio', 'location', 'skills',
            'hourly_rate', 'availability', 'rating', 'total_reviews',
            'is_verified', 'date_joined', 'completed_jobs'
        ]
    
    def get_completed_jobs(self, obj):
        return Job.objects.filter(
            selected_bid__worker=obj,
            status='completed'
        ).count()