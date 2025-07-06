from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableList
from db import Base
from datetime import datetime

class Service(Base):
    __tablename__ = 'services'

    id = Column(Integer, primary_key=True, index=True)
    orgId = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False)
    uptime = Column(String, default="100.00%")
    link = Column(String, nullable=True)

    incidents = relationship('Incident', back_populates='service', cascade="all, delete-orphan")


class Incident(Base):
    __tablename__ = 'incidents'

    id = Column(Integer, primary_key=True, index=True)
    orgId = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    serviceId = Column(Integer, ForeignKey('services.id', ondelete="CASCADE"), nullable=False)
    updates = Column(MutableList.as_mutable(JSONB), default=list)

    service = relationship('Service', back_populates='incidents')
