from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Min, Avg
from django.shortcuts import get_object_or_404
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

class AcceptBidView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, job_id, bid_id):
        job = get_object_or_404(Job, id=job_id)
        bid = get_object_or_404(Bid, id=bid_id, job=job)
        
        # Only employer can accept bid
        if job.employer != request.user:
            return Response(
                {'error': 'Only the employer can accept bids'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update bid status
        bid.status = 'accepted'
        bid.save()
        
        # Update job
        job.selected_bid = bid
        job.status = 'in_progress'
        job.save()
        
        # Reject other bids
        job.bids.exclude(id=bid.id).update(status='rejected')
        
        return Response({
            'message': 'Bid accepted successfully',
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics for the current user"""
    user = request.user
    
    if user.account_type == 'employer':
        stats = {
            'total_jobs_posted': Job.objects.filter(employer=user).count(),
            'active_jobs': Job.objects.filter(employer=user, status='open').count(),
            'in_progress_jobs': Job.objects.filter(employer=user, status='in_progress').count(),
            'completed_jobs': Job.objects.filter(employer=user, status='completed').count(),
            'total_spent': 0,  # Calculate from completed jobs
            'average_job_cost': 0,  # Calculate from completed jobs
        }
    else:
        stats = {
            'total_bids': Bid.objects.filter(worker=user).count(),
            'pending_bids': Bid.objects.filter(worker=user, status='pending').count(),
            'accepted_bids': Bid.objects.filter(worker=user, status='accepted').count(),
            'completed_jobs': Job.objects.filter(
                selected_bid__worker=user, 
                status='completed'
            ).count(),
            'total_earned': 0,  # Calculate from completed jobs
            'average_rating': user.rating,
            'total_reviews': user.total_reviews,
        }
    
    return Response(stats)