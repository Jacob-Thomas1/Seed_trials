from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Seed, Plot, TrialObservation, Incident, UserProfile
from django.utils import timezone
import re
from datetime import datetime

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value != 'Not provided' and not re.match(r'^\+?1?\d{9,15}$', value):
            raise serializers.ValidationError("Phone number must be in valid format")
        return value

class SeedSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    trial_count = serializers.SerializerMethodField()

    class Meta:
        model = Seed
        fields = ['seed_id', 'crop_name', 'germination_characteristics', 'ideal_temperature',
                 'ideal_soil_type', 'sunlight_needed', 'moisture_needed', 'created_at',
                 'created_by', 'updated_at', 'updated_by', 'trial_count']
        read_only_fields = ('seed_id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'trial_count')

    def get_trial_count(self, obj):
        """Get count of trials for this seed"""
        return obj.trialobservation_set.count()

    def validate(self, data):
        """Validate seed data"""
        # Temperature format validation
        temp = data.get('ideal_temperature', '')
        if not re.match(r'^\d+-\d+°C$', temp):
            raise serializers.ValidationError("Temperature must be in format '20-25°C'")
        
        # Moisture level validation
        moisture = data.get('moisture_needed', '')
        valid_moisture = ['Low', 'Moderate', 'High']
        if moisture not in valid_moisture:
            raise serializers.ValidationError(f"Moisture must be one of {valid_moisture}")
        
        # Soil type validation
        soil_type = data.get('soil_type', '')
        valid_soil_types = ['Loamy soil', 'Clay soil', 'Sandy soil', 'Silt soil']
        if soil_type not in valid_soil_types:
            raise serializers.ValidationError(f"Soil type must be one of {valid_soil_types}")
        
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)

class PlotSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    active_trials = serializers.SerializerMethodField()

    class Meta:
        model = Plot
        fields = ['plot_id', 'plot_type', 'owner', 'soil_type', 'location', 'weather_zone',
                 'created_at', 'created_by', 'updated_at', 'updated_by', 'active_trials']
        read_only_fields = ('plot_id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'active_trials')

    def get_active_trials(self, obj):
        """Get count of active trials in this plot"""
        return obj.trialobservation_set.filter(collection_date__gte=timezone.now() - timezone.timedelta(days=30)).count()

    def validate(self, data):
        """Validate plot data"""
        # Location validation
        if not data.get('location', '').strip():
            raise serializers.ValidationError("Location cannot be empty")
        
        # Owner validation
        if not data.get('owner', '').strip():
            raise serializers.ValidationError("Owner cannot be empty")
        
        # Weather zone validation
        valid_zones = ['Tropical', 'Temperate', 'Arid', 'Mediterranean']
        if data.get('weather_zone') not in valid_zones:
            raise serializers.ValidationError(f"Weather zone must be one of {valid_zones}")
        
        # Soil type validation
        valid_soil_types = ['Loamy soil', 'Clay soil', 'Sandy soil', 'Silt soil']
        if data.get('soil_type') not in valid_soil_types:
            raise serializers.ValidationError(f"Soil type must be one of {valid_soil_types}")
        
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)

class TrialObservationSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    collector = UserSerializer(read_only=True)
    plot = PlotSerializer(read_only=True)
    seed = SeedSerializer(read_only=True)
    growth_summary = serializers.SerializerMethodField()
    incident_count = serializers.SerializerMethodField()

    class Meta:
        model = TrialObservation
        fields = ['trial_id', 'plot', 'seed', 'collection_date', 'growth_parameters',
                 'picture', 'collector', 'notes', 'created_at', 'created_by',
                 'updated_at', 'updated_by', 'growth_summary', 'incident_count']
        read_only_fields = ('trial_id', 'created_at', 'updated_at', 'created_by', 'updated_by', 
                          'growth_summary', 'incident_count')

    def get_growth_summary(self, obj):
        """Calculate and return growth metrics summary"""
        params = obj.growth_parameters
        heights = params.get('heights', [])
        return {
            'average_height': sum(heights) / len(heights) if heights else 0,
            'health_score': params.get('health_score', 0),
            'days_since_planting': (timezone.now() - obj.collection_date).days,
            'moisture_level': params.get('moisture_level', 'Unknown'),
            'pest_presence': params.get('pest_presence', False)
        }

    def get_incident_count(self, obj):
        """Count incidents for this trial"""
        return obj.incident_set.count()

    def validate(self, data):
        """Validate trial observation data"""
        # Growth parameters validation
        growth_params = data.get('growth_parameters', {})
        if not isinstance(growth_params, dict):
            raise serializers.ValidationError("Growth parameters must be a dictionary")
        
        required_params = ['heights', 'health_score', 'moisture_level']
        for param in required_params:
            if param not in growth_params:
                raise serializers.ValidationError(f"Growth parameters must include {param}")
        
        # Collection date validation
        collection_date = data.get('collection_date')
        if collection_date and collection_date > timezone.now():
            raise serializers.ValidationError("Collection date cannot be in the future")
        
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
            validated_data['collector'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)

class IncidentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    reported_by = UserSerializer(read_only=True)
    trial = TrialObservationSerializer(read_only=True)
    severity_level = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = ['incident_id', 'trial', 'incident_type', 'description', 'date_time',
                 'reported_by', 'created_at', 'created_by', 'updated_at', 'updated_by',
                 'severity_level']

    def get_severity_level(self, obj):
        """Calculate incident severity based on type and description"""
        if obj.incident_type == 'WEATHER':
            return 'High' if 'severe' in obj.description.lower() else 'Medium'
        return 'Low'

    def validate(self, data):
        """Validate incident data"""
        # Date validation
        date_time = data.get('date_time')
        if date_time and date_time > timezone.now():
            raise serializers.ValidationError("Incident date cannot be in the future")
        
        # Description validation
        description = data.get('description', '')
        if len(description.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long")
        
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
            validated_data['reported_by'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data) 