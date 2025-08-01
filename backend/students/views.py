from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Student
from .serializers import StudentSerializer, StudentCreateUpdateSerializer
from django.shortcuts import render


def index_view(request):
    return render(request, 'index.html')

class StudentListView(generics.ListCreateAPIView):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Student.objects.filter(teacher=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentCreateUpdateSerializer
        return StudentSerializer
    
    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Student.objects.filter(teacher=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return StudentCreateUpdateSerializer
        return StudentSerializer
    
    def perform_update(self, serializer):
        serializer.save(teacher=self.request.user)

class StudentBulkUpdateView(generics.GenericAPIView):
    serializer_class = StudentCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        name = request.data.get('name')
        subject = request.data.get('subject')
        marks = request.data.get('marks')
        
        try:
            student = Student.objects.get(
                teacher=request.user,
                name=name,
                subject=subject
            )
            student.marks += float(marks)
            student.save()
            return Response(StudentSerializer(student).data)
        except Student.DoesNotExist:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(teacher=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)