"""Quiz routes v3 — 12 questions, XGBoost+RF ensemble"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pickle, numpy as np
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.db import find_one, update_one

quiz_bp = Blueprint('quiz', __name__)
MODELS_DIR = Path(__file__).parent.parent / "models"

FEATURE_COLUMNS = [
    "logic_math","build_create","help_people","lead_influence",
    "explore_research","nature_outdoors","business_money","risk_ambition",
    "technical_systems","artistic_expression","social_community","structure_detail",
]

_bundle = None
_le     = None

def get_models():
    global _bundle, _le
    if _bundle is None:
        with open(MODELS_DIR / "ensemble_model.pkl", "rb") as f: _bundle = pickle.load(f)
        with open(MODELS_DIR / "label_encoder.pkl",  "rb") as f: _le     = pickle.load(f)
    return _bundle, _le

# ── 12 DISCRIMINATIVE QUESTIONS ───────────────────────────────────────────────
QUIZ_QUESTIONS = [
    {
        "id": "q1", "dimension": "logic_math", "category": "Thinking Style",
        "question": "When you face a complex problem, what comes most naturally?",
        "options": [
            {"value": 2,  "label": "Trust my gut and act quickly"},
            {"value": 5,  "label": "Talk it through with others"},
            {"value": 8,  "label": "Break it down logically, step by step"},
            {"value": 10, "label": "Build a model, equation, or data-driven framework"},
        ]
    },
    {
        "id": "q2", "dimension": "build_create", "category": "Motivation",
        "question": "Which outcome gives you the deepest sense of accomplishment?",
        "options": [
            {"value": 2,  "label": "A person I helped feels better or more capable"},
            {"value": 5,  "label": "A strategy I developed delivered results"},
            {"value": 8,  "label": "A product, design, or system I built is being used"},
            {"value": 10, "label": "Something I made exists that didn't exist before"},
        ]
    },
    {
        "id": "q3", "dimension": "help_people", "category": "Core Drive",
        "question": "What is the strongest pull when choosing where to invest your energy?",
        "options": [
            {"value": 2,  "label": "Creating wealth or building something scalable"},
            {"value": 5,  "label": "Solving hard technical or intellectual puzzles"},
            {"value": 8,  "label": "Leaving society, the planet, or communities better off"},
            {"value": 10, "label": "Being there for individuals when they need real support"},
        ]
    },
    {
        "id": "q4", "dimension": "lead_influence", "category": "Working Style",
        "question": "In any group, which role do you naturally fall into?",
        "options": [
            {"value": 2,  "label": "The specialist — deep focused technical or creative work"},
            {"value": 5,  "label": "The analyst — I surface insights and inform decisions"},
            {"value": 8,  "label": "The organiser — I align people and keep things moving"},
            {"value": 10, "label": "The leader — I set vision and bring people on board"},
        ]
    },
    {
        "id": "q5", "dimension": "explore_research", "category": "Curiosity",
        "question": "How do you approach a subject you know nothing about?",
        "options": [
            {"value": 2,  "label": "Learn only what I need for the task at hand"},
            {"value": 5,  "label": "Scan for a solid overview then move on"},
            {"value": 8,  "label": "Keep reading until I understand it properly"},
            {"value": 10, "label": "Go deep — I want to understand it better than most"},
        ]
    },
    {
        "id": "q6", "dimension": "nature_outdoors", "category": "Environment",
        "question": "Which work setting feels most energising to you?",
        "options": [
            {"value": 2,  "label": "A focused desk setup — screens, coffee, headphones"},
            {"value": 4,  "label": "A busy collaborative office or studio"},
            {"value": 7,  "label": "Varied settings — some travel, labs, or client sites"},
            {"value": 10, "label": "Outdoors or in the field — nature, construction, field sites"},
        ]
    },
    {
        "id": "q7", "dimension": "business_money", "category": "Values",
        "question": "How do you genuinely feel about the commercial side of work?",
        "options": [
            {"value": 2,  "label": "Indifferent — I focus on the craft or mission, not money"},
            {"value": 5,  "label": "It's a fair trade for doing work I find meaningful"},
            {"value": 8,  "label": "Markets, strategy, and growth genuinely interest me"},
            {"value": 10, "label": "Financial returns are my primary scorecard for success"},
        ]
    },
    {
        "id": "q8", "dimension": "risk_ambition", "category": "Ambition",
        "question": "How do you relate to risk and big bets in your career?",
        "options": [
            {"value": 2,  "label": "I strongly prefer stability — steady income and clear role"},
            {"value": 5,  "label": "I'll take calculated risks for meaningful upside"},
            {"value": 8,  "label": "Uncertainty excites me — I want to move fast and iterate"},
            {"value": 10, "label": "I want to bet everything on something with massive potential"},
        ]
    },
    {
        "id": "q9", "dimension": "technical_systems", "category": "Skills",
        "question": "How do you feel about technology and how systems work under the hood?",
        "options": [
            {"value": 2,  "label": "I use tools but have no interest in how they work"},
            {"value": 5,  "label": "I'm comfortable with tech but not pulled to go deeper"},
            {"value": 8,  "label": "I enjoy automating, configuring, and understanding systems"},
            {"value": 10, "label": "I want to design and build the systems themselves"},
        ]
    },
    {
        "id": "q10", "dimension": "artistic_expression", "category": "Skills",
        "question": "Which activity could you lose hours in without noticing?",
        "options": [
            {"value": 2,  "label": "Solving equations, writing code, or analysing numbers"},
            {"value": 4,  "label": "Debating ideas or crafting a persuasive argument"},
            {"value": 7,  "label": "Designing layouts, making visuals, or crafting content"},
            {"value": 10, "label": "Drawing, painting, illustrating — pure creative expression"},
        ]
    },
    {
        "id": "q11", "dimension": "social_community", "category": "Impact",
        "question": "When you picture your career's legacy, what resonates most?",
        "options": [
            {"value": 2,  "label": "Advancing technology or expanding human knowledge"},
            {"value": 4,  "label": "Building a product or company people rely on"},
            {"value": 7,  "label": "Protecting the environment or fighting for justice"},
            {"value": 10, "label": "Directly improving the wellbeing of individual people"},
        ]
    },
    {
        "id": "q12", "dimension": "structure_detail", "category": "Working Style",
        "question": "How do you feel about precision, rules, and structured processes?",
        "options": [
            {"value": 2,  "label": "I need creative freedom — too many rules slow me down"},
            {"value": 5,  "label": "Some structure is fine, but I like room to improvise"},
            {"value": 8,  "label": "Clear processes genuinely help me produce better work"},
            {"value": 10, "label": "I thrive on precision — accuracy and detail are everything"},
        ]
    },
]

ALL_CAREERS_INFO = {
    "Software Engineer":       {"icon":"💻","description":"Design and build the software systems powering the modern world.","avg_salary":"$105,000","growth_rate":"25%","skills_needed":["Python/Java","Data Structures","System Design","Git","Cloud"],"match_reason":"High logic + technical systems aptitude"},
    "Data Scientist":          {"icon":"📊","description":"Extract actionable insights from complex data using ML and statistics.","avg_salary":"$120,000","growth_rate":"36%","skills_needed":["Python/R","Machine Learning","Statistics","SQL","Visualisation"],"match_reason":"Strong maths + deep research curiosity"},
    "UX Designer":             {"icon":"🎨","description":"Create intuitive, beautiful product experiences that solve human problems.","avg_salary":"$90,000","growth_rate":"13%","skills_needed":["Figma","User Research","Prototyping","Psychology","CSS"],"match_reason":"Artistic flair + empathy for users"},
    "Marketing Manager":       {"icon":"📢","description":"Develop strategies that connect products to audiences and drive growth.","avg_salary":"$85,000","growth_rate":"10%","skills_needed":["Digital Marketing","Analytics","Copywriting","SEO","Leadership"],"match_reason":"High influence + business + creativity"},
    "Financial Analyst":       {"icon":"💰","description":"Analyse financial data and guide investment and business decisions.","avg_salary":"$95,000","growth_rate":"9%","skills_needed":["Excel","Financial Modelling","Accounting","Bloomberg","SQL"],"match_reason":"Logic + structure + business-driven"},
    "Doctor":                  {"icon":"🩺","description":"Diagnose, treat, and care for patients across all areas of medicine.","avg_salary":"$220,000","growth_rate":"3%","skills_needed":["Biology","Chemistry","Clinical Skills","Empathy","Diagnosis"],"match_reason":"Helping people + science + precision"},
    "Teacher":                 {"icon":"📚","description":"Educate and inspire students, shaping the next generation.","avg_salary":"$62,000","growth_rate":"5%","skills_needed":["Communication","Curriculum Design","Patience","Subject Expertise","Mentoring"],"match_reason":"Social impact + leadership + empathy"},
    "Entrepreneur":            {"icon":"🚀","description":"Build and lead your own ventures from idea to scale.","avg_salary":"Variable","growth_rate":"Variable","skills_needed":["Business Planning","Leadership","Finance","Networking","Resilience"],"match_reason":"Maximum risk appetite + leadership + business drive"},
    "Psychologist":            {"icon":"🧠","description":"Study behaviour and provide therapy to support mental health.","avg_salary":"$85,000","growth_rate":"6%","skills_needed":["Counselling","Research Methods","Empathy","Assessment","Ethics"],"match_reason":"Deep empathy + research curiosity"},
    "Civil Engineer":          {"icon":"🏗️","description":"Design and oversee construction of infrastructure that shapes cities.","avg_salary":"$90,000","growth_rate":"7%","skills_needed":["AutoCAD","Structural Analysis","Project Management","Physics","Maths"],"match_reason":"Logic + building + outdoor fieldwork"},
    "Graphic Designer":        {"icon":"🖌️","description":"Create visual content that communicates brand stories and ideas.","avg_salary":"$60,000","growth_rate":"3%","skills_needed":["Adobe Suite","Typography","Colour Theory","Branding","UI Design"],"match_reason":"Very high artistic and creative expression"},
    "Lawyer":                  {"icon":"⚖️","description":"Represent clients and provide expert legal counsel.","avg_salary":"$130,000","growth_rate":"10%","skills_needed":["Legal Research","Writing","Argumentation","Critical Thinking","Ethics"],"match_reason":"Analytical + influential + structured thinker"},
    "Cybersecurity Analyst":   {"icon":"🔒","description":"Protect organisations from cyber threats and data breaches.","avg_salary":"$110,000","growth_rate":"35%","skills_needed":["Network Security","Ethical Hacking","Python","SIEM","Compliance"],"match_reason":"Technical systems obsession + research depth"},
    "Product Manager":         {"icon":"📋","description":"Lead product development at the intersection of business, tech, and users.","avg_salary":"$130,000","growth_rate":"19%","skills_needed":["Product Strategy","Agile","Data Analysis","Roadmapping","Communication"],"match_reason":"Leadership + business + analytical blend"},
    "Environmental Scientist": {"icon":"🌿","description":"Research and protect ecosystems through science, data, and policy.","avg_salary":"$75,000","growth_rate":"8%","skills_needed":["Environmental Analysis","GIS","Fieldwork","Data Collection","Policy Writing"],"match_reason":"Nature-first + deep research + social impact"},
}


@quiz_bp.route('/questions', methods=['GET'])
def get_questions():
    return jsonify({'questions': QUIZ_QUESTIONS})


@quiz_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_quiz():
    user_id = get_jwt_identity()
    answers = request.json.get('answers', {})
    if len(answers) < len(QUIZ_QUESTIONS):
        return jsonify({'error': f'Please answer all {len(QUIZ_QUESTIONS)} questions'}), 400

    # Map answers → feature vector
    profile = {q['dimension']: float(answers.get(q['id'], 5)) for q in QUIZ_QUESTIONS}

    bundle, le = get_models()
    scaler = bundle['scaler']
    xgb    = bundle.get('xgb')
    rf     = bundle.get('rf')

    X   = np.array([[profile[f] for f in FEATURE_COLUMNS]])
    X_s = scaler.transform(X)

    xgb_w = bundle.get('xgb_w', 0.6)
    rf_w  = bundle.get('rf_w',  0.4)

    if xgb is not None and rf is not None:
        proba = xgb_w * xgb.predict_proba(X_s)[0] + rf_w * rf.predict_proba(X_s)[0]
    elif xgb is not None:
        proba = xgb.predict_proba(X_s)[0]
    else:
        proba = rf.predict_proba(X_s)[0]

    career_scores = sorted(
        [(le.classes_[i], float(proba[i])) for i in range(len(proba))],
        key=lambda x: -x[1]
    )

    max_s = career_scores[0][1] or 1
    top_5 = []
    for career, score in career_scores[:5]:
        info = ALL_CAREERS_INFO.get(career, {})
        top_5.append({
            "career":       career,
            "match_score":  round(min(99, (score / max_s) * 100), 1),
            "description":  info.get("description", ""),
            "avg_salary":   info.get("avg_salary", ""),
            "growth_rate":  info.get("growth_rate", ""),
            "skills_needed":info.get("skills_needed", []),
            "icon":         info.get("icon", "💼"),
            "match_reason": info.get("match_reason", ""),
        })

    update_one('users', {'_id': user_id}, {
        'quiz_completed': True,
        'top_careers':    top_5,
        'quiz_profile':   profile,
    })
    return jsonify({'top_careers': top_5})


@quiz_bp.route('/select-career', methods=['POST'])
@jwt_required()
def select_career():
    user_id = get_jwt_identity()
    career  = request.json.get('career')
    if not career:
        return jsonify({'error': 'career required'}), 400

    # Update user's selected career
    update_one('users', {'_id': user_id}, {'selected_career': career})

    # Auto-create or join community for this career
    from utils.db import upsert_one

    # Check if community already exists
    community = find_one('communities', {'career': career})
    if not community:
        # Create new community
        community_data = {
            'career': career,
            'name': f"{career} Community",
            'description': f"Connect with fellow {career}s, share knowledge, and grow together.",
            'member_count': 0,
            'is_active': True,
            'created_by': user_id,
            'rules': [
                "Be respectful and supportive",
                "Share knowledge and help others",
                "Keep discussions relevant to career growth",
                "No spam or self-promotion"
            ]
        }
        community_id = insert_one('communities', community_data)
        community = find_one('communities', {'_id': community_id})

    # Add user to community if not already a member
    existing_member = find_one('community_members', {'community_id': community['_id'], 'user_id': user_id})
    if not existing_member:
        insert_one('community_members', {
            'community_id': community['_id'],
            'user_id': user_id,
            'role': 'member',
            'reputation': 0,
            'is_active': True
        })
        # Update member count
        update_one('communities', {'_id': community['_id']}, {'member_count': community.get('member_count', 0) + 1})

    return jsonify({
        'success': True,
        'career': career,
        'community_joined': community['name']
    })
