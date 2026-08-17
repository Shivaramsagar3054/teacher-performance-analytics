# API Documentation

This document provides an overview of the available API endpoints for the Teacher Backend project.

## Base URL
`http://127.0.0.1:8000/api/`

## Authentication
Most endpoints require a JWT Bearer token.

**Header Format:**
```http
Authorization: Bearer <your_access_token>
```

---

## Authentication & Registration Endpoints

### 1. Student Registration (with OTP)
- **URL**: `/api/register/student/`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
- **Response**: Sends a 6-digit OTP to the email.

### 2. Verify OTP
- **URL**: `/api/verify-otp/`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response**: Creates user and returns JWT tokens (`access`, `refresh`).

### 3. General Registration (Legacy/Admin)
- **URL**: `/api/register/`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "yourname",
    "email": "user@example.com",
    "password": "yourpassword",
    "role": "student" 
  }
  ```

### 4. Login
- **URL**: `/api/login/`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
- **Response**: Returns `access` and `refresh` tokens.

### 5. User Profile
- **URL**: `/api/profile/`
- **Method**: `GET`, `PUT`, `PATCH`
- **Auth Required**: Yes

---

## Resource Endpoints (CRUD)
All resource endpoints follow standard REST patterns and require authentication.

| Resource | Base Endpoint | Description |
| :--- | :--- | :--- |
| **Teachers** | `/api/teachers/` | Manage teacher profiles |
| **Education** | `/api/education/` | Manage teacher education history |
| **Courses** | `/api/courses/` | Manage course details |
| **Course Teachers** | `/api/course-teachers/` | Assign teachers to courses |
| **Completed Courses** | `/api/completed-courses/` | Track finished courses and grades |
| **Research Interests** | `/api/research-interests/` | Manage teacher research topics |
| **Comments** | `/api/comments/` | Teacher performance comments |
| **Ratings** | `/api/ratings/` | Teacher skill ratings |
| **Events** | `/api/events/` | Manage campus events |
| **Users** | `/api/users/` | Manage user accounts (Update/Delete) |

---

## Detailed Resource Examples

### 1. Ratings API
Allows students to rate a teacher based on specific criteria.

- **URL**: `/api/ratings/`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "teacher": 1,
    "user": 5,
    "teaching_skill": 5,
    "subject_knowledge": 4,
    "communication": 5,
    "approachability": 4,
    "overall_score": 4.5
  }
  ```
- **Fields**:
    - `teacher`: ID of the teacher being rated.
    - `user`: ID of the student giving the rating.
    - `teaching_skill`: Integer (1-5 recommended).
    - `subject_knowledge`: Integer (1-5 recommended).
    - `communication`: Integer (1-5 recommended).
    - `approachability`: Integer (1-5 recommended).
    - `overall_score`: Decimal (e.g., 4.50).

### 2. Events API
Manage and list campus events, workshops, or seminars.

- **URL**: `/api/events/`
- **Method**: `POST`
- **Auth Required**: Yes (Teachers and Admins only)
- **Content-Type**: `multipart/form-data`
- **Request Body (form-data)**:
    - `title`: "AI in Education Workshop"
    - `description`: "A comprehensive workshop..."
    - `event_type`: "Workshop"
    - `start_date`: "2026-06-15T10:00:00Z"
    - `end_date`: "2026-06-15T15:00:00Z"
    - `location`: "Main Auditorium"
    - `organizer`: 1
    - `image_path`: (Select a file)
    - `registration_link`: "https://example.com/register"

- **Fields**:
    - `title`: Title of the event.
    - `description`: Detailed description.
    - `event_type`: Type (e.g., Workshop, Seminar, Guest Lecture).
    - `start_date`: ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`).
    - `end_date`: ISO 8601 format.
    - `location`: Venue name or address.
    - `organizer`: ID of the Teacher organizing the event (Optional).
    - `image_path`: **File Upload** (The image file itself).
    - `registration_link`: URL for event registration.

### Standard Methods for Resources:

- **List All**: `GET /api/<resource>/`
- **Create New**: `POST /api/<resource>/`
- **Get Details**: `GET /api/<resource>/<id>/`
- **Update (Full)**: `PUT /api/<resource>/<id>/`
- **Update (Partial)**: `PATCH /api/<resource>/<id>/`
- **Delete**: `DELETE /api/<resource>/<id>/`

---

## Error Handling
All APIs are wrapped in a global exception handler. If a server error (500) or validation error (400) occurs, you will receive a consistent JSON response:

```json
{
    "error": "Short error description",
    "details": "Specific error details or exception message"
}
```

---

## Example Usage (using curl)

### Step 1: Register Student
```bash
curl -X POST http://127.0.0.1:8000/api/register/student/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123"}'
```

### Step 2: Verify OTP
```bash
curl -X POST http://127.0.0.1:8000/api/verify-otp/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "otp": "123456"}'
```

### Step 3: Get Courses (using token)
```bash
curl -X GET http://127.0.0.1:8000/api/courses/ \
     -H "Authorization: Bearer <access_token>"
```


