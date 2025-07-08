# StatusApp

## Features
- **Service Monitoring**: Track the status and uptime of multiple services.
- **Incident Management**: Create, update, and resolve incidents with detailed timelines.
- **Team & Organization Support**: Multi-organization support with Clerk authentication.
- **Beautiful Dashboard**: Modern, responsive UI with charts and analytics.
- **Public Status Page**: Share real-time service status and incident history with your users.
- **Role-based Access**: Admin and user roles for secure management.
- **Real-time Toast Notifications**: The public status page displays detailed toast notifications for all real-time service and incident events via WebSocket.
- **Persistent Organization Selection**: The selected organization is remembered across page refreshes.
- **Paginated Incident Timeline**: Each service's incident timeline is paginated with a modern, user-friendly UI.

---

## Tech Stack
- **Frontend**: React 19, Vite, TypeScript, TailwindCSS, Clerk, Recharts
- **Backend**: FastAPI, SQLAlchemy, Pydantic, SQLite (default)

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.9+

---

## Backend Setup (FastAPI)

1. **Install dependencies**
   ```bash
   cd backend
   pip install fastapi uvicorn sqlalchemy pydantic[dotenv] python-multipart
   ```

2. **Initialize the database**
   ```bash
   python init_db.py
   ```

3. **Run the API server**
   ```bash
   uvicorn api:app --reload
   ```
   The API will be available at `http://localhost:8000`.

---

## Frontend Setup (React + Vite)

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env` and set the API URL and Clerk keys as needed.

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or as shown in the terminal).

---

## Environment Variables

### Backend
- (Optional) Configure your database in `backend/db.py` if not using SQLite.
- Clerk API keys for organization name lookup (see `backend/clerk.py`).

### Frontend
- `VITE_API_URL` — URL of your FastAPI backend (default: `http://localhost:8000`)
- Clerk publishable key and other Clerk settings as needed

---

## Usage
- **Sign in** with Clerk to create or join an organization.
- **Add services** and monitor their status.
- **Create incidents** and post updates as you resolve them.
- **Share your public status page** with users for transparency.
- **See real-time toast notifications** for all service and incident changes on the public status page.
- **Switch organizations** and your selection will be remembered after refresh.
- **Browse incidents** with paginated timelines for each service.

---

## Project Structure
```
StatusApp/
  backend/      # FastAPI backend
  frontend/     # React frontend (Vite)
```

---

## License
MIT 

## Deployment Details

### Frontend
- **Main App:** [https://dynamic-caramel-218f6b.netlify.app/](https://dynamic-caramel-218f6b.netlify.app/)
- **Public Status Page:** [https://dynamic-caramel-218f6b.netlify.app/public](https://dynamic-caramel-218f6b.netlify.app/public)
- **Mobile Friendly:** The frontend is fully responsive and mobile-friendly for use on phones and tablets.

### Backend
- **API:** [https://statusapp-k9vg.onrender.com](https://statusapp-k9vg.onrender.com)
    - Endpoints: `/services`, `/incidents`, `/ws`, `/ws/{org_id}`, `/docs`, `/health`
    - **Note:** Due to inactivity, the first reload can take up to 120 seconds (cold start).
 
    - Clerk is currently running in development mode as the app is still in the demo/testing phase.

### User Roles
- Users can be **admin** or **member** of an organization.
    - **Admin:** Can add and delete or update data (services, incidents, updates etc.).
    - **Member:** Has restricted access (view only, cannot add/delete data).

### Organization Features
- **Organization switching** is possible within the app.
- **Adding new organizations** is supported.

---
For more details, see the respective frontend and backend directories. 
