from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import WorkerAvailability
from .serializers import WorkerAvailabilitySerializer

class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = WorkerAvailabilitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WorkerAvailability.objects.filter(worker=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(worker=self.request.user)