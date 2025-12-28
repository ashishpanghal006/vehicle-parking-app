# 🚗 ParkIn – Smart Vehicle Parking Management System

## 📌 Project Overview
ParkIn is a full-stack web application designed to manage vehicle parking lots, bookings, and real-time parking availability.  
It offers **User & Admin dashboards**, **token-based authentication**, **scheduled email reports**, **CSV export**, and **Redis-based caching** for better performance.

---

## 🧠 Features
| Feature | Description |
|--------|-------------|
| 🧑‍💼 Role-based Access (RBAC) | Admin & User roles using Flask-Security |
| 🔑 Token-Based Authentication | JWT-like Token stored in browser LocalStorage |
| 🚦 Real-Time Spot Availability | Users see available spots before booking |
| 📊 User & Admin Dashboards | Vue.js SPA (Single Page Application) |
| 📤 CSV Export | Admin can download reservation data |
| 📧 Scheduled Email Report | Celery + MailHog sends monthly parking summary |
| ⚡ Redis Caching | Caches parking lots API for faster performance |

---

## 🏗️ Technologies Used

### 🔹 Backend
- Flask (Python Framework)
- Flask-Security (Authentication & RBAC)
- Flask-SQLAlchemy (ORM)
- Celery (Asynchronous tasks & Scheduling)
- Redis (Caching)
- SQLite (Database)

### 🔹 Frontend
- Vue.js (SPA frontend)
- Vue-Router (Routing)
- Bootstrap 5 (UI Styling)
- Chart.js (For dashboard graphs – optional screens)

---

## 🗄️ Database Schema (ER Diagram Summary)

### Tables:
- **User**
  - id, email, username, password, active, fs_uniquifier
- **Role**
  - id, name, description
- **UsersRoles**
  - user_id → FK (User), role_id → FK (Role)
- **ParkingLot**
  - id, location_name (unique), address, price, no_of_spots
- **ParkingSpot**
  - id, lot_id (FK → ParkingLot), status
- **ReservedParkingSpot**
  - id, spot_id (FK), user_id (FK), parking_timestamp, leaving_timestamp, parking_cost

### Relationships:
| Relationship | Description |
|-------------|-------------|
| User → ReservedParkingSpot | One-to-Many |
| ParkingLot → ParkingSpot | One-to-Many |
| ParkingSpot → ReservedParkingSpot | One-to-Many |
| User ↔ Role | Many-to-Many |

---

## 🌐 API Endpoints (Flask + Flask-RESTful)

### Auth APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login-user` | Login & get authentication token |
| POST | `/api/register` | Create new user |

### Admin Parking Lot APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/get_parkinglot` | Get all lots (cached) |
| POST | `/api/create_parkinglot` | Create new parking lot |
| PUT | `/api/edit_parkinglot/<id>` | Update lot |
| DELETE | `/api/delete_parkinglot/<id>` | Delete lot |

### User Booking APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parkinglots_for_users` | Get lots with available spots (cached) |
| POST | `/api/book_spot/<lot_id>` | Book a spot |
| POST | `/api/release_spot/<reservation_id>` | Release a booked spot |
| GET | `/api/user_bookings` | Get active & completed bookings |

### Admin Utilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export` | Trigger async CSV generation |
| GET | `/api/csv_result/<task_id>` | Download generated CSV |

---

## 📤 Scheduled Email Notifications
✔ Celery runs background job every 2 minutes (or monthly)  
✔ For each user → generate monthly usage summary using Jinja2 & send via Mailhog  

---

## 🚀 Running the Project (Development Setup)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Redis
redis-server

# Start Flask backend
python app.py

# Start Celery worker
celery -A app.celery worker --loglevel INFO

# Start Celery beat
celery -A app.celery beat --loglevel INFO

# Open Mailhog (Email testing UI)
http://localhost:8025
