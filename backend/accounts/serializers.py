from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Teacher

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ('id', 'email', 'username')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Teacher
        fields = ('id', 'email', 'username', 'password')
    
    def create(self, validated_data):
        teacher = Teacher.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return teacher

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        teacher = authenticate(**data)
        if teacher and teacher.is_active:
            return teacher
        raise serializers.ValidationError("Incorrect Credentials")