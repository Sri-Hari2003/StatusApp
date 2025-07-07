from fastapi import FastAPI, HTTPException, Header, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from db import SessionLocal
from sqlalchemy.orm import Session
from models import Service as DBService, Incident as DBIncident
from clerk import get_org_name_from_clerk

app = FastAPI(title="Status Page API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Classes
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.org_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, org_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if org_id:
            if org_id not in self.org_connections:
                self.org_connections[org_id] = []
            self.org_connections[org_id].append(websocket)
        print(f"[WebSocket] Connected: {websocket.client} (org_id={org_id})")

    def disconnect(self, websocket: WebSocket, org_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if org_id and org_id in self.org_connections:
            if websocket in self.org_connections[org_id]:
                self.org_connections[org_id].remove(websocket)
        print(f"[WebSocket] Disconnected: {websocket.client} (org_id={org_id})")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        print(f"[WebSocket] Sending to {websocket.client}: {message}")
        await websocket.send_text(message)

    async def broadcast_to_all(self, message: dict):
        message_str = json.dumps(message)
        for connection in self.active_connections:
            try:
                print(f"[WebSocket] Broadcasting to {connection.client}: {message_str}")
                await connection.send_text(message_str)
            except:
                # Remove disconnected connections
                self.active_connections.remove(connection)

    async def broadcast_to_org(self, message: dict, org_id: str):
        if org_id not in self.org_connections:
            return
        
        message_str = json.dumps(message)
        disconnected = []
        
        for connection in self.org_connections[org_id]:
            try:
                print(f"[WebSocket] Broadcasting to org {org_id} ({connection.client}): {message_str}")
                await connection.send_text(message_str)
            except:
                disconnected.append(connection)
        
        for connection in disconnected:
            self.org_connections[org_id].remove(connection)
            if connection in self.active_connections:
                self.active_connections.remove(connection)

manager = ConnectionManager()

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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_org_id(x_org_id: str = Header(..., alias="X-Org-ID")):
    if not x_org_id:
        raise HTTPException(status_code=400, detail="X-Org-ID header is required")
    return x_org_id

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"[WebSocket] Received from {websocket.client}: {data}")            
            await manager.send_personal_message(f"Message received: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/{org_id}")
async def websocket_org_endpoint(websocket: WebSocket, org_id: str):
    await manager.connect(websocket, org_id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"[WebSocket] Received from {websocket.client} (org_id={org_id}): {data}")
          
            await manager.send_personal_message(f"Message received for org {org_id}: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, org_id)

@app.get("/public/org_name/{org_id}")
async def get_org_name(org_id: str):
    try:
        name = await get_org_name_from_clerk(org_id)
        return { "orgId": org_id, "name": name }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Org not found: {str(e)}")

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
    
    service_data = {
        "type": "service_created",
        "orgId": org_id,
        "data": {
            "id": new_service.id,
            "name": new_service.name,
            "description": new_service.description,
            "status": new_service.status,
            "uptime": new_service.uptime,
            "link": new_service.link
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_all(service_data)
    await manager.broadcast_to_org(service_data, org_id)
    
    return new_service

@app.post("/incidents", response_model=Incident)
async def create_incident(incident: IncidentCreate, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
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
    
    incident_data = {
        "type": "incident_created",
        "orgId": org_id,
        "data": {
            "id": new_incident.id,
            "title": new_incident.title,
            "status": new_incident.status,
            "created_at": new_incident.created_at.isoformat(),
            "serviceId": new_incident.serviceId,
            "updates": new_incident.updates
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_all(incident_data)
    await manager.broadcast_to_org(incident_data, org_id)
    
    return new_incident

@app.put("/services/{service_id}", response_model=Service)
async def updateService(service_id: int, service: ServiceUpdate, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_service = db.query(DBService).filter(DBService.id == service_id, DBService.orgId == org_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    old_status = db_service.status
    
    db_service.name = service.name
    db_service.description = service.description
    db_service.status = service.status
    db_service.uptime = service.uptime
    db_service.link = service.link
    db.commit()
    db.refresh(db_service)
    
    service_data = {
        "type": "service_updated",
        "orgId": org_id,
        "data": {
            "id": db_service.id,
            "name": db_service.name,
            "description": db_service.description,
            "status": db_service.status,
            "uptime": db_service.uptime,
            "link": db_service.link,
            "previous_status": old_status
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_all(service_data)
    await manager.broadcast_to_org(service_data, org_id)
    
    return db_service

@app.put("/incidents/{incident_id}", response_model=Incident)
async def updateIncident(incident_id: int, incident: IncidentEdit, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_incident = db.query(DBIncident).filter(DBIncident.id == incident_id, DBIncident.orgId == org_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    
    old_status = db_incident.status
    
    update_data = incident.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "updates" and value is not None:
            setattr(db_incident, key, value)
        elif value is not None:
            setattr(db_incident, key, value)
    db.commit()
    db.refresh(db_incident)
    
    
    incident_data = {
        "type": "incident_updated",
        "orgId": org_id,
        "data": {
            "id": db_incident.id,
            "title": db_incident.title,
            "status": db_incident.status,
            "created_at": db_incident.created_at.isoformat(),
            "serviceId": db_incident.serviceId,
            "updates": db_incident.updates,
            "previous_status": old_status
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_all(incident_data)
    await manager.broadcast_to_org(incident_data, org_id)
    
    return db_incident

@app.delete("/services/{service_id}")
async def deleteService(service_id: int, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_service = db.query(DBService).filter(DBService.id == service_id, DBService.orgId == org_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service_name = db_service.name
    db.query(DBIncident).filter(DBIncident.serviceId == service_id, DBIncident.orgId == org_id).delete()
    db.delete(db_service)
    db.commit()
    
    
    service_data = {
        "type": "service_deleted",
        "orgId": org_id,
        "data": {
            "id": service_id,
            "name": service_name
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_all(service_data)
    await manager.broadcast_to_org(service_data, org_id)
    
    return {"message": f"Service '{service_name}' and all associated incidents deleted successfully"}

@app.delete("/incidents/{incident_id}")
async def deleteIncident(incident_id: int, org_id: str = Depends(get_org_id), db: Session = Depends(get_db)):
    db_incident = db.query(DBIncident).filter(DBIncident.id == incident_id, DBIncident.orgId == org_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident_title = db_incident.title
    service_id = db_incident.serviceId
    db.delete(db_incident)
    db.commit()
    
    
    incident_data = {
        "type": "incident_deleted",
        "orgId": org_id,
        "data": {
            "id": incident_id,
            "title": incident_title,
            "serviceId": service_id
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_all(incident_data)
    await manager.broadcast_to_org(incident_data, org_id)
    
    return {"message": f"Incident '{incident_title}' deleted successfully"}

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
    
    
    incident_data = {
        "type": "incident_update_added",
        "orgId": org_id,
        "data": {
            "id": db_incident.id,
            "title": db_incident.title,
            "status": db_incident.status,
            "serviceId": db_incident.serviceId,
            "new_update": update_data,
            "all_updates": db_incident.updates
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_all(incident_data)
    await manager.broadcast_to_org(incident_data, org_id)
    
    return db_incident

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/")
async def root():
    return {
        "message": "Status Page API",
        "version": "1.0.0",
        "endpoints": {
            "services": "/services",
            "incidents": "/incidents",
            "websocket": "/ws",
            "org_websocket": "/ws/{org_id}",
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/public/orgs_services")
async def get_all_orgs_services_and_incidents(db: Session = Depends(get_db)):
    all_services = db.query(DBService).all()
    all_incidents = db.query(DBIncident).all()

    orgs: Dict[str, List[Dict[str, Any]]] = {}

    for service in all_services:
        service_data = {
            "id": service.id,
            "name": service.name,
            "status": service.status,
            "description": service.description,
            "uptime": service.uptime,
            "link": service.link,
            "incidents": []
        }

        for incident in all_incidents:
            if incident.serviceId == service.id:
                service_data["incidents"].append({
                    "id": incident.id,
                    "title": incident.title,
                    "status": incident.status,
                    "created_at": incident.created_at.isoformat(),
                    "updates": incident.updates
                })

        if service.orgId not in orgs:
            orgs[service.orgId] = []
        orgs[service.orgId].append(service_data)

    return orgs

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)