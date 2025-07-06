from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres_statusapp_user:wTcPUZIizQr8wfXRUP2B0StAOas6U5sP@dpg-d1idld3ipnbc73birfs0-a.singapore-postgres.render.com/postgres_statusapp")

engine = create_engine(DATABASE_URL, echo=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base() 