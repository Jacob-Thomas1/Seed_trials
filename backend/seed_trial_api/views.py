from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Seed, Plot, TrialObservation, Incident, UserProfile
from .serializers import (
    SeedSerializer, PlotSerializer, TrialObservationSerializer,
    IncidentSerializer, UserProfileSerializer
)
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from datetime import timedelta

class SeedViewSet(viewsets.ModelViewSet):
    queryset = Seed.objects.all()
    serializer_class = SeedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Seed.objects.all()
        
        # Search by crop name
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(crop_name__icontains=search_query)
        
        # Filter by soil type if provided
        soil_type = self.request.query_params.get('soil_type', None)
        if soil_type:
            queryset = queryset.filter(soil_type=soil_type)
        
        # Filter by moisture level if provided
        moisture = self.request.query_params.get('moisture_needed', None)
        if moisture:
            queryset = queryset.filter(moisture_needed=moisture)
        
        return queryset

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search seeds by crop name"""
        search_query = request.query_params.get('q', '')
        if not search_query:
            return Response({'error': 'Please provide a search query'}, status=status.HTTP_400_BAD_REQUEST)
        
        seeds = self.get_queryset().filter(crop_name__icontains=search_query)
        serializer = self.get_serializer(seeds, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def trials(self, request, pk=None):
        """Get all trials for a specific seed"""
        seed = self.get_object()
        trials = TrialObservation.objects.filter(seed=seed)
        serializer = TrialObservationSerializer(trials, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Get performance metrics for a seed"""
        seed = self.get_object()
        trials = TrialObservation.objects.filter(seed=seed)
        
        # Calculate average health score
        avg_health = trials.aggregate(avg_health=Avg('growth_parameters__health_score'))['avg_health'] or 0
        
        # Count incidents
        incident_count = Incident.objects.filter(trial__seed=seed).count()
        
        # Calculate success rate (trials with health score > 7)
        success_count = trials.filter(growth_parameters__health_score__gt=7).count()
        total_trials = trials.count()
        success_rate = (success_count / total_trials * 100) if total_trials > 0 else 0
        
        return Response({
            'average_health_score': avg_health,
            'incident_count': incident_count,
            'success_rate': success_rate,
            'total_trials': total_trials
        })

class PlotViewSet(viewsets.ModelViewSet):
    queryset = Plot.objects.all()
    serializer_class = PlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Plot.objects.all()
        
        # Search by location or plot type
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(location__icontains=search_query) |
                Q(plot_type__icontains=search_query)
            )
        
        # Filter by weather zone if provided
        weather_zone = self.request.query_params.get('weather_zone', None)
        if weather_zone:
            queryset = queryset.filter(weather_zone=weather_zone)
        
        # Filter by soil type if provided
        soil_type = self.request.query_params.get('soil_type', None)
        if soil_type:
            queryset = queryset.filter(soil_type=soil_type)
        
        return queryset

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search plots by location or plot type"""
        search_query = request.query_params.get('q', '')
        if not search_query:
            return Response({'error': 'Please provide a search query'}, status=status.HTTP_400_BAD_REQUEST)
        
        plots = self.get_queryset().filter(
            Q(location__icontains=search_query) |
            Q(plot_type__icontains=search_query)
        )
        serializer = self.get_serializer(plots, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def active_trials(self, request, pk=None):
        """Get active trials in a plot"""
        plot = self.get_object()
        thirty_days_ago = timezone.now() - timedelta(days=30)
        trials = TrialObservation.objects.filter(
            plot=plot,
            collection_date__gte=thirty_days_ago
        )
        serializer = TrialObservationSerializer(trials, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def incidents(self, request, pk=None):
        """Get all incidents in a plot"""
        plot = self.get_object()
        incidents = Incident.objects.filter(trial__plot=plot)
        serializer = IncidentSerializer(incidents, many=True)
        return Response(serializer.data)

class TrialObservationViewSet(viewsets.ModelViewSet):
    queryset = TrialObservation.objects.all()
    serializer_class = TrialObservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TrialObservation.objects.all()
        
        # Search by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(collection_date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(collection_date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(collection_date__lte=end_date)
        
        # Search by specific date
        specific_date = self.request.query_params.get('date', None)
        if specific_date:
            queryset = queryset.filter(collection_date__date=specific_date)
        
        # Search by plot
        plot_id = self.request.query_params.get('plot_id', None)
        if plot_id:
            queryset = queryset.filter(plot__plot_id=plot_id)
        
        # Search by plot location
        plot_location = self.request.query_params.get('plot_location', None)
        if plot_location:
            queryset = queryset.filter(plot__location__icontains=plot_location)
        
        # Search by crop name
        crop_name = self.request.query_params.get('crop_name', None)
        if crop_name:
            queryset = queryset.filter(seed__crop_name__icontains=crop_name)
        
        # Search by collector
        collector = self.request.query_params.get('collector', None)
        if collector:
            queryset = queryset.filter(collector__username__icontains=collector)
        
        return queryset

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for trials with multiple criteria"""
        queryset = self.get_queryset()
        
        # Get all search parameters
        params = {
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'date': request.query_params.get('date'),
            'plot_id': request.query_params.get('plot_id'),
            'plot_location': request.query_params.get('plot_location'),
            'crop_name': request.query_params.get('crop_name'),
            'collector': request.query_params.get('collector')
        }
        
        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        
        if not params:
            return Response(
                {'error': 'Please provide at least one search criterion'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary of trials based on search criteria"""
        queryset = self.get_queryset()
        
        # Get date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Calculate statistics
        total_trials = queryset.count()
        
        # Count trials by crop
        trials_by_crop = queryset.values('seed__crop_name').annotate(
            count=Count('id')
        )
        
        # Count trials by plot
        trials_by_plot = queryset.values('plot__location').annotate(
            count=Count('id')
        )
        
        # Get recent trials (last 7 days)
        recent_trials = queryset.filter(
            collection_date__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # Get trials by collector
        trials_by_collector = queryset.values('collector__username').annotate(
            count=Count('id')
        )
        
        return Response({
            'total_trials': total_trials,
            'trials_by_crop': trials_by_crop,
            'trials_by_plot': trials_by_plot,
            'trials_by_collector': trials_by_collector,
            'recent_trials': recent_trials,
            'date_range': {
                'start_date': start_date,
                'end_date': end_date
            } if start_date and end_date else None
        })

    @action(detail=True, methods=['get'])
    def incidents(self, request, pk=None):
        """Get all incidents for a trial"""
        trial = self.get_object()
        incidents = Incident.objects.filter(trial=trial)
        serializer = IncidentSerializer(incidents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_incident(self, request, pk=None):
        """Add an incident to a trial"""
        trial = self.get_object()
        serializer = IncidentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(trial=trial, created_by=request.user, updated_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Incident.objects.all()
        # Filter by incident type if provided
        incident_type = self.request.query_params.get('type', None)
        if incident_type:
            queryset = queryset.filter(incident_type=incident_type)
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(date_time__range=[start_date, end_date])
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary of incidents"""
        # Count incidents by type
        type_counts = Incident.objects.values('incident_type').annotate(count=Count('id'))
        
        # Get recent incidents (last 7 days)
        recent_incidents = Incident.objects.filter(
            date_time__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # Get high severity incidents
        high_severity = Incident.objects.filter(
            Q(incident_type='WEATHER') & Q(description__icontains='severe')
        ).count()
        
        return Response({
            'incidents_by_type': type_counts,
            'recent_incidents': recent_incidents,
            'high_severity_incidents': high_severity
        })

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = UserProfile.objects.all()
        # Filter by role if provided
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    @action(detail=True, methods=['get'])
    def trials(self, request, pk=None):
        """Get all trials conducted by a user"""
        profile = self.get_object()
        trials = TrialObservation.objects.filter(collector=profile.user)
        serializer = TrialObservationSerializer(trials, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def incidents(self, request, pk=None):
        """Get all incidents reported by a user"""
        profile = self.get_object()
        incidents = Incident.objects.filter(reported_by=profile.user)
        serializer = IncidentSerializer(incidents, many=True)
        return Response(serializer.data)
