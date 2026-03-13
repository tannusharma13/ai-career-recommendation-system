"""Career Roadmap routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.db import find_one, upsert_one

roadmap_bp = Blueprint('roadmap', __name__)

ROADMAPS = {
    "Software Engineer": {
        "total_duration": "12-18 months",
        "phases": [
            {
                "id": "phase1", "title": "Foundations", "duration": "3 months",
                "milestones": [
                    {"id": "m1", "title": "Learn Python Basics", "description": "Variables, loops, functions, OOP", "resources": ["Python.org Tutorial", "Automate the Boring Stuff"], "est_hours": 40},
                    {"id": "m2", "title": "Data Structures & Algorithms", "description": "Arrays, linked lists, trees, sorting", "resources": ["LeetCode", "CS50"], "est_hours": 60},
                    {"id": "m3", "title": "Version Control with Git", "description": "Git commands, branching, GitHub", "resources": ["GitHub Docs", "Pro Git Book"], "est_hours": 20}
                ]
            },
            {
                "id": "phase2", "title": "Web Development", "duration": "4 months",
                "milestones": [
                    {"id": "m4", "title": "HTML/CSS/JavaScript", "description": "Frontend fundamentals", "resources": ["MDN Web Docs", "freeCodeCamp"], "est_hours": 60},
                    {"id": "m5", "title": "React Framework", "description": "Components, hooks, state management", "resources": ["React Docs", "Scrimba"], "est_hours": 50},
                    {"id": "m6", "title": "Backend Development", "description": "REST APIs, databases, Node.js/Django", "resources": ["Node.js Docs", "Django Project"], "est_hours": 70}
                ]
            },
            {
                "id": "phase3", "title": "Advanced Skills", "duration": "3 months",
                "milestones": [
                    {"id": "m7", "title": "System Design", "description": "Scalability, microservices, databases", "resources": ["Designing Data-Intensive Apps", "System Design Primer"], "est_hours": 50},
                    {"id": "m8", "title": "Cloud & DevOps", "description": "AWS/GCP, Docker, CI/CD", "resources": ["AWS Free Tier", "Docker Docs"], "est_hours": 40},
                    {"id": "m9", "title": "Build Portfolio Projects", "description": "3-5 real-world projects", "resources": ["GitHub", "Personal Portfolio"], "est_hours": 80}
                ]
            },
            {
                "id": "phase4", "title": "Job Ready", "duration": "2 months",
                "milestones": [
                    {"id": "m10", "title": "LeetCode Practice", "description": "100+ problems, mock interviews", "resources": ["LeetCode", "Pramp"], "est_hours": 60},
                    {"id": "m11", "title": "Resume & LinkedIn", "description": "ATS-optimized resume, LinkedIn profile", "resources": ["LinkedIn", "Resume.io"], "est_hours": 10},
                    {"id": "m12", "title": "Apply & Interview", "description": "Apply to 50+ jobs, interview prep", "resources": ["LinkedIn Jobs", "Glassdoor", "AngelList"], "est_hours": 30}
                ]
            }
        ]
    },
    "Data Scientist": {
        "total_duration": "12-18 months",
        "phases": [
            {
                "id": "phase1", "title": "Math & Programming Foundations", "duration": "3 months",
                "milestones": [
                    {"id": "m1", "title": "Python for Data Science", "description": "NumPy, Pandas, Matplotlib", "resources": ["Kaggle Learn", "DataCamp"], "est_hours": 50},
                    {"id": "m2", "title": "Statistics & Probability", "description": "Descriptive stats, probability, distributions", "resources": ["Khan Academy", "Think Stats"], "est_hours": 50},
                    {"id": "m3", "title": "Linear Algebra & Calculus", "description": "Matrices, derivatives for ML", "resources": ["3Blue1Brown", "MIT OpenCourseWare"], "est_hours": 40}
                ]
            },
            {
                "id": "phase2", "title": "Machine Learning", "duration": "4 months",
                "milestones": [
                    {"id": "m4", "title": "Classical ML Algorithms", "description": "Regression, classification, clustering", "resources": ["Scikit-learn", "Andrew Ng's Course"], "est_hours": 70},
                    {"id": "m5", "title": "Deep Learning", "description": "Neural networks, CNNs, RNNs", "resources": ["Fast.ai", "TensorFlow", "PyTorch"], "est_hours": 80},
                    {"id": "m6", "title": "Feature Engineering & EDA", "description": "Data preprocessing, visualization", "resources": ["Kaggle", "Towards Data Science"], "est_hours": 40}
                ]
            },
            {
                "id": "phase3", "title": "Specialization & Tools", "duration": "3 months",
                "milestones": [
                    {"id": "m7", "title": "SQL & Big Data", "description": "SQL, Spark, data warehouses", "resources": ["Mode Analytics", "Databricks"], "est_hours": 40},
                    {"id": "m8", "title": "MLOps & Deployment", "description": "Model deployment, monitoring, pipelines", "resources": ["MLflow", "Kubeflow"], "est_hours": 40},
                    {"id": "m9", "title": "Kaggle Competitions", "description": "3+ competitions to build portfolio", "resources": ["Kaggle"], "est_hours": 80}
                ]
            },
            {
                "id": "phase4", "title": "Career Launch", "duration": "2 months",
                "milestones": [
                    {"id": "m10", "title": "Build Data Portfolio", "description": "GitHub projects, Kaggle notebooks", "resources": ["GitHub", "Kaggle"], "est_hours": 40},
                    {"id": "m11", "title": "Data Science Interviews", "description": "SQL tests, case studies, stats questions", "resources": ["StrataScratch", "InterviewQuery"], "est_hours": 50},
                    {"id": "m12", "title": "Apply to Jobs", "description": "Target data roles at tech companies", "resources": ["LinkedIn", "Indeed", "Levels.fyi"], "est_hours": 20}
                ]
            }
        ]
    },
    "UX Designer": {
        "total_duration": "9-12 months",
        "phases": [
            {
                "id": "phase1", "title": "Design Foundations", "duration": "2 months",
                "milestones": [
                    {"id": "m1", "title": "Design Principles", "description": "Color, typography, layout, visual hierarchy", "resources": ["Refactoring UI", "Canva Design School"], "est_hours": 30},
                    {"id": "m2", "title": "Learn Figma", "description": "UI design tool mastery", "resources": ["Figma YouTube", "Design+Code"], "est_hours": 40},
                    {"id": "m3", "title": "UX Fundamentals", "description": "User research, personas, user journeys", "resources": ["Nielsen Norman Group", "Interaction Design Foundation"], "est_hours": 30}
                ]
            },
            {
                "id": "phase2", "title": "Core UX Skills", "duration": "3 months",
                "milestones": [
                    {"id": "m4", "title": "User Research Methods", "description": "Interviews, usability testing, surveys", "resources": ["Just Enough Research", "UX Research Field Guide"], "est_hours": 40},
                    {"id": "m5", "title": "Wireframing & Prototyping", "description": "Low/high fidelity prototypes", "resources": ["Figma", "InVision"], "est_hours": 50},
                    {"id": "m6", "title": "Information Architecture", "description": "Site maps, navigation, card sorting", "resources": ["IA for the Web", "Optimal Workshop"], "est_hours": 30}
                ]
            },
            {
                "id": "phase3", "title": "Advanced & Specialization", "duration": "3 months",
                "milestones": [
                    {"id": "m7", "title": "Design Systems", "description": "Component libraries, tokens, documentation", "resources": ["Material Design", "Carbon Design System"], "est_hours": 40},
                    {"id": "m8", "title": "Accessibility & Inclusive Design", "description": "WCAG guidelines, inclusive practices", "resources": ["WebAIM", "A11Y Project"], "est_hours": 30},
                    {"id": "m9", "title": "Portfolio Projects", "description": "3-4 end-to-end case studies", "resources": ["Behance", "Dribbble"], "est_hours": 70}
                ]
            },
            {
                "id": "phase4", "title": "Career Launch", "duration": "2 months",
                "milestones": [
                    {"id": "m10", "title": "Build UX Portfolio", "description": "Professional case studies site", "resources": ["Behance", "Webflow", "UXfolio"], "est_hours": 30},
                    {"id": "m11", "title": "UX Interviews", "description": "Portfolio presentation, design challenges", "resources": ["UX Design Interview", "Leetcode Design"], "est_hours": 30},
                    {"id": "m12", "title": "Job Search", "description": "Apply to product companies and agencies", "resources": ["LinkedIn", "Dribbble Jobs", "AIGA"], "est_hours": 20}
                ]
            }
        ]
    },
    "Marketing Manager": {
        "total_duration": "9-12 months",
        "phases": [
            {
                "id": "phase1", "title": "Marketing Fundamentals", "duration": "2 months",
                "milestones": [
                    {"id": "m1", "title": "Marketing Principles", "description": "4Ps, brand strategy, consumer behavior", "resources": ["HubSpot Academy", "Coursera Marketing"], "est_hours": 40},
                    {"id": "m2", "title": "Digital Marketing Basics", "description": "SEO, email, social media, PPC", "resources": ["Google Digital Garage", "HubSpot Blog"], "est_hours": 40},
                    {"id": "m3", "title": "Analytics Foundation", "description": "Google Analytics, metrics, KPIs", "resources": ["Google Analytics Academy", "Mode Analytics"], "est_hours": 30}
                ]
            },
            {
                "id": "phase2", "title": "Core Channels", "duration": "3 months",
                "milestones": [
                    {"id": "m4", "title": "Content Marketing", "description": "Blog writing, SEO optimization, content strategy", "resources": ["Content Marketing Institute", "Moz"], "est_hours": 50},
                    {"id": "m5", "title": "Social Media Marketing", "description": "Platform strategies, paid ads, community", "resources": ["Hootsuite Academy", "Meta Blueprint"], "est_hours": 40},
                    {"id": "m6", "title": "Email & CRM", "description": "Email campaigns, automation, lead nurturing", "resources": ["Mailchimp", "HubSpot CRM"], "est_hours": 30}
                ]
            },
            {
                "id": "phase3", "title": "Advanced Marketing", "duration": "3 months",
                "milestones": [
                    {"id": "m7", "title": "Growth Hacking", "description": "A/B testing, conversion optimization, funnels", "resources": ["GrowthHackers", "CXL Institute"], "est_hours": 40},
                    {"id": "m8", "title": "Product Marketing", "description": "Go-to-market strategy, positioning, messaging", "resources": ["Product Marketing Alliance"], "est_hours": 40},
                    {"id": "m9", "title": "Marketing Leadership", "description": "Team management, budget planning, strategy", "resources": ["Marketing Week", "CMO resources"], "est_hours": 30}
                ]
            },
            {
                "id": "phase4", "title": "Career Launch", "duration": "2 months",
                "milestones": [
                    {"id": "m10", "title": "Build Marketing Portfolio", "description": "Case studies, campaign results, metrics", "resources": ["LinkedIn", "Personal Website"], "est_hours": 20},
                    {"id": "m11", "title": "Get Certifications", "description": "Google, HubSpot, Meta certifications", "resources": ["Google", "HubSpot", "Meta Blueprint"], "est_hours": 30},
                    {"id": "m12", "title": "Job Search", "description": "Apply to brand and agency roles", "resources": ["LinkedIn", "Indeed", "MarketingHire"], "est_hours": 20}
                ]
            }
        ]
    }
}

# Default roadmap for careers without specific one
DEFAULT_ROADMAP = {
    "total_duration": "12 months",
    "phases": [
        {
            "id": "phase1", "title": "Foundational Knowledge", "duration": "3 months",
            "milestones": [
                {"id": "m1", "title": "Core Subject Mastery", "description": "Learn fundamental concepts", "resources": ["Coursera", "edX", "YouTube"], "est_hours": 60},
                {"id": "m2", "title": "Industry Overview", "description": "Understand the field landscape", "resources": ["Industry publications", "LinkedIn Learning"], "est_hours": 30},
                {"id": "m3", "title": "Key Tools & Software", "description": "Master essential tools", "resources": ["Official documentation", "Tutorials"], "est_hours": 40}
            ]
        },
        {
            "id": "phase2", "title": "Skill Development", "duration": "4 months",
            "milestones": [
                {"id": "m4", "title": "Practical Projects", "description": "Apply knowledge to real scenarios", "resources": ["Project-based learning", "GitHub"], "est_hours": 80},
                {"id": "m5", "title": "Certification & Credentials", "description": "Get relevant industry certifications", "resources": ["Professional associations", "Online courses"], "est_hours": 50},
                {"id": "m6", "title": "Networking", "description": "Build professional connections", "resources": ["LinkedIn", "Meetup", "Industry events"], "est_hours": 20}
            ]
        },
        {
            "id": "phase3", "title": "Professional Experience", "duration": "3 months",
            "milestones": [
                {"id": "m7", "title": "Internship or Freelance", "description": "Gain real-world experience", "resources": ["Internship platforms", "Freelance sites"], "est_hours": 120},
                {"id": "m8", "title": "Portfolio Building", "description": "Document your best work", "resources": ["Personal website", "Portfolio platforms"], "est_hours": 30},
                {"id": "m9", "title": "Mentorship", "description": "Find and work with a mentor", "resources": ["ADPList", "MentorCruise"], "est_hours": 20}
            ]
        },
        {
            "id": "phase4", "title": "Job Search", "duration": "2 months",
            "milestones": [
                {"id": "m10", "title": "Resume & Interview Prep", "description": "Craft ATS resume, practice interviews", "resources": ["Resume.io", "Pramp", "Glassdoor"], "est_hours": 20},
                {"id": "m11", "title": "Apply & Network", "description": "Active job applications", "resources": ["LinkedIn", "Indeed", "Company websites"], "est_hours": 40},
                {"id": "m12", "title": "Negotiate & Accept Offer", "description": "Evaluate and negotiate offers", "resources": ["Levels.fyi", "Glassdoor Salaries"], "est_hours": 10}
            ]
        }
    ]
}


@roadmap_bp.route('/get/<career>', methods=['GET'])
@jwt_required()
def get_roadmap(career):
    roadmap = ROADMAPS.get(career, DEFAULT_ROADMAP)
    return jsonify({'career': career, 'roadmap': roadmap})


@roadmap_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_progress():
    user_id = get_jwt_identity()
    progress = find_one('progress', {'user_id': user_id})
    if not progress:
        return jsonify({'completed_milestones': [], 'notes': {}})
    return jsonify({'completed_milestones': progress.get('completed_milestones', []), 'notes': progress.get('notes', {})})


@roadmap_bp.route('/progress', methods=['POST'])
@jwt_required()
def update_progress():
    user_id = get_jwt_identity()
    data = request.json
    milestone_id = data.get('milestone_id')
    completed = data.get('completed', True)
    note = data.get('note', '')

    progress = find_one('progress', {'user_id': user_id})
    completed_list = progress.get('completed_milestones', []) if progress else []
    notes = progress.get('notes', {}) if progress else {}

    if completed and milestone_id not in completed_list:
        completed_list.append(milestone_id)
    elif not completed and milestone_id in completed_list:
        completed_list.remove(milestone_id)

    if note:
        notes[milestone_id] = note

    upsert_one('progress', {'user_id': user_id}, {
        'completed_milestones': completed_list,
        'notes': notes
    })

    return jsonify({'success': True, 'completed_milestones': completed_list})
