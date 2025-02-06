from django.http import JsonResponse
from django.shortcuts import render,redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import json
from rest_framework import viewsets
import requests
from bs4 import BeautifulSoup as bs
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .serializers import *
from rest_framework import generics
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
import uuid
# Create your views here.
domain="http://192.168.106.208:3000"
def home(r):
    return render(r,'home.html')
def sendMail(subject,message,email):
    send_mail(subject,message,'chart@gmail.com',email,fail_silently=False)

class SignupView(APIView):
    def post(self,r):
        serializer = UserSerializer(data=r.data)
        if serializer.is_valid():
            user=serializer.save()
            token=uuid.uuid4()
            Verification(user=user,token=token).save()
            sendMail("Email Verification",f'Dear {user.username} click below link to verify your email\n{domain}/verifyemail/{token}',[user.email])
            # token,created=Token.objects.get_or_create(user=user)
            return Response({"status":True},status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
class VerificationView(APIView):
    def post(self,r):
        serializer=FCMSerializer(data=r.data)
        if serializer.is_valid():
            try:
                obj=Verification.objects.get(token=serializer.data["token"])
                if obj.is_verified:
                    return Response({"error":"Email already verified"},status=status.HTTP_400_BAD_REQUEST)
                obj.is_verified=True
                obj.save()
                return Response({"status":True},status=status.HTTP_200_OK)
            except:
                return Response({"error":"Invalid link"},status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self,r):
        serializer = LoginSerializer(data=r.data)
        if serializer.is_valid():
            try:
                user=User.objects.get(email=serializer.data["email"].lower())
                user=authenticate(username=user.username,password=serializer.data['password'])
                if user is not None:
                    if Verification.objects.filter(user=user,is_verified=True):
                        token,created=Token.objects.get_or_create(user=user)
                        return Response({"token":token.key,"created":created,"status":True},status=status.HTTP_200_OK)
                    else:
                        return  Response({"error":"Email not verified"},status=status.HTTP_400_BAD_REQUEST)
                return  Response({"error":"Invalid Credentials"},status=status.HTTP_400_BAD_REQUEST)
            except:
                return Response({"error":"User not found with this email"},status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
class SignOutView(APIView):
    authentication_classes=[TokenAuthentication]
    def get(self,r):
        try:
            Token.objects.get(key=r.auth).delete()
            return Response({"status":True},status=status.HTTP_200_OK)
        except:
            return Response({"status":False,"error":"Failed to logout"},status=status.HTTP_400_BAD_REQUEST)
class ForgotView(APIView):
    def post(self,r):
        serializer=ForgotSerializer(data=r.data)
        if serializer.is_valid():
            try:
                user=User.objects.get(email=serializer.data["email"])
                ForgotPassword.objects.filter(user=user).delete()
                token=uuid.uuid4()
                sendMail("Password Reset",f"Dear {user.username} click below link to reset password\n{domain}/resetpassword/{token}",[user.email])
                ForgotPassword(user=user,token=token).save()
                return Response({"status":True},status=status.HTTP_200_OK)
            except:
                return Response({"error":"User not found with this email"},status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        
class ResetView(APIView):
    def post(self,r):
        serializer=ResetSerializer(data=r.data)
        if serializer.is_valid():
            if len(serializer.data["password"])<8:
                return Response({"error":"Password must be greater or equal to 8 characters"},status=status.HTTP_400_BAD_REQUEST)
            try:
                if ForgotPassword.objects.filter(token=serializer.data["token"]).exists():
                    obj=ForgotPassword.objects.get(token=serializer.data["token"])
                    if timezone.now()<=obj.expire_date:
                        user=User.objects.get(username=obj.user.username)
                        user.set_password(serializer.data["password"])
                        user.save()
                        obj.delete()
                        sendMail("Password Reset",f"Dear {user.username} your password reset successful",[user.email])
                        return Response({"status":True},status=status.HTTP_200_OK)
                    else:
                        return Response({"error":"Link has been expired"},status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error":"Invalid link"},status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"error":"Failed to reset password "},status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)



class ContactView(APIView):
    authentication_classes=[TokenAuthentication]
    def post(self,r):
        serializer=ContactSerializer(data=r.data)
        if serializer.is_valid():
            # serializer.save()
            Contact(subject=serializer.data["subject"],message=serializer.data["message"],user=r.auth.user).save()
            return Response({"status":True},status=status.HTTP_200_OK)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
# class SaveChartView(viewsets.ModelViewSet):
#     serializer_class = ChartSerializer
#     authentication_classes = [TokenAuthentication]
#     def get_queryset(self):
#         return ChartModel.objects.filter(user=self.request.user).order_by("-id")
#     def create(self, request):
#         serializer = ChartSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save(user=request.user)
#             return Response({"status":True},status=status.HTTP_200_OK)
#         else:
#             print(serializer.errors)
#         return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
from rest_framework.decorators import action
from PIL import Image
import io
class SaveChartView(viewsets.ModelViewSet):
    serializer_class = ChartSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return ChartModel.objects.filter(user=self.request.user).order_by("-id")

    @action(detail=True, methods=['POST'])
    def toggle_dashboard(self, request, pk=None):
        chart = self.get_object()
        chart.is_in_dashboard = not chart.is_in_dashboard
        chart.save()
        return Response({'status': True, 'is_in_dashboard': chart.is_in_dashboard})

    @action(detail=False, methods=['POST'])
    def create_collage(self, request):
        dashboard_charts = self.get_queryset().filter(is_in_dashboard=True)
        if not dashboard_charts:
            return Response({'error': 'No charts in dashboard'}, status=status.HTTP_400_BAD_REQUEST)

        # Create collage
        images = []
        max_width = 0
        total_height = 0
        
        for chart in dashboard_charts:
            img = Image.open(chart.chart.path)
            # Standardize width to 800px while maintaining aspect ratio
            ratio = 800 / img.width
            new_size = (800, int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
            images.append(img)
            total_height += img.height

        # Create new image
        collage = Image.new('RGB', (800, total_height), 'white')
        y_offset = 0
        
        for img in images:
            collage.paste(img, (0, y_offset))
            y_offset += img.height

        # Save collage
        collage_io = io.BytesIO()
        collage.save(collage_io, format='PNG')
        
        return Response({
            'collage': collage_io.getvalue(),
        }, status=status.HTTP_200_OK)

    def create(self, request):
        serializer = ChartSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"status": True}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
import google.generativeai as genai
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
os.environ['API_KEY'] = 'AIzaSyBnbsdp224poDXOXdez2YSrsnbKT08yluQ'  # Replace with your actual API key
genai.configure(api_key=os.environ['API_KEY'])

class GenerateInsightsView(APIView):
    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Save the file temporarily
            file_path = default_storage.save(f"media/{file.name}", ContentFile(file.read()))
            full_file_path = default_storage.path(file_path)

            # Analyze CSV with Gemini
            insights = self.analyze_csv_with_gemini(full_file_path)

            return Response({"insights": insights}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def analyze_csv_with_gemini(self, file_path):
        try:
            # Upload the CSV file to Gemini
            csv_file = genai.upload_file(file_path, mime_type="text/csv")

            # Create a Gemini model instance
            model = genai.GenerativeModel("gemini-1.5-flash")

            # Define the prompt (using a simpler format without markdown)
            prompt = """
            Analyze the provided CSV file and give me 15 important insights in bullet points. 

            Focus on:

            * Top Performers: Highlight the top-performing categories, regions, or products based on key metrics.
            * Significant Contributors:  Identify categories, regions, or products that contribute substantially to the overall results.
            * Overall Trends: Describe any major trends or patterns in the data.

            Keep the insights concise and to the point, focusing on the most important findings.
            """

            # Generate insights using Gemini
            response = model.generate_content([csv_file, prompt])

            # Process the response to remove extra characters and format nicely
            insights_text = response.text.replace("**", "").replace("#", "")  
            insights_list = insights_text.split("\n")  # Split into a list of insights
            formatted_insights = "\n".join(insights_list)  # Rejoin with proper line breaks

            return formatted_insights

        except Exception as e:
            return f"Error analyzing CSV file: {e}"
import pandas as pd
from sklearn.impute import KNNImputer
from scipy.stats import zscore
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def upload_file(request):
    if request.method == 'POST' and request.FILES['file']:
        file = request.FILES['file']
        df = pd.read_csv(file)

        # Remove duplicates
        df = df.drop_duplicates()

        # Fill null values
        for col in df.columns:
            null_percentage = df[col].isnull().sum() / len(df)
            if null_percentage < 0.4:
                if df[col].dtype == 'object':
                    # Use mode for categorical columns
                    mode_value = df[col].mode()[0]
                    df[col] = df[col].fillna(mode_value)
                else:
                    # Use median for numerical columns
                    median_value = df[col].median()
                    df[col] = df[col].fillna(median_value)
            else:
                # Use KNN Imputer for columns with more than 40% null values
                imputer = KNNImputer(n_neighbors=5)
                df[col] = imputer.fit_transform(df[[col]]).ravel()

        # Handle outliers using z-score
        for col in df.select_dtypes(include=['float64', 'int64']).columns:
            z_scores = zscore(df[col])
            df = df[(z_scores < 3)]

        # Convert DataFrame to JSON
        result = df.to_json(orient='split')
        return JsonResponse(json.loads(result), safe=False)

    return JsonResponse({'error': 'Invalid request'}, status=400)