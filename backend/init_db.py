from db import Base, engine
from models import Service, Incident

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Tables created (if not already present). No data inserted.") 