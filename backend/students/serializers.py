from rest_framework import serializers
from .models import Student

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ('id', 'name', 'subject', 'marks', 'created_at', 'updated_at')
        read_only_fields = ('id', 'teacher', 'created_at', 'updated_at')

class StudentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ('name', 'subject', 'marks')
    
    def validate(self, data):
        teacher = self.context['request'].user
        name = data.get('name')
        subject = data.get('subject')
        
        # Exclude current instance when updating
        instance = self.instance
        if instance:
            if Student.objects.filter(teacher=teacher, name=name, subject=subject).exclude(id=instance.id).exists():
                raise serializers.ValidationError("A student with this name and subject already exists.")
        else:
            if Student.objects.filter(teacher=teacher, name=name, subject=subject).exists():
                raise serializers.ValidationError("A student with this name and subject already exists.")
        return data