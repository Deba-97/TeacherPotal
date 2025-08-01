from django.urls import path
from .views import index_view, StudentListView, StudentDetailView, StudentBulkUpdateView

urlpatterns = [
    path('', index_view, name='index'),
    path('students/', StudentListView.as_view(), name='student-list'),
    path('students/<int:pk>/', StudentDetailView.as_view(), name='student-detail'),
    path('students/bulk-update/', StudentBulkUpdateView.as_view(), name='student-bulk-update'),
]