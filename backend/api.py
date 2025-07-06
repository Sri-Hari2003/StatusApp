from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
# api.py

from db import SessionLocal
# from models import Service as DBService, Incident as DBIncident
from sqlalchemy.orm import Session
from models import Service as DBService, Incident as DBIncident
app = FastAPI(title="Status Page API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ServiceUpdate(BaseModel):
    name: str
    description: str
    status: str
    uptime: Optional[str] = "100.00%"
    link: Optional[str] = ""

class ServiceCreate(ServiceUpdate):
    pass

class Service(ServiceUpdate):
    id: int
    orgId: str

class IncidentUpdate(BaseModel):
    message: str
    status: str
    timestamp: str

class IncidentCreate(BaseModel):
    title: str
    status: str
    serviceId: int
    updates: List[IncidentUpdate]

class IncidentEdit(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    serviceId: Optional[int] = None
    updates: Optional[List[IncidentUpdate]] = None

class Incident(BaseModel):
    id: int
    orgId: str
    title: str
    status: str
    created_at: datetime 
    serviceId: int
    updates: List[IncidentUpdate]

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper function to get organization ID from headers
def get_org_id(x_org_id: str = Header(..., alias="X-Org-ID")):
    if not x_org_id:
        raise HTTPException(status_code=400, detail="X-Org-ID header is required")
    return x_org_id

# GET endpoints
@app.get("/services", response_model=List[Service])
async def get_services(org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    services = db.query(DBService).filter(DBService.orgId == org_id).all()
    return services

@app.get("/incidents", response_model=List[Incident])
async def get_incidents(org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    incidents = db.query(DBIncident).filter(DBIncident.orgId == org_id).all()
    return incidents

@app.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: int, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    service = db.query(DBService).filter(DBService.id == service_id, DBService.orgId == org_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@app.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident(incident_id: int, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    incident = db.query(DBIncident).filter(DBIncident.id == incident_id, DBIncident.orgId == org_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

# POST endpoints
@app.post("/services", response_model=Service)
async def create_service(service: ServiceCreate, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    new_service = DBService(
        orgId=org_id,
        name=service.name,
        description=service.description,
        status=service.status,
        uptime=service.uptime,
        link=service.link
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service

@app.post("/incidents", response_model=Incident)
async def create_incident(incident: IncidentCreate, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    # Verify the service exists and belongs to the organization
    service_exists = db.query(DBService).filter(DBService.id == incident.serviceId, DBService.orgId == org_id).first()
    if not service_exists:
        raise HTTPException(status_code=404, detail="Service not found for this organization")
    new_incident = DBIncident(
        orgId=org_id,
        title=incident.title,
        status=incident.status,
        created_at=datetime.utcnow(),
        serviceId=incident.serviceId,
        updates=[update.dict() for update in incident.updates]
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    return new_incident

# PUT endpoints
@app.put("/services/{service_id}", response_model=Service)
async def updateService(service_id: int, service: ServiceUpdate, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_service = db.query(DBService).filter(DBService.id == service_id, DBService.orgId == org_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    db_service.name = service.name
    db_service.description = service.description
    db_service.status = service.status
    db_service.uptime = service.uptime
    db_service.link = service.link
    db.commit()
    db.refresh(db_service)
    return db_service

@app.put("/incidents/{incident_id}", response_model=Incident)
async def updateIncident(incident_id: int, incident: IncidentEdit, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_incident = db.query(DBIncident).filter(DBIncident.id == incident_id, DBIncident.orgId == org_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    update_data = incident.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "updates" and value is not None:
            setattr(db_incident, key, value)
        elif value is not None:
            setattr(db_incident, key, value)
    db.commit()
    db.refresh(db_incident)
    return db_incident

# DELETE endpoints
@app.delete("/services/{service_id}")
async def deleteService(service_id: int, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_service = db.query(DBService).filter(DBService.id == service_id, DBService.orgId == org_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    # Delete all incidents associated with this service
    db.query(DBIncident).filter(DBIncident.serviceId == service_id, DBIncident.orgId == org_id).delete()
    db.delete(db_service)
    db.commit()
    return {"message": f"Service '{db_service.name}' and all associated incidents deleted successfully"}

@app.delete("/incidents/{incident_id}")
async def deleteIncident(incident_id: int, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_incident = db.query(DBIncident).filter(DBIncident.id == incident_id, DBIncident.orgId == org_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.delete(db_incident)
    db.commit()
    return {"message": f"Incident '{db_incident.title}' deleted successfully"}

@app.post("/incidents/{incident_id}/updates", response_model=Incident)
async def addIncidentUpdate(incident_id: int, update: IncidentUpdate, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_incident = db.query(DBIncident).filter(DBIncident.id == incident_id, DBIncident.orgId == org_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    update_data = update.dict()
    if not update_data.get("timestamp"):
        update_data["timestamp"] = datetime.utcnow().isoformat()

    db_incident.updates.append(update_data)
    db.commit()
    db.refresh(db_incident)
    return db_incident


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Status Page API",
        "version": "1.0.0",
        "endpoints": {
            "services": "/services",
            "incidents": "/incidents",
            "docs": "/docs",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)