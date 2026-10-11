from datetime import date
from decimal import Decimal
from sqlalchemy import BigInteger, Boolean, CheckConstraint, Date, ForeignKey, Identity, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class RoomType(Base):
    __tablename__ = "room_types"
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    name: Mapped[str] = mapped_column(String)
    capacity: Mapped[int]
    base_rate: Mapped[Decimal] = mapped_column(Numeric(12, 2))

class Room(Base):
    __tablename__ = "rooms"
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    number: Mapped[str] = mapped_column(String)
    room_type_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("room_types.id"))
    housekeeping_status: Mapped[str] = mapped_column(String, default="clean")
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class Guest(Base):
    __tablename__ = "guests"
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)

class Reservation(Base):
    __tablename__ = "reservations"
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    code: Mapped[str] = mapped_column(String)
    lead_guest_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("guests.id"))
    arrival: Mapped[date] = mapped_column(Date)
    departure: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String, default="confirmed")
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    source: Mapped[str] = mapped_column(String, default="direct")

class RoomAssignment(Base):
    __tablename__ = "room_assignments"
    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    reservation_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("reservations.id"))
    room_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("rooms.id"))
    arrival: Mapped[date] = mapped_column(Date)
    departure: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String, default="active")
