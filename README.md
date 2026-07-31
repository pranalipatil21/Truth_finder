# Truth Finder — AI-Powered Resume Verification & Adaptive Assessment Platform

Truth Finder is an AI-powered platform designed to verify candidates' technical skills by comparing their resume claims with their demonstrated performance in dynamically generated technical assessments.

The platform parses a candidate's resume using LLMs, extracts claimed technical skills and proficiency levels, generates personalized MCQ assessments, conducts proctored examinations, and computes a quantitative **Truth Score** representing the authenticity of the candidate's claimed skills.

## 🚀 Key Features

- 📄 **AI Resume Parsing**
  - Upload PDF/DOCX resumes
  - Extract technical skills, proficiency levels, and experience using LLMs

- 🤖 **AI-Generated Assessments**
  - Generate personalized MCQs based on extracted resume skills
  - Questions distributed across Easy, Medium, and Hard difficulty levels
  - Parallel question generation for multiple skills

- 📈 **Dynamic Difficulty Scaling**
  - Correct answers increase or maintain question difficulty
  - Incorrect answers decrease or maintain difficulty
  - Difficulty adapts independently for each skill

- 🎥 **Proctored Assessments**
  - Webcam-based monitoring
  - Tab-switch detection
  - Copy/paste and right-click blocking
  - Periodic webcam snapshots
  - Server-anchored assessment timer

- 🎯 **Truth Score**
  - Calculates per-skill authenticity scores
  - Compares actual performance with claimed proficiency
  - Gives higher weight to harder questions
  - Penalizes excessive assessment violations

- 👨‍💼 **Recruiter Dashboard**
  - Browse assessed candidates
  - Filter candidates by skills and Truth Score
  - View performance breakdowns
  - Review violation logs
  - Shortlist candidates

- 🏢 **Assessment Rooms**
  - Recruiters can create assessment rooms
  - Candidates join using unique room codes
  - Recruiters can monitor participant performance

- 🔐 **Authentication & Authorization**
  - Email/password authentication
  - Google OAuth
  - GitHub OAuth
  - JWT-based sessions
  - Refresh tokens using HttpOnly cookies
  - Role-based access control

- 🛠️ **Admin Dashboard**
  - Manage users and roles
  - View platform statistics
  - Manage AI-generated questions
  - Manage skill categories

## 🏗️ System Architecture

```text
                     ┌──────────────────────┐
                     │      Candidate       │
                     │  Resume + Assessment │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │    React Frontend    │
                     │ Vite + Tailwind CSS  │
                     └──────────┬───────────┘
                                │ REST API
                                ▼
              ┌─────────────────────────────────┐
              │       Node.js + Express         │
              │          TypeScript             │
              └───────────────┬─────────────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
      ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
      │ Resume      │  │ Assessment  │  │ Authentication│
      │ Processing  │  │ Engine      │  │ & RBAC       │
      └──────┬──────┘  └──────┬──────┘  └──────────────┘
             │                 │
             ▼                 ▼
      ┌─────────────┐  ┌─────────────┐
      │ LLM /       │  │ Dynamic     │
      │ OpenRouter  │  │ Difficulty  │
      └─────────────┘  └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │ Truth Score │
                        │ Calculation │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  MongoDB    │
                        │   Prisma    │
                        └─────────────┘
