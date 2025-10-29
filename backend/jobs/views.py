from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Min, Avg, DateTimeField
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Job, JobCategory, Skill, Bid, Review, 
    SavedJob, JobTemplate, WorkerAvailability
)
from .serializers import (
    JobListSerializer, JobDetailSerializer, JobCreateSerializer,
    JobCategorySerializer, SkillSerializer, BidSerializer,
    ReviewSerializer, SavedJobSerializer, JobTemplateSerializer,
    WorkerAvailabilitySerializer
)

class JobCategoryListView(generics.ListAPIView):
    queryset = JobCategory.objects.all()
    serializer_class = JobCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class JobTemplateListView(generics.ListAPIView):
    queryset = JobTemplate.objects.all()
    serializer_class = JobTemplateSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__name=category)
        return queryset

class JobListView(generics.ListAPIView):
    serializer_class = JobListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'city', 'state']
    ordering_fields = ['posted_date', 'start_date', 'budget_max', 'urgency']
    ordering = ['-posted_date']
    
    def get_queryset(self):
        queryset = Job.objects.filter(status='open').annotate(
            bids_count=Count('bids')
        )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__name=category)
        
        # Filter by location
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(budget_max__gte=min_price)
        if max_price:
            queryset = queryset.filter(budget_min__lte=max_price)
        
        # Filter by urgency
        urgency = self.request.query_params.get('urgency', None)
        if urgency:
            queryset = queryset.filter(urgency=urgency)
        
        # Filter by physical requirements
        physical = self.request.query_params.get('physical', None)
        if physical:
            queryset = queryset.filter(physical_requirements=physical)
        
        return queryset

class JobCreateView(generics.CreateAPIView):
    queryset = Job.objects.all()
    serializer_class = JobCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(employer=self.request.user)

class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return JobCreateSerializer
        return JobDetailSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only employer can update their own job
        if instance.employer != request.user:
            return Response(
                {'error': 'You can only edit your own jobs'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only employer can delete their own job
        if instance.employer != request.user:
            return Response(
                {'error': 'You can only delete your own jobs'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

class MyJobsView(generics.ListAPIView):
    serializer_class = JobListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status', None)
        
        if user.account_type == 'employer':
            queryset = Job.objects.filter(employer=user)
        else:
            # Jobs where user has bid
            queryset = Job.objects.filter(bids__worker=user).distinct()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.annotate(bids_count=Count('bids'))

class BidCreateView(generics.CreateAPIView):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        job_id = self.kwargs.get('job_id')
        job = get_object_or_404(Job, id=job_id)
        
        # Check if job is open for bidding
        if job.status != 'open':
            return Response(
                {'error': 'This job is not open for bidding'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is not the employer
        if job.employer == request.user:
            return Response(
                {'error': 'You cannot bid on your own job'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already bid
        if Bid.objects.filter(job=job, worker=request.user).exists():
            return Response(
                {'error': 'You have already bid on this job'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(job=job, worker=request.user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class BidListView(generics.ListAPIView):
    serializer_class = BidSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        job = get_object_or_404(Job, id=job_id)
        
        # Only employer can see all bids for their job
        if job.employer != self.request.user:
            # Workers can only see their own bid
            return Bid.objects.filter(job=job, worker=self.request.user)
        
        return job.bids.all()

class BidUpdateView(generics.UpdateAPIView):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        bid = self.get_object()
        
        # Only the worker who made the bid can update it
        if bid.worker != request.user:
            return Response(
                {'error': 'You can only update your own bids'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Can only update pending bids
        if bid.status != 'pending':
            return Response(
                {'error': 'You can only update pending bids'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().update(request, *args, **kwargs)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Job, Bid
from .serializers import BidSerializer

# ...

class AcceptBidView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, job_id, bid_id):
        job = get_object_or_404(Job, id=job_id)
        bid = get_object_or_404(Bid, id=bid_id, job=job)
        
        # 1. Authorization check
        if job.employer != request.user:
            return Response(
                {'error': 'Only the employer can accept bids'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 2. Prevent re-accepting a bid
        if bid.status == 'accepted':
             return Response(
                {'error': 'This bid has already been accepted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. NEW LOGIC: Check worker limit
        # Count how many bids are *already* accepted
        current_accepted_count = job.bids.filter(status='accepted').count()
        
        if current_accepted_count >= job.number_of_workers:
            return Response(
                {'error': f'You have already accepted the maximum number of workers ({job.number_of_workers}) for this job.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 4. Accept the bid
        bid.status = 'accepted'
        bid.save()
        
        # 5. Update job status to 'in_progress' (if it's not already)
        if job.status == 'open':
            job.status = 'in_progress'
            job.save()

        # 6. Return success
        # As requested, we do NOT auto-reject other pending bids.
        return Response({
            'message': 'Bid accepted successfully.',
            'bid': BidSerializer(bid).data
        })

# Make sure you still have your RejectBidView
class RejectBidView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, job_id, bid_id):
        job = get_object_or_404(Job, id=job_id)
        bid = get_object_or_404(Bid, id=bid_id, job=job)
        
        if job.employer != request.user:
            return Response(
                {'error': 'Only the employer can reject bids'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # You can't reject a bid that's already in progress
        if bid.status == 'accepted':
             return Response(
                {'error': 'Cannot reject an already accepted bid. You may need to cancel the job.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        bid.status = 'rejected'
        bid.save()
        
        return Response({
            'message': 'Bid rejected successfully',
            'bid': BidSerializer(bid).data
        })
        
class SaveJobView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        
        saved_job, created = SavedJob.objects.get_or_create(
            user=request.user,
            job=job
        )
        
        if created:
            return Response({
                'message': 'Job saved successfully',
                'saved_job': SavedJobSerializer(saved_job).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': 'Job already saved'
            }, status=status.HTTP_200_OK)
    
    def delete(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        
        try:
            saved_job = SavedJob.objects.get(user=request.user, job=job)
            saved_job.delete()
            return Response({
                'message': 'Job removed from saved'
            }, status=status.HTTP_204_NO_CONTENT)
        except SavedJob.DoesNotExist:
            return Response({
                'error': 'Job not in saved list'
            }, status=status.HTTP_404_NOT_FOUND)

class SavedJobsListView(generics.ListAPIView):
    serializer_class = SavedJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user)

class ReviewCreateView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        job_id = self.kwargs.get('job_id')
        job = get_object_or_404(Job, id=job_id)
        
        # Check if job is completed
        if job.status != 'completed':
            return Response(
                {'error': 'Can only review completed jobs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine who is being reviewed
        if job.employer == request.user:
            # Employer reviewing worker
            reviewed_user = job.selected_bid.worker
        else:
            # Worker reviewing employer
            reviewed_user = job.employer
        
        # Check if review already exists
        if Review.objects.filter(
            job=job, 
            reviewer=request.user, 
            reviewed_user=reviewed_user
        ).exists():
            return Response(
                {'error': 'You have already reviewed this job'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            job=job,
            reviewer=request.user,
            reviewed_user=reviewed_user
        )
        
        # Update user's average rating
        avg_ratings = Review.objects.filter(reviewed_user=reviewed_user).aggregate(
            avg_rating=Avg('overall_rating')
        )
        reviewed_user.rating = avg_ratings['avg_rating'] or 0
        reviewed_user.total_reviews = Review.objects.filter(reviewed_user=reviewed_user).count()
        reviewed_user.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

import datetime
from django.utils import timezone
from django.db.models import Sum, Avg, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

# --- IMPORTANT: IMPORT YOUR MODELS ---
# (Adjust these paths to match your project structure)
from jobs.models import Job, Bid 
User = get_user_model()


# Helper function (no changes needed)
def calculate_trend(current_count, last_month_count):
    if last_month_count > 0:
        return round(((current_count - last_month_count) / last_month_count) * 100)
    elif current_count > 0:
        return 100
    else:
        return 0

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    
    today = timezone.now().date()
    current_month_start = today.replace(day=1)
    last_month_end = current_month_start - datetime.timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    
    if user.account_type == 'employer':
        employer_jobs = Job.objects.filter(employer=user)
        completed_jobs_qs = employer_jobs.filter(status='completed')

        # --- Calculate Spending (Fixed) ---
        accepted_bids_qs = Bid.objects.filter(
            job__in=completed_jobs_qs, 
            status='accepted'
        )
        spending_agg = accepted_bids_qs.aggregate(
            total_spent=Sum('amount'),
            average_cost=Avg('amount')
        )

        # --- Trend 1: Total Jobs Posted (No change) ---
        current_month_posted = employer_jobs.filter(
            posted_date__gte=current_month_start
        ).count()
        last_month_posted = employer_jobs.filter(
            posted_date__gte=last_month_start,
            posted_date__lt=current_month_start
        ).count()
        total_jobs_trend = calculate_trend(current_month_posted, last_month_posted)

        # --- Trend 2: Completed Jobs (FIXED) ---
        # Using 'completion_date' instead of 'updated_at'
        current_month_completed = completed_jobs_qs.filter(
            completion_date__gte=current_month_start
        ).count()
        last_month_completed = completed_jobs_qs.filter(
            completion_date__gte=last_month_start,
            completion_date__lt=current_month_start
        ).count()
        completed_jobs_trend = calculate_trend(current_month_completed, last_month_completed)

        stats = {
            'total_jobs_posted': employer_jobs.count(),
            'active_jobs': employer_jobs.filter(status='open').count(),
            'in_progress_jobs': employer_jobs.filter(status='in_progress').count(),
            'completed_jobs': completed_jobs_qs.count(),
            'total_spent': spending_agg['total_spent'] or 0,
            'average_job_cost': round(spending_agg['average_cost'], 2) if spending_agg['average_cost'] else 0,
            'total_jobs_trend': total_jobs_trend,
            'completed_jobs_trend': completed_jobs_trend,
        }
    
    else: # user.account_type == 'worker'
        worker_bids = Bid.objects.filter(worker=user)
        
        # --- Worker Stats (Fixed) ---
        worker_accepted_bids_qs = worker_bids.filter(status='accepted')

        completed_worker_jobs_qs = Job.objects.filter(
            status='completed',
            bids__in=worker_accepted_bids_qs
        ).distinct()
        
        earned_agg = worker_accepted_bids_qs.filter(
            job__status='completed'
        ).aggregate(
            total_earned=Sum('amount')
        )

        stats = {
            'total_bids': worker_bids.count(),
            'pending_bids': worker_bids.filter(status='pending').count(),
            'accepted_bids': worker_accepted_bids_qs.count(),
            'completed_jobs': completed_worker_jobs_qs.count(),
            'total_earned': earned_agg['total_earned'] or 0,
            'average_rating': user.rating, 
            'total_reviews': user.total_reviews,
        }
    
    return Response(stats)

# Add these imports at the top
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Min, Avg, Sum, F

User = get_user_model()
from accounts.serializers import UserSerializer
# Add these new views

class WorkersListView(generics.ListAPIView):
    """List all workers for employers to browse"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'skills', 'bio']
    ordering_fields = ['rating', 'total_reviews', 'hourly_rate']
    ordering = ['-rating']
    
    def get_queryset(self):
        # Only show job seekers (workers)
        queryset = User.objects.filter(account_type='jobseeker')
        
        # Filter by skills if provided
        skills = self.request.query_params.get('skills', None)
        if skills:
            skills_list = skills.split(',')
            queryset = queryset.filter(skills__overlap=skills_list)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        # Filter by hourly rate range
        min_rate = self.request.query_params.get('min_rate', None)
        max_rate = self.request.query_params.get('max_rate', None)
        if min_rate:
            queryset = queryset.filter(hourly_rate__gte=min_rate)
        if max_rate:
            queryset = queryset.filter(hourly_rate__lte=max_rate)
        
        return queryset

class FavoriteWorkersView(generics.ListAPIView):
    """Get employer's favorite workers"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Get workers who have successfully completed jobs for this employer
        return User.objects.filter(
            account_type='jobseeker',
            bids__job__employer=self.request.user,
            bids__status='accepted',
            bids__job__status='completed'
        ).distinct().annotate(
            jobs_together=Count('bids')
        ).order_by('-jobs_together')

class RecentWorkersView(generics.ListAPIView):
    """Get recently hired workers"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Get workers hired in the last 30 days
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        return User.objects.filter(
            account_type='jobseeker',
            bids__job__employer=self.request.user,
            bids__status='accepted',
            bids__created_at__gte=thirty_days_ago
        ).distinct().order_by('-bids__created_at')

class JobHistoryView(generics.ListAPIView):
    """Get completed and cancelled jobs for history page"""
    serializer_class = JobDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status', 'completed')
        
        if user.account_type == 'employer':
            queryset = Job.objects.filter(
                employer=user,
                status__in=['completed', 'cancelled']
            )
        else:
            # Jobs where user's bid was accepted
            queryset = Job.objects.filter(
                bids__worker=user,
                bids__status='accepted',
                status__in=['completed', 'cancelled']
            )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Annotate with review status
        queryset = queryset.annotate(
            has_review=Count('reviews', filter=Q(reviews__reviewer=user))
        )
        
        # Include related data
        queryset = queryset.select_related('employer', 'category', 'selected_bid')
        queryset = queryset.prefetch_related('reviews', 'bids')
        
        return queryset.order_by('-completion_date', '-posted_date')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_job(request, job_id):
    """Mark a job as completed"""
    try:
        job = Job.objects.get(id=job_id)
        
        # Check if user is the employer of this job
        if job.employer != request.user:
            return Response(
                {'error': 'Only the employer can mark a job as completed'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if job is in progress
        if job.status != 'in_progress':
            return Response(
                {'error': 'Only jobs in progress can be marked as completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark job as completed
        job.status = 'completed'
        job.completion_date = timezone.now()
        job.save()
        
        return Response({
            'success': True,
            'message': 'Job marked as completed successfully'
        })
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def history_stats(request):
    """Get statistics for history page"""
    user = request.user
    
    if user.account_type == 'employer':
        jobs = Job.objects.filter(employer=user)
        completed_jobs = jobs.filter(status='completed')
        
        stats = {
            'total': jobs.count(),
            'completed': completed_jobs.count(),
            'cancelled': jobs.filter(status='cancelled').count(),
            'total_spent': completed_jobs.aggregate(
                total=Sum('selected_bid__amount')
            )['total'] or 0,
            'pending_reviews': completed_jobs.exclude(
                reviews__reviewer=user
            ).count(),
        }
    else:
        # For job seekers
        jobs = Job.objects.filter(
            bids__worker=user,
            bids__status='accepted'
        )
        completed_jobs = jobs.filter(status='completed')
        
        stats = {
            'total': jobs.count(),
            'completed': completed_jobs.count(),
            'cancelled': jobs.filter(status='cancelled').count(),
            'total_earned': Bid.objects.filter(
                worker=user,
                status='accepted',
                job__status='completed'
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'pending_reviews': completed_jobs.exclude(
                reviews__reviewer=user
            ).count(),
        }
    
    return Response(stats)

from django.utils import timezone
from django.db.models import (
    Avg, Count, Sum, Q, F, Case, When, Value,
    DecimalField, CharField, DurationField, ExpressionWrapper
)
from django.db.models.functions import Trunc
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from datetime import timedelta
from decimal import Decimal

# Import your models
# CHANGED: Import User from 'accounts.models' and Bid from '.models'
from .models import Job, Review, JobCategory, Bid
from accounts.models import User 

# --- Helper Functions ---
# (These are unchanged as they are pure logic)

def get_date_range(range_param):
    """Calculates a start and end date based on the range string."""
    today = timezone.now().date()
    if range_param == 'week':
        start_date = today - timedelta(days=7)
    elif range_param == 'quarter':
        start_date = today - timedelta(days=90)
    elif range_param == 'year':
        start_date = today - timedelta(days=365)
    else: # Default to 'month'
        start_date = today - timedelta(days=30)
    return start_date, today

def get_previous_date_range(start_date, end_date):
    """Calculates the matching previous date range for comparison."""
    duration = end_date - start_date
    prev_end_date = start_date - timedelta(days=1)
    prev_start_date = prev_end_date - duration
    return prev_start_date, prev_end_date

def calculate_change_percent(current, previous):
    """Calculates the percentage change between two values."""
    if previous is None or previous == 0:
        return 100.0 if current > 0 else 0.0
    if current is None:
        current = Decimal(0)
    if previous is None:
        previous = Decimal(0)
    return float(((Decimal(current) - Decimal(previous)) / Decimal(previous)) * 100)

# --- Updated Helper Function ---

def _get_overview_metrics(employer, start_date, end_date):
    """Helper to calculate overview metrics for a given date range."""
    
    # Filter for jobs completed in the period
    date_filter = Q(completion_date__date__range=[start_date, end_date])
    completed_jobs = Job.objects.filter(
        employer=employer, 
        status='completed', 
        completion_date__date__range=[start_date, end_date] # <-- ADDED filter directly
    )
    total_jobs_count = completed_jobs.count()

    # Get all accepted bids for these completed jobs
    # CHANGED: Use status='accepted' instead of is_accepted=True
    accepted_bids = Bid.objects.filter(job__in=completed_jobs, status='accepted')

    # Calculate metrics
    total_spent_val = accepted_bids.aggregate(total=Sum('amount'))['total'] or Decimal(0)
    avg_job_cost_val = (total_spent_val / total_jobs_count) if total_jobs_count > 0 else Decimal(0)
    total_workers_count = accepted_bids.values('worker').distinct().count()

    # Calculate avg completion time (completion date - start date)
    avg_duration_data = completed_jobs.annotate(
        duration_days=ExpressionWrapper(
            F('completion_date__date') - F('start_date'), 
            output_field=DurationField()
        )
    ).aggregate(avg_dur=Avg('duration_days'))
    avg_completion_time_val = avg_duration_data['avg_dur'].days if avg_duration_data['avg_dur'] else 0

    # Calculate avg rating given by this employer to workers on these jobs
    avg_rating_data = Review.objects.filter(
        job__in=completed_jobs, 
        reviewer=employer
    ).aggregate(avg_r=Avg('overall_rating'))
    avg_rating_val = float(avg_rating_data['avg_r'] or 0)

    return {
        'totalJobs': total_jobs_count,
        'totalSpent': total_spent_val,
        'avgJobCost': avg_job_cost_val,
        'totalWorkers': total_workers_count,
        'avgCompletionTime': avg_completion_time_val,
        'avgRating': avg_rating_val,
    }

# --- Main Analytics View ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics_data(request):
    """
    Aggregates and returns all analytics data for an employer's dashboard.
    """
    # CHANGED: Check against the correct account_type string
    if not request.user.account_type == 'employer':
        raise PermissionDenied("You must be an employer to access analytics.")

    employer = request.user
    range_param = request.GET.get('range', 'month')

    # 1. Get date ranges
    current_start, current_end = get_date_range(range_param)
    prev_start, prev_end = get_previous_date_range(current_start, current_end)

    # 2. Get Overview Data
    # (This section is unchanged, but calls the updated helper function)
    current_metrics = _get_overview_metrics(employer, current_start, current_end)
    prev_metrics = _get_overview_metrics(employer, prev_start, prev_end)

    overview_data = {
        'totalJobs': current_metrics['totalJobs'],
        'totalJobsChange': calculate_change_percent(current_metrics['totalJobs'], prev_metrics['totalJobs']),
        'totalSpent': current_metrics['totalSpent'],
        'totalSpentChange': calculate_change_percent(current_metrics['totalSpent'], prev_metrics['totalSpent']),
        'avgJobCost': current_metrics['avgJobCost'],
        'avgJobCostChange': calculate_change_percent(current_metrics['avgJobCost'], prev_metrics['avgJobCost']),
        'totalWorkers': current_metrics['totalWorkers'],
        'totalWorkersChange': calculate_change_percent(current_metrics['totalWorkers'], prev_metrics['totalWorkers']),
        'avgCompletionTime': current_metrics['avgCompletionTime'],
        'avgCompletionTimeChange': calculate_change_percent(current_metrics['avgCompletionTime'], prev_metrics['avgCompletionTime']),
        'avgRating': current_metrics['avgRating'],
        'avgRatingChange': calculate_change_percent(current_metrics['avgRating'], prev_metrics['avgRating']),
    }

    # 3. Get Jobs Over Time Data
    # (Date/time logic is unchanged)
    if range_param == 'week':
        trunc_kind = 'day'
        date_format = "%b %d" # e.g., "Oct 28"
    elif range_param == 'month' or range_param == 'quarter':
        trunc_kind = 'week'
        date_format = "W %U" # e.g., "W 43"
    else: # year
        trunc_kind = 'month'
        date_format = "%b" # e.g., "Oct"

    trunc = Trunc('job__completion_date', trunc_kind, output_field=DateTimeField())
    
    # CHANGED: Use status='accepted'
    jobs_over_time_query = Bid.objects.filter(
        job__employer=employer,
        job__status='completed',
        status='accepted', # Was is_accepted=True
        job__completion_date__date__range=[current_start, current_end]
    ).annotate(period=trunc).values('period').annotate(
        cost=Sum('amount'),
        jobs=Count('job_id', distinct=True)
    ).order_by('period')

    jobs_over_time_data = [
        {
            'month': d['period'].strftime(date_format), 
            'jobs': d['jobs'],
            'cost': d['cost']
        } 
        for d in jobs_over_time_query
    ]

    # 4. Get Costs by Category Data
    total_spending = current_metrics['totalSpent']
    
    # CHANGED: Use status='accepted'
    category_data_query = Bid.objects.filter(
        job__employer=employer,
        job__status='completed',
        status='accepted', # Was is_accepted=True
        job__completion_date__date__range=[current_start, current_end]
    ).values('job__category__name').annotate(
        value=Sum('amount')
    ).order_by('-value')

    costs_by_category_data = [
        {
            'name': d['job__category__name'] or 'Uncategorized',
            'value': d['value'],
            'percentage': float((d['value'] / total_spending) * 100) if total_spending > 0 else 0
        }
        for d in category_data_query
    ]

    # 5. Get Top Workers Data
    # CHANGED: Use 'bids' (related_name) instead of 'bids_made' and status='accepted'
    top_workers_query = User.objects.filter(
        bids__job__employer=employer,
        bids__job__status='completed',
        bids__status='accepted', # Was bids_made__is_accepted=True
        bids__job__completion_date__date__range=[current_start, current_end]
    ).annotate(
        jobs=Count('bids__job', distinct=True), # Was bids_made__job
        earnings=Sum('bids__amount'), # Was bids_made__amount
        avg_rating=Avg('reviews_received__overall_rating', filter=Q(reviews_received__reviewer=employer))
    ).order_by('-earnings')[:5] # Get top 5

    top_workers_data = [
        {
            'name': w.get_full_name(), # This is correct based on your User model
            'jobs': w.jobs,
            'rating': w.avg_rating or 0,
            'earnings': w.earnings
        }
        for w in top_workers_query
    ]

    # 6. Get Completion Rates Data
    # (This section is unchanged, it only queries the Job model)
    all_jobs_in_period = Job.objects.filter(
        employer=employer,
        posted_date__date__range=[current_start, current_end]
    )
    total_jobs = all_jobs_in_period.count()
    status_counts = all_jobs_in_period.values('status').annotate(count=Count('id'))

    status_map = {s['status']: s['count'] for s in status_counts}
    
    completed_pct = (status_map.get('completed', 0) / total_jobs) * 100 if total_jobs > 0 else 0
    in_progress_pct = ((status_map.get('in_progress', 0) + status_map.get('open', 0)) / total_jobs) * 100 if total_jobs > 0 else 0
    cancelled_pct = (status_map.get('cancelled', 0) / total_jobs) * 100 if total_jobs > 0 else 0

    completion_rates_data = [
        {'status': 'Completed', 'value': completed_pct, 'color': '#2e7d32'}, # success.main
        {'status': 'In Progress / Open', 'value': in_progress_pct, 'color': '#0288d1'}, # info.main
        {'status': 'Cancelled', 'value': cancelled_pct, 'color': '#d32f2f'}, # error.main
    ]

    # 7. Get Bid Analytics Data
    # (This section is unchanged, it queries Job and counts related 'bids')
    bid_bin_ranges = Case(
        When(bid_count__lte=5, then=Value('0-5')),
        When(bid_count__lte=10, then=Value('6-10')),
        When(bid_count__lte=15, then=Value('11-15')),
        When(bid_count__lte=20, then=Value('16-20')),
        default=Value('20+'),
        output_field=CharField()
    )
    
    binned_data = Job.objects.filter(
        employer=employer,
        posted_date__date__range=[current_start, current_end]
    ).annotate(
        bid_count=Count('bids') # 'bids' is the correct related_name from Bid.job
    ).annotate(
        range=bid_bin_ranges
    ).values('range').annotate(
        count=Count('id')
    ).order_by('range') 

    bid_analytics_data = list(binned_data)
    sorter = ['0-5', '6-10', '11-15', '16-20', '20+']
    bid_analytics_data.sort(key=lambda x: sorter.index(x['range']) if x['range'] in sorter else 99)

    # --- Final Data Assembly ---
    data = {
        'overview': overview_data,
        'jobsOverTime': jobs_over_time_data,
        'costsByCategory': costs_by_category_data,
        'topWorkers': top_workers_data,
        'completionRates': completion_rates_data,
        'bidAnalytics': bid_analytics_data,
    }

    return Response(data, status=status.HTTP_200_OK)