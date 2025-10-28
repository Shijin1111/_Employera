from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Min, Avg
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