from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from .review_views import *
from .availability_views import AvailabilityViewSet

router = DefaultRouter()
router.register(r'availability', AvailabilityViewSet, basename='availability')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Existing URLs...
    path('categories/', JobCategoryListView.as_view(), name='job-categories'),
    path('skills/', SkillListView.as_view(), name='skills'),
    path('templates/', JobTemplateListView.as_view(), name='job-templates'),
    path('jobs/', JobListView.as_view(), name='job-list'),
    path('jobs/create/', JobCreateView.as_view(), name='job-create'),
    path('jobs/my-jobs/', MyJobsView.as_view(), name='my-jobs'),
    path('jobs/<uuid:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('jobs/<uuid:job_id>/bids/', BidListView.as_view(), name='bid-list'),
    path('jobs/<uuid:job_id>/bids/create/', BidCreateView.as_view(), name='bid-create'),
    path('bids/<uuid:pk>/', BidUpdateView.as_view(), name='bid-update'),
    path('jobs/<uuid:job_id>/bids/<uuid:bid_id>/accept/', AcceptBidView.as_view(), name='accept-bid'),
    path('jobs/<uuid:job_id>/save/', SaveJobView.as_view(), name='save-job'),
    path('saved-jobs/', SavedJobsListView.as_view(), name='saved-jobs'),
    path('jobs/<uuid:job_id>/review/', ReviewCreateView.as_view(), name='create-review'),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    
    # Review URLs
    path('reviews/received/', ReceivedReviewsView.as_view(), name='received-reviews'),
    path('reviews/given/', GivenReviewsView.as_view(), name='given-reviews'),
    path('reviews/stats/', review_stats, name='review-stats'),
    path('reviews/pending/', pending_reviews, name='pending-reviews'),
]