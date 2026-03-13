"""Resume Analysis routes - uses AI for analysis"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import base64
import json
import re
import requests
import os

resume_bp = Blueprint('resume', __name__)

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

def analyze_resume_with_ai(resume_text, target_career=None):
    """Analyze resume using Claude API"""
    career_context = f" for a {target_career} position" if target_career else ""
    
    prompt = f"""You are an expert resume reviewer and career coach. Analyze the following resume{career_context} and provide a comprehensive evaluation.

RESUME TEXT:
{resume_text}

Provide analysis in the following JSON format ONLY, no other text:
{{
  "overall_score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "sections": {{
    "contact_info": {{
      "score": <0-100>,
      "feedback": "<specific feedback>"
    }},
    "professional_summary": {{
      "score": <0-100>,
      "feedback": "<specific feedback>"
    }},
    "experience": {{
      "score": <0-100>,
      "feedback": "<specific feedback>"
    }},
    "education": {{
      "score": <0-100>,
      "feedback": "<specific feedback>"
    }},
    "skills": {{
      "score": <0-100>,
      "feedback": "<specific feedback>"
    }},
    "formatting": {{
      "score": <0-100>,
      "feedback": "<specific feedback>"
    }}
  }},
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {{"priority": "high", "issue": "<issue>", "suggestion": "<how to fix>"}},
    {{"priority": "high", "issue": "<issue>", "suggestion": "<how to fix>"}},
    {{"priority": "medium", "issue": "<issue>", "suggestion": "<how to fix>"}},
    {{"priority": "medium", "issue": "<issue>", "suggestion": "<how to fix>"}},
    {{"priority": "low", "issue": "<issue>", "suggestion": "<how to fix>"}}
  ],
  "keywords_missing": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "ats_score": <number 0-100>,
  "ats_feedback": "<ATS optimization advice>"
}}"""

    if ANTHROPIC_API_KEY:
        try:
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 2000,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=30
            )
            if response.status_code == 200:
                content = response.json()['content'][0]['text']
                return json.loads(content)
        except Exception as e:
            print(f"AI API error: {e}")
    
    # Fallback: rule-based analysis
    return rule_based_analysis(resume_text, target_career)


def rule_based_analysis(text, target_career=None):
    """Rule-based resume analysis fallback"""
    text_lower = text.lower()
    word_count = len(text.split())
    
    # Score components
    has_email = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text))
    has_phone = bool(re.search(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]', text))
    has_linkedin = 'linkedin' in text_lower
    has_github = 'github' in text_lower
    has_summary = any(w in text_lower for w in ['summary', 'objective', 'profile', 'about'])
    has_experience = any(w in text_lower for w in ['experience', 'employment', 'work history', 'position'])
    has_education = any(w in text_lower for w in ['education', 'degree', 'university', 'college', 'bachelor', 'master'])
    has_skills = any(w in text_lower for w in ['skills', 'technologies', 'tools', 'proficient'])
    
    action_verbs = ['led', 'managed', 'developed', 'created', 'improved', 'increased', 'built', 
                    'designed', 'implemented', 'optimized', 'reduced', 'achieved', 'launched']
    action_count = sum(1 for v in action_verbs if v in text_lower)
    
    has_metrics = bool(re.search(r'\d+%|\$\d+|\d+ people|\d+ million|\d+ thousand', text))
    
    contact_score = (has_email * 30 + has_phone * 30 + has_linkedin * 20 + has_github * 20)
    summary_score = 75 if has_summary else 20
    exp_score = min(100, 40 + action_count * 8 + has_metrics * 20) if has_experience else 10
    edu_score = 85 if has_education else 20
    skills_score = 80 if has_skills else 20
    format_score = min(100, 40 + (1 if word_count > 200 else 0) * 20 + (1 if word_count < 1000 else 0) * 20 + has_metrics * 20)
    
    overall = int((contact_score + summary_score + exp_score + edu_score + skills_score + format_score) / 6)
    
    improvements = []
    if not has_metrics:
        improvements.append({"priority": "high", "issue": "No quantifiable achievements", "suggestion": "Add numbers: '↑ revenue 30%', 'managed 10-person team'"})
    if action_count < 3:
        improvements.append({"priority": "high", "issue": "Weak action verbs", "suggestion": "Start bullets with: Led, Built, Optimized, Achieved, Increased"})
    if not has_linkedin:
        improvements.append({"priority": "medium", "issue": "No LinkedIn profile", "suggestion": "Add LinkedIn URL to contact section"})
    if not has_summary:
        improvements.append({"priority": "medium", "issue": "Missing professional summary", "suggestion": "Add 3-4 sentence summary highlighting your value proposition"})
    if word_count < 300:
        improvements.append({"priority": "high", "issue": "Resume too short", "suggestion": "Expand with more detail on experience and achievements"})
    if word_count > 900:
        improvements.append({"priority": "low", "issue": "Resume may be too long", "suggestion": "Aim for 1-2 pages for most experience levels"})

    keywords_missing = []
    if target_career:
        career_keywords = {
            "Software Engineer": ["algorithms", "agile", "microservices", "testing", "deployment"],
            "Data Scientist": ["machine learning", "deep learning", "sql", "tableau", "a/b testing"],
            "UX Designer": ["user research", "wireframes", "prototype", "accessibility", "design system"],
            "Marketing Manager": ["roi", "conversion rate", "campaign", "seo", "analytics"]
        }
        kws = career_keywords.get(target_career, ["leadership", "communication", "strategy", "analytics", "project management"])
        keywords_missing = [k for k in kws if k not in text_lower][:5]

    return {
        "overall_score": overall,
        "summary": f"Your resume scores {overall}/100. {'Good foundation with room for improvement.' if overall > 60 else 'Needs significant improvements.'}",
        "sections": {
            "contact_info": {"score": contact_score, "feedback": "Complete contact details help recruiters reach you quickly."},
            "professional_summary": {"score": summary_score, "feedback": "A strong summary hooks recruiters in 6 seconds."},
            "experience": {"score": exp_score, "feedback": "Use STAR format: Situation, Task, Action, Result."},
            "education": {"score": edu_score, "feedback": "Education section looks adequate."},
            "skills": {"score": skills_score, "feedback": "Group skills by category for easy scanning."},
            "formatting": {"score": format_score, "feedback": "Consistent formatting improves readability and ATS parsing."}
        },
        "strengths": [
            "Resume includes relevant sections" if has_experience else "Has basic structure",
            "Education information present" if has_education else "Shows initiative to apply",
            "Contains technical skills" if has_skills else "Shows career direction"
        ],
        "improvements": improvements[:5] if improvements else [{"priority": "low", "issue": "Minor polish needed", "suggestion": "Review for consistency in formatting"}],
        "keywords_missing": keywords_missing or ["industry keywords", "tools/software", "certifications"],
        "ats_score": min(90, overall + 10),
        "ats_feedback": "Avoid tables and images. Use standard section headings. Save as .docx or .pdf."
    }


@resume_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_resume():
    user_id = get_jwt_identity()
    
    resume_text = ''
    target_career = request.form.get('target_career', '') or (request.json or {}).get('target_career', '')
    
    # Handle file upload
    if 'file' in request.files:
        file = request.files['file']
        filename = file.filename.lower()
        
        if filename.endswith('.pdf'):
            try:
                import PyPDF2
                import io
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
                resume_text = ' '.join(page.extract_text() for page in pdf_reader.pages)
            except Exception as e:
                return jsonify({'error': f'Could not parse PDF: {str(e)}'}), 400
        elif filename.endswith(('.txt', '.md')):
            resume_text = file.read().decode('utf-8', errors='ignore')
        else:
            resume_text = file.read().decode('utf-8', errors='ignore')
    elif request.is_json:
        resume_text = request.json.get('resume_text', '')
    
    if not resume_text or len(resume_text.strip()) < 50:
        return jsonify({'error': 'Please provide resume text (minimum 50 characters)'}), 400
    
    analysis = analyze_resume_with_ai(resume_text, target_career)
    
    # Save analysis
    from utils.db import insert_one
    from datetime import datetime
    insert_one('resume_analyses', {
        'user_id': user_id,
        'analysis': analysis,
        'target_career': target_career,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    return jsonify({'analysis': analysis})


@resume_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    from utils.db import find_all
    analyses = find_all('resume_analyses', {'user_id': user_id})
    analyses.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return jsonify({'analyses': analyses[:10]})
