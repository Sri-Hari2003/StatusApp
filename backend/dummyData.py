import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db import Base, engine, SessionLocal
from models import Service, Incident

# Your org IDs
ORG_IDS = [
    "org_2zXah8h6DOcz1ffam3ZFnroftHH",
    "org_2zXOcnULFw4XoU6PG4x4JANWzn6",
    "org_2zS1qQOPMTPdUwxaHVygk2CxgE7"
]

SERVICE_NAMES = [
    "Authentication Service",
    "Payment Gateway",
    "Email Notification Service",
    "Search API",
    "Analytics Engine",
    "User Profile Service",
    "File Storage Service",
    "Recommendation Engine"
]

SERVICE_STATUSES = ["operational", "degraded_performance", "partial_outage", "major_outage"]
INCIDENT_STATUSES = ["investigating", "identified", "monitoring", "resolved"]

def create_dummy_data():
    db: Session = SessionLocal()
    try:
        # Ensure tables exist
        Base.metadata.create_all(bind=engine)

        # Wipe existing data
        db.query(Incident).delete()
        db.query(Service).delete()
        db.commit()
        print("🗑️ Existing data deleted.")

        for org_id in ORG_IDS:
            num_services = random.randint(4, 6)
            chosen_services = random.sample(SERVICE_NAMES, num_services)

            for service_name in chosen_services:
                service = Service(
                    orgId=org_id,
                    name=service_name,
                    description=f"Description for {service_name}",
                    status=random.choice(SERVICE_STATUSES),
                    uptime=f"{round(random.uniform(95, 100), 2)}%",
                    link=f"https://{service_name.replace(' ', '').lower()}.example.com"
                )
                db.add(service)
                db.flush()  # get service.id

                # Add 10–15 incidents for this service
                num_incidents = random.randint(10, 15)
                for _ in range(num_incidents):
                    created_time = datetime.utcnow() - timedelta(days=random.randint(0, 30))
                    incident = Incident(
                        orgId=org_id,
                        title=f"{service_name} issue #{random.randint(100, 999)}",
                        status=random.choice(INCIDENT_STATUSES),
                        created_at=created_time,
                        serviceId=service.id,
                        updates=[
                            {
                                "timestamp": created_time.isoformat(),
                                "message": f"Update for {service_name} incident",
                                "status": random.choice(INCIDENT_STATUSES)
                            }
                        ]
                    )
                    db.add(incident)

        db.commit()
        print("✅ Dummy data inserted successfully.")

    except Exception as e:
        db.rollback()
        print("❌ Error inserting dummy data:", e)

    finally:
        db.close()

if __name__ == "__main__":
    create_dummy_data()
