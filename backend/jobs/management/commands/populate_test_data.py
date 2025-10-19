from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from jobs.models import JobCategory, Skill, Job, JobTemplate
from datetime import datetime, timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Populates the database with test data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating test data...')
        
        # Create categories
        categories_data = [
            ('home', 'Home', 'home', 'Home services and maintenance'),
            ('errands', 'Errands & Delivery', 'directions_run', 'Errands and delivery services'),
            ('events', 'Events', 'celebration', 'Event setup and management'),
            ('petcare', 'Pet Care', 'pets', 'Pet care services'),
            ('office', 'Office/Retail', 'business', 'Office and retail help'),
        ]
        
        categories = {}
        for name, display_name, icon, description in categories_data:
            category, created = JobCategory.objects.get_or_create(
                name=name,
                defaults={
                    'display_name': display_name,
                    'icon': icon,
                    'description': description
                }
            )
            categories[name] = category
            if created:
                self.stdout.write(f'Created category: {display_name}')
        
        # Create skills
        skills_data = [
            ('Cleaning', 'home'),
            ('Gardening', 'home'),
            ('Moving', 'home'),
            ('Painting', 'home'),
            ('Assembly', 'home'),
            ('Shopping', 'errands'),
            ('Delivery', 'errands'),
            ('Line Standing', 'errands'),
            ('Event Setup', 'events'),
            ('Catering Help', 'events'),
            ('Dog Walking', 'petcare'),
            ('Pet Sitting', 'petcare'),
            ('Data Entry', 'office'),
            ('Filing', 'office'),
            ('Inventory', 'office'),
        ]
        
        skills = []
        for skill_name, category_name in skills_data:
            skill, created = Skill.objects.get_or_create(
                name=skill_name,
                defaults={'category': categories.get(category_name)}
            )
            skills.append(skill)
            if created:
                self.stdout.write(f'Created skill: {skill_name}')
        
        # Get or create test users
        employer, created = User.objects.get_or_create(
            email='employer@test.com',
            defaults={
                'first_name': 'John',
                'last_name': 'Employer',
                'account_type': 'employer',
                'phone': '555-0001',
                'company_name': 'Test Company Inc.',
                'is_verified': True,
                'rating': 4.5,
                'total_reviews': 12,
            }
        )
        if created:
            employer.set_password('password123')
            employer.save()
            self.stdout.write('Created test employer')
        
        jobseeker, created = User.objects.get_or_create(
            email='jobseeker@test.com',
            defaults={
                'first_name': 'Jane',
                'last_name': 'Worker',
                'account_type': 'jobseeker',
                'phone': '555-0002',
                'rating': 4.8,
                'total_reviews': 25,
                'hourly_rate': 25.00,
            }
        )
        if created:
            jobseeker.set_password('password123')
            jobseeker.save()
            self.stdout.write('Created test job seeker')
        
        # Create sample jobs
        jobs_data = [
            {
                'title': 'Garden Cleanup and Landscaping',
                'description': 'Need help cleaning up my backyard garden. Tasks include weeding, trimming bushes, mowing the lawn, and general landscaping work. All tools will be provided. Looking for someone with gardening experience.',
                'category': 'home',
                'urgency': 'medium',
                'budget_min': 100,
                'budget_max': 200,
                'instant_hire_price': 250,
                'location': 'San Francisco',
                'skills': ['Gardening'],
            },
            {
                'title': 'Move Heavy Furniture - 2 Bedroom Apartment',
                'description': 'Moving from a 2nd floor apartment to a new place. Need 2-3 strong people to help move furniture including sofas, beds, dressers, and boxes. Truck is already rented. Should take about 4-5 hours.',
                'category': 'home',
                'urgency': 'urgent',
                'budget_min': 200,
                'budget_max': 400,
                'instant_hire_price': 500,
                'location': 'Los Angeles',
                'skills': ['Moving'],
            },
            {
                'title': 'Event Setup for Corporate Party',
                'description': 'Need help setting up for a corporate event. Tasks include arranging tables and chairs, decorating, setting up AV equipment, and general event preparation. Event is for 100 people.',
                'category': 'events',
                'urgency': 'high',
                'budget_min': 150,
                'budget_max': 300,
                'instant_hire_price': 350,
                'location': 'New York',
                'skills': ['Event Setup'],
            },
            {
                'title': 'Dog Walking - Daily for 2 Weeks',
                'description': 'Going on vacation and need someone reliable to walk my two golden retrievers daily for 2 weeks. 30-minute walks, twice a day (morning and evening). Dogs are friendly and well-behaved.',
                'category': 'petcare',
                'urgency': 'medium',
                'budget_min': 300,
                'budget_max': 500,
                'instant_hire_price': 600,
                'location': 'Seattle',
                'skills': ['Dog Walking'],
            },
            {
                'title': 'Grocery Shopping and Delivery',
                'description': 'Need someone to do weekly grocery shopping for elderly parent. Includes going to store, purchasing items from list, and delivering to apartment. Payment includes reimbursement for groceries.',
                'category': 'errands',
                'urgency': 'low',
                'budget_min': 50,
                'budget_max': 80,
                'instant_hire_price': 100,
                'location': 'Chicago',
                'skills': ['Shopping', 'Delivery'],
            },
            {
                'title': 'Office Filing and Organization',
                'description': 'Small business needs help organizing years of paperwork and setting up a filing system. Approximately 2-3 days of work. Must be detail-oriented and able to work independently.',
                'category': 'office',
                'urgency': 'low',
                'budget_min': 200,
                'budget_max': 350,
                'instant_hire_price': 400,
                'location': 'Boston',
                'skills': ['Filing', 'Data Entry'],
            },
            {
                'title': 'House Cleaning - Deep Clean',
                'description': 'Need a thorough deep cleaning of a 3-bedroom house. Including kitchen, bathrooms, bedrooms, living areas. All cleaning supplies provided. Looking for experienced cleaner with attention to detail.',
                'category': 'home',
                'urgency': 'medium',
                'budget_min': 150,
                'budget_max': 250,
                'instant_hire_price': 300,
                'location': 'Miami',
                'skills': ['Cleaning'],
            },
            {
                'title': 'Paint Interior Walls - 2 Rooms',
                'description': 'Need someone to paint two bedrooms. Walls are already prepped and paint is purchased. Just need someone with painting experience to do a professional job. Should take 1-2 days.',
                'category': 'home',
                'urgency': 'low',
                'budget_min': 200,
                'budget_max': 400,
                'instant_hire_price': 450,
                'location': 'Denver',
                'skills': ['Painting'],
            },
        ]
        
        cities = ['San Francisco', 'Los Angeles', 'New York', 'Seattle', 'Chicago', 'Boston', 'Miami', 'Denver']
        states = ['CA', 'CA', 'NY', 'WA', 'IL', 'MA', 'FL', 'CO']
        
        for i, job_data in enumerate(jobs_data):
            # Check if job already exists
            existing_job = Job.objects.filter(
                title=job_data['title'],
                employer=employer
            ).first()
            
            if not existing_job:
                job_skills = [s for s in skills if s.name in job_data['skills']]
                
                job = Job.objects.create(
                    employer=employer,
                    title=job_data['title'],
                    description=job_data['description'],
                    category=categories[job_data['category']],
                    location_type='onsite',
                    address=f'{random.randint(100, 9999)} Main Street',
                    city=cities[i % len(cities)],
                    state=states[i % len(states)],
                    zip_code=f'{random.randint(10000, 99999)}',
                    start_date=datetime.now().date() + timedelta(days=random.randint(3, 30)),
                    estimated_duration=random.randint(60, 480),
                    is_flexible=random.choice([True, False]),
                    urgency=job_data['urgency'],
                    budget_min=job_data['budget_min'],
                    budget_max=job_data['budget_max'],
                    instant_hire_price=job_data['instant_hire_price'],
                    number_of_workers=random.randint(1, 3),
                    tools_provided=True,
                    physical_requirements=random.choice(['light', 'moderate', 'heavy']),
                    status='open',  # Important: Set status to 'open'
                    auto_match_enabled=random.choice([True, False]),
                )
                job.skills_required.set(job_skills)
                self.stdout.write(f'Created job: {job.title}')
        
        self.stdout.write(self.style.SUCCESS('Successfully populated test data!'))
        self.stdout.write('Test accounts:')
        self.stdout.write('  Employer: employer@mailinator.com / shijinshj2222!')
        self.stdout.write('  Job Seeker: jobseeker@mailinator.com / shijinshj2222!')