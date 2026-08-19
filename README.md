# InternTrack

A web-based Industrial Attachment Management System designed to
streamline the management of student internships between students,
academic supervisors, industrial supervisors, and administrators.

## Overview

InternTrack provides a centralized platform for managing the
industrial attachment process, from student placement and supervision
to logbook submissions and assessment.

The system is designed around multiple user roles, each with
specific permissions and responsibilities.

## Problem

Managing student industrial attachments through manual processes can
make it difficult to track placements, supervision, logbooks,
assessments, and student progress.

InternTrack provides a centralized system for organizing these
activities and improving communication between students, academic
staff, industrial supervisors, and administrators.

## Key Features

- Student registration and authentication
- Role-based access control
- Student placement management
- Industrial supervisor management
- Academic supervisor management
- Placement request management
- Logbook management
- Student assessment and grading
- Administrative management
- RESTful API architecture
- MongoDB-based data storage

## User Roles

### Student
- Manage personal information
- View placement information
- Submit placement requests
- Manage industrial attachment activities
- Submit logbook information
- View relevant academic information

### Academic Supervisor
- Monitor assigned students
- Review student progress
- Participate in assessment activities

### Industrial Supervisor
- Supervise assigned students
- Monitor industrial attachment activities
- Participate in student assessment

### Administrator
- Manage students
- Manage supervisors
- Manage companies
- Manage placements
- Manage system information

## Authentication & Access Control

The backend implements authentication and role-based authorization
to control access to protected resources.

JSON Web Tokens (JWT) are used for authentication, while middleware
is used to verify authenticated users and enforce role-based access
to protected endpoints.

## 📸 Screenshots

### Login

![InternTrack Login](screenshots/login.png)

### Student Dashboard

![Student Dashboard](screenshots/student-dashboard.png)

### Administrator Dashboard

![Administrator Dashboard](screenshots/admin-dashboard.png)

### Supervisor Dashboard

![Supervisor Dashboard](screenshots/supervisor-dashboard.png)

### Placement Management

![Placement Management](screenshots/placement-management.png)

### Logbook & Assessment

![Logbook and Assessment](screenshots/logbook.png)

## System Architecture
InternTrack follows a client-server architecture consisting of a React
frontend, Node.js/Express backend, and MongoDB database.

![InternTrack System Architecture](docs/architecture.png)

The system supports multiple user roles and uses JWT-based
authentication and role-based access control to protect backend
resources.

## Technology Stack
### Frontend
- React
- JavaScript
- HTML
- CSS
- 
### Backend
- Node.js
- Express.js
- JavaScript

### Database
- MongoDB

### Authentication
- JSON Web Tokens (JWT)

### Development Tools
- Git
- GitHub
- VS Code

## Getting Started.. Clone the repository
git clone https://github.com/Haggla123/interntrack.git
cd interntrack

## Install dependencies
Frontend:
cd client
npm install

## Backend:
cd ../server
npm install

## Future Improvements
- Improved notification system
- More detailed analytics and reporting
- Enhanced security testing
- Automated testing
- Expanded monitoring and progress tracking

## Project Structure

```text
interntrack/
├── client/
│   └── React frontend
│
├── server/
│   └── Express backend
│
└── README.md
