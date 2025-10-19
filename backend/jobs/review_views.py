from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from .models import Review, Job
from .serializers import ReviewSerializer

class ReceivedReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Review.objects.filter(reviewed_user=self.request.user).select_related(
            'reviewer', 'job'
        ).order_by('-created_at')

class GivenReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Review.objects.filter(reviewer=self.request.user).select_related(
            'reviewed_user', 'job'
        ).order_by('-created_at')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def review_stats(request):
    user = request.user
    reviews = Review.objects.filter(reviewed_user=user)
    
    stats = reviews.aggregate(
        averageRating=Avg('overall_rating'),
        totalReviews=Count('id'),
        qualityRating=Avg('quality_rating'),
        communicationRating=Avg('communication_rating'),
        punctualityRating=Avg('punctuality_rating'),
        professionalismRating=Avg('professionalism_rating'),
    )
    
    # Rating breakdown
    rating_breakdown = []
    for i in range(1, 6):
        count = reviews.filter(overall_rating__gte=i, overall_rating__lt=i+1).count()
        rating_breakdown.append(count)
    
    stats['ratingBreakdown'] = rating_breakdown
    
    # Set defaults for None values
    for key in stats:
        if stats[key] is None:
            stats[key] = 0
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_reviews(request):
    user = request.user
    
    # Get completed jobs where user hasn't reviewed yet
    if user.account_type == 'employer':
        # Employer needs to review workers
        pending_jobs = Job.objects.filter(
            employer=user,
            status='completed'
        ).exclude(
            reviews__reviewer=user
        )
    else:
        # Worker needs to review employers
        pending_jobs = Job.objects.filter(
            selected_bid__worker=user,
            status='completed'
        ).exclude(
            reviews__reviewer=user
        )
    
    # Serialize and return
    from .serializers import JobListSerializer
    serializer = JobListSerializer(pending_jobs, many=True, context={'request': request})
    return Response({'results': serializer.data})