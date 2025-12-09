# HiringBuddy – AI-Powered Job Search & Resume Matching Platform

## Overview

## ♦ Key Features
- Resume parsing, chunking, and semantic vector storage
- Multi-agent AI pipeline (Job Researcher, Match Evaluator, Resume Strategist, Interview Coach)
- Real-time job matching
- Interactive interview practice
- Student-friendly dashboard
## ♦ Dependencies
All backend Python dependencies are listed in:  
backend/requirements.txt  
Install them with:  
```bash
pip install -r requirements.txt
```
## Environment Variables (.env Setup)

HiringBuddy requires a `.env` file in both the **backend** and **frontend**.
Below is the full template of all required variables.  

---

### Backend `.env` Example

```env
# SECURITY & AUTH
SECRET_KEY=your_jwt_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# DATABASE (PostgreSQL)
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>:5432/<dbname>

# AWS BEDROCK (LLM + Embeddings)

AWS_REGION=us-east-1 (example)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# LLMs used for agents
DEFAULT_CLAUDE=us.anthropic.claude-3-7-sonnet-20250219-v1:0
# EMBEDDING MODEL (Titan v2)
# EMBED_MODEL_ID=amazon.titan-embed-text-v2:0

# SERPER Search Agent

SERPER_API_KEY=your_serper_api_key

# EMAIL (Password Reset)

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
FROM_EMAIL=no-reply@example.test
```
## Architecture


## Multi-Agent System


## Database Schema


## ⚙️ Setup Instructions
Backend setup (FastAPI, PostgreSQL, pgvector)  
Frontend setup (React + Vite + Tailwind)  
Environment variables  
Running locally  
Building for production

## Screenshots
soon

## Future Work
CrewAI orchestration  
Outlook email integration

## 🎥 DEMO
https://www.youtube.com/watch?v=qH5BTfw4lq0

AUI Computer Science Capstone Project  
