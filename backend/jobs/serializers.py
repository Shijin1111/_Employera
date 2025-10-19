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
            'physical_requirements'
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