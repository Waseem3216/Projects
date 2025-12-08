# XYMZ.Suite  

> **Shared workspaces for agencies & clients – projects, insights, teams, and risk, all in one place.**

![XYMZ Suite Logo](docs/screenshots/01-auth-login.png)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Screenshots & UI Tour](#screenshots--ui-tour)
- [How the Workspace Works](#how-the-workspace-works)
- [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Running the Project](#running-the-project)
- [Acknowledgements](#acknowledgements)

---

## Overview

**XYMZ.Suite** is a full-stack web application that gives agencies, consultants, and small teams a shared workspace for client projects.  

It combines:

- **XYMZ.Suite** – landing & overview hub  
- **XYMZ.Ops** – Kanban boards and day-to-day delivery  
- **XYMZ.BI** – simple project & task analytics  
- **XYMZ.Fleet** – team capacity and workload overview  
- **XYMZ.Radar** – risk, deadlines, and alerts

### Deployment

- **Backend API + Static Frontend:** Deployed on **Render** as a Node.js service (Express). HTTPS is handled by Render with an automatically provisioned TLS certificate for the custom domain.  
- **Database:** **MySQL** hosted on **AWS RDS**, inside a dedicated **VPC** with two subnets for high availability and isolation.  
- **Domain & DNS:** Custom domain **`xymzsuite.com`** purchased and managed on **Cloudflare**, with:
  - `www.xymzsuite.com` CNAME → Render service  
  - `xymzsuite.com` CNAME / root mapping → Render service  

---

## Key Features

### Authentication & Security

- Email + password authentication
- Passwords stored as **bcrypt hashes**
- **Security question + answer** stored as hashes for password recovery
- Optional **6-digit organization token** on login to restrict access to the correct workspace
- JWT-based session tokens on the backend

### Organizations & Workspaces

- Users can create a new organization (admin) or join an existing one via a 6-digit **join token**
- Each user can belong to multiple organizations
- Organization switcher in the top navigation to move between client workspaces

### Projects & Kanban Boards (XYMZ.Ops)

- Projects are created per organization
- Each project has a customizable **Kanban board**:
  - Columns (Backlog, In Progress, Review, Done, etc.)
  - Tasks within columns
  - Drag-and-drop behavior (column reorder & task movement)
- Each task supports:
  - Title, description, priority, due date
  - Assignment to a member
  - Comments
  - File attachments (uploaded to the backend)

### Analytics (XYMZ.BI)

- Project-level dashboard with:
  - Stacked bar chart of task statuses (In Progress / Review / Complete)
  - Hover tooltips that show owner and deadlines
- Task-level drilldown chart that shows **days left** per task

### Team Capacity (XYMZ.Fleet)

- Roster of members in the selected organization
- Cards summarizing:
  - Total members
  - Active projects
  - Average tasks per person
- Narrative **“Focus”** panel describing who is overloaded or has capacity

### Delivery Risk & Alerts (XYMZ.Radar)

- Three main panels:
  - **Overdue Tasks**
  - **At-Risk Projects**
  - **Upcoming Deadlines**
- Provides a one-glance summary of what needs immediate attention across the workspace

---

## System Architecture

### Frontend

- Static **HTML/CSS/JavaScript** frontend under `frontend/`
- Single-page style interface:
  - Auth view (login / sign-up)
  - Suite / Ops / BI / Fleet / Radar views controlled via tabs
- Custom branding (XYMZ logo, color palette, typography) inspired by modern dark SaaS dashboards
- Layout and styling adapted from a dark dashboard template pattern (multi-panel layout, accent borders, neon-style focus states)

### Backend

- **Node.js + Express** REST API  
- Main entry: `backend/server.js`  
- Routing groups (all prefixed with `/api`):

  - `POST /api/auth/signup` – create user + optional organization
  - `POST /api/auth/login` – authenticate and issue JWT
  - `POST /api/auth/forgot-password` – security-question-based recovery flow
  - `GET /api/auth/security-question` – fetch stored question
  - `GET /api/orgs` / `POST /api/orgs` – list/create organizations
  - `GET /api/projects` / `POST /api/projects` / `DELETE /api/projects/:id`
  - `GET /api/projects/:id/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
  - `GET /api/tasks/:id/comments`, `POST /api/tasks/:id/comments`
  - `POST /api/tasks/:id/attachments` – file uploads
  - Aggregation endpoints used by **BI, Fleet, Radar** views for charts and stats

- Middleware:
  - CORS
  - JSON body parsing
  - JWT auth middleware for protected routes
  - Multer for file uploads to `backend/uploads/`

### Database

- **MySQL** (AWS RDS)
- Database name: `taskdesk` (configurable)
- Charset / collation: **utf8mb4 / utf8mb4_unicode_ci** to support full Unicode
- Connectivity:
  - Backend uses **mysql2** with a connection pool in `backend/db.js`
  - Credentials and host are configured via `.env` on the Render service

### Hosting Topology

- **Render:**  
  - Runs the Node.js backend and serves the frontend assets  
- **AWS RDS:**  
  - MySQL instance inside a VPC  
  - Subnets and security groups restrict access to the Render service only  
- **Cloudflare:**  
  - Domain configuration and SSL termination in combination with Render’s certificate  
  - DNS (CNAME) used to map `xymzsuite.com` and `www` to the Render app

---

## Screenshots & UI Tour

> **Note:** Add these images to your repo (for example under `docs/screenshots/`) and adjust paths if needed.

- **Auth – Login & Sign Up**  
  `![XYMZ Suite – Auth screen](docs/screenshots/01-auth-login.png)`

- **XYMZ.Suite – Welcome / Landing View**  
  `![XYMZ Suite – Welcome](docs/screenshots/02-suite-home.png)`

- **XYMZ.Ops – Kanban Board**  
  `![XYMZ.Ops – Board](docs/screenshots/03-ops-board.png)`

- **Task Detail – Quick Edit & Comments**  
  `![XYMZ.Ops – Task detail](docs/screenshots/04-task-detail.png)`

- **XYMZ.BI – Project Insights (stacked bar chart)**  
  `![XYMZ.BI – Project dashboard](docs/screenshots/05-bi-dashboard.png)`

- **XYMZ.BI – Task Drilldown**  
  `![XYMZ.BI – Task drilldown](docs/screenshots/06-bi-drilldown.png)`

- **XYMZ.Fleet – Team & Workload**  
  `![XYMZ.Fleet – Team view](docs/screenshots/07-fleet.png)`

- **XYMZ.Radar – Risk & Alerts**  
  `![XYMZ.Radar – Alerts](docs/screenshots/08-radar.png)`

---

## How the Workspace Works

### 1. Authentication Flow

**Screenshots:** Auth – Login & Sign Up

- New users can **sign up** with:
  - Name
  - Email
  - Password (minimum 6 characters)
  - Security question + answer
  - Optional checkbox: _“I will be an admin (create an organization)”_
- Admin users automatically create their first organization and receive a 6-digit **organization token**.
- Regular users can later join an existing organization using this token.
- Login requires:
  - Email
  - Password
  - Optional organization token (helps route the user into the correct workspace)
- Links to:
  - **Forgot password?** – triggers security-question-based recovery
  - **Reset 6-digit token** – issues a new organization token for admins

---

### 2. XYMZ.Suite – Welcome Hub

**Screenshot:** XYMZ.Suite – Welcome / Landing View

- Left panel:
  - **Projects list** for the current organization
  - **Activity feed** showing recent actions (`task_moved`, new tasks, etc.)
- Top navigation:
  - XYMZ app selector tabs: `XYMZ.Suite`, `XYMZ.Ops`, `XYMZ.BI`, `XYMZ.Fleet`, `XYMZ.Radar`
  - Organization dropdown (e.g., **ABCD Consulting**)
  - User menu showing name + email and **Log out** button
- Main content:
  - **Welcome text** explaining how to use the suite
  - **About XYMZ** panel
  - Empty **FAQs** panel (ready for content)
  - **Contact** panel (email & phone)
  - **Social** icons (Instagram, X, LinkedIn, Facebook)

This page is the “home base” where users land after logging in.

---

### 3. XYMZ.Ops – Project Kanban

**Screenshots:** XYMZ.Ops – Kanban Board, Task Detail – Quick Edit & Comments

- Top section:
  - Project name (e.g., **WEB APPLICATION DEPLOYMENT**)
  - Project description line
  - Buttons: **+ Column**, **+ Task**, **Delete Project**
- Board layout:
  - Each column represents a stage (Backlog, In Progress, Review, Done)
  - Columns show the number of tasks in the header
  - Tasks display:
    - Title
    - Priority badge (high / medium)
    - Due date
- Interaction:
  - Clicking a task opens the **Quick Edit panel** on the right:
    - Edit title, description, priority, due date, assignee
    - Save Task Details button
    - Comments section:
      - Add new comments
      - Display history of discussion
    - Delete Task button

All column and task changes are persisted in the MySQL database, and actions are recorded in the `activity_log` table.

---

### 4. XYMZ.BI – Project Insights & Task Drilldown

**Screenshots:** XYMZ.BI – Project Insights (stacked bar chart), XYMZ.BI – Task Drilldown

- Top chart: **PROJECT INSIGHTS**
  - Stacked bar for each project
  - Segments show counts of **In Progress**, **Review**, and **Complete** tasks
  - Hover tooltip summarizes:
    - Completed task count
    - Project owner
    - Soonest due date
- Bottom chart: **TASKS – [Project Name]**
  - Bar chart showing **days left** per task
  - Helps quickly see which tasks are close to their deadline

Data in these charts is pulled from the `projects`, `tasks`, and `org_members` tables via aggregation queries.

---

### 5. XYMZ.Fleet – Teams & Coverage

**Screenshot:** XYMZ.Fleet – Team & Workload

- **Roster panel:**
  - Lists members in the selected organization
  - Shows each member’s email and task counts
- **Workload & Roles:**
  - Total members
  - Active projects
  - Average tasks per person
- **Focus panel:**
  - Narrative explanation of current capacity (e.g., “1 member(s) are sharing 3 task(s)”)

This view makes it easy to see whether workload is balanced or if someone is overloaded.

---

### 6. XYMZ.Radar – Alerts & Monitoring

**Screenshot:** XYMZ.Radar – Risk & Alerts

- **Overdue Tasks** – tasks past their due date across all projects
- **At-Risk Projects** – projects with a lot of in-progress work or near-term deadlines
- **Upcoming Deadlines** – tasks with due dates approaching soon

Each panel summarizes counts and upcoming dates, using queries over `tasks` filtered by `due_date` and `status`/column.

---

## Database Schema

The database is implemented in **MySQL** with the following schema:

```sql
-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  security_question VARCHAR(255),
  security_answer_hash VARCHAR(255),
  created_at DATETIME NOT NULL
);

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_user_id INT NOT NULL,
  join_token VARCHAR(6) UNIQUE,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_org_owner
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- ORG MEMBERS
CREATE TABLE IF NOT EXISTS org_members (
  org_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'owner',
  invited_at DATETIME NOT NULL,
  PRIMARY KEY (org_id, user_id),
  CONSTRAINT fk_org_members_org
    FOREIGN KEY (org_id) REFERENCES organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_org_members_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_projects_org
    FOREIGN KEY (org_id) REFERENCES organizations(id)
    ON DELETE CASCADE
);

-- PROJECT COLUMNS
CREATE TABLE IF NOT EXISTS project_columns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  position INT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_columns_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  column_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  position INT NOT NULL,
  due_date DATETIME NULL,
  assigned_to INT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_tasks_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tasks_column
    FOREIGN KEY (column_id) REFERENCES project_columns(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES users(id)
    ON DELETE SET NULL
);

-- COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_comments_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- ACTIVITY_LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT NOT NULL,
  user_id INT NULL,
  type VARCHAR(100) NOT NULL,
  payload_json TEXT,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_activity_org
    FOREIGN KEY (org_id) REFERENCES organizations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_activity_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

-- ATTACHMENTS
CREATE TABLE IF NOT EXISTS attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  size INT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_attachments_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE
);

### Table summary

- `users` – application users with password & security-answer hashes  
- `organizations` – client workspaces; each has an owner and a 6-digit join token  
- `org_members` – many-to-many mapping between users and organizations, with roles  
- `projects` – projects within an organization  
- `project_columns` – Kanban list columns per project  
- `tasks` – individual tasks, linked to a project and column, with assignee and due date  
- `comments` – discussion thread on each task  
- `activity_log` – timeline of events across an organization  
- `attachments` – metadata for files uploaded to a task  

---


## Tech Stack

### Frontend

- HTML5, CSS3  
- Vanilla JavaScript  

### Backend

- Node.js  
- Express.js  
- JSON Web Tokens (JWT)  
- Multer (file uploads)  
- bcryptjs (password hashing)  

### Database

- MySQL (AWS RDS)  
- mysql2 (Node client)  

### Infrastructure

- Render – app hosting  
- AWS RDS – managed MySQL  
- Cloudflare – domain & DNS  

---

## Project Structure

~~~text
XYMZ-Suite/
├── backend/
│   ├── server.js          # Express app & API routes
│   ├── db.js              # MySQL connection pool & helpers
│   ├── package.json
│   ├── package-lock.json
│   ├── uploads/           # Uploaded task attachments
│   └── .env               # Backend configuration (not committed)
├── frontend/
│   ├── index.html         # Main SPA shell
│   ├── js/
│   │   └── app.js         # Frontend logic & API calls
│   ├── css/               # Stylesheets (dark theme, layout)
│   └── img/               # Logo and other assets
└── README.md
~~~

---

## Running the Project

> This is a simplified overview of how the app is run locally or on a new environment.

1. **Clone the repository**

   ~~~bash
   git clone https://github.com/<your-username>/XYMZ-Suite.git
   cd XYMZ-Suite/backend
   ~~~

2. **Install backend dependencies**

   ~~~bash
   npm install
   ~~~

3. **Create the MySQL database**

   - Create a new empty database (e.g., `taskdesk`) in MySQL.  
   - Run the SQL from the **Database Schema** section of this README against that database.  

4. **Configure backend environment**

   - Create a `.env` file in `backend/` with your own values (JWT secret, DB host/user/password/name, port, etc.).  
   - Keep this file out of version control.  

5. **Start the backend**

   ~~~bash
   npm start
   ~~~

6. **Open the frontend**

   - Serve `frontend/index.html` using a simple static server (VS Code Live Server, `http-server`, or by configuring Express to serve the `frontend` folder).  
   - Log in or sign up and start using **XYMZ.Suite**.  

---

## Acknowledgements

- Frontend layout and dark-dashboard look inspired by modern SaaS admin templates and design patterns.  
- Infrastructure design informed by common three-tier web app practices (Render + AWS RDS + Cloudflare).  
