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

## System Architecture

InternTrack follows a client-server architecture:

Frontend
→ React

Backend
→ Node.js / Express

Database
→ MongoDB

Communication
→ REST API

Authentication
→ JWT

## Technology Stack

### Frontend
- React
- JavaScript
- HTML
- CSS

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
