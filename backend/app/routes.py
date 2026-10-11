from datetime import date
from secrets import token_urlsafe
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .database import get_db
from .models import Guest, Reservation, Room, RoomAssignment, RoomType
from .schemas import GuestCreate, ReservationCreate, ReservationOut, RoomCreate, RoomOut, RoomTypeCreate

router = APIRouter(prefix="/api/v1")

@router.get("/rooms", response_model=list[RoomOut])
def list_rooms(db: Session = Depends(get_db)):
    return db.scalars(select(Room).order_by(Room.number)).all()

@router.post("/room-types", status_code=201)
def create_room_type(payload: RoomTypeCreate, db: Session = Depends(get_db)):
    item = RoomType(**payload.model_dump())
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Tipologia già esistente")
    db.refresh(item)
    return {"id": item.id}

@router.post("/rooms", response_model=RoomOut, status_code=201)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)):
    if not db.get(RoomType, payload.room_type_id):
        raise HTTPException(404, "Tipologia camera inesistente")
    item = Room(**payload.model_dump())
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Numero camera già esistente")
    db.refresh(item)
    return item

@router.post("/guests", status_code=201)
def create_guest(payload: GuestCreate, db: Session = Depends(get_db)):
    item = Guest(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id}

@router.get("/availability", response_model=list[RoomOut])
def availability(arrival: date, departure: date, db: Session = Depends(get_db)):
    if departure <= arrival:
        raise HTTPException(422, "Intervallo date non valido")
    occupied = select(RoomAssignment.room_id).where(
        RoomAssignment.status == "active",
        RoomAssignment.arrival < departure,
        RoomAssignment.departure > arrival
    )
    # Blocks and inactive rooms must also be excluded.
    from .models import Room
    from sqlalchemy import text
    blocked = text("select room_id from public.room_blocks where starts_on < :departure and ends_on > :arrival")
    rows = db.execute(select(Room).where(Room.active.is_(True), Room.id.not_in(occupied), Room.id.not_in(
        select_room_blocks(db, arrival, departure)
    )).order_by(Room.number)).scalars().all()
    return rows

def select_room_blocks(db: Session, arrival: date, departure: date):
    from sqlalchemy import select
    from .models import RoomBlock
    return select(RoomBlock.room_id).where(RoomBlock.starts_on < departure, RoomBlock.ends_on > arrival)

@router.get("/reservations", response_model=list[ReservationOut])
def list_reservations(db: Session = Depends(get_db)):
    return db.scalars(select(Reservation).order_by(Reservation.arrival.desc()).limit(200)).all()

@router.post("/reservations", response_model=ReservationOut, status_code=201)
def create_reservation(payload: ReservationCreate, db: Session = Depends(get_db)):
    from .models import RoomBlock
    if not db.get(Guest, payload.lead_guest_id):
        raise HTTPException(404, "Cliente inesistente")
    room = db.get(Room, payload.room_id)
    if not room or not room.active:
        raise HTTPException(404, "Camera non disponibile")
    blocked = db.scalar(select(RoomBlock.id).where(
        RoomBlock.room_id == payload.room_id,
        RoomBlock.starts_on < payload.departure,
        RoomBlock.ends_on > payload.arrival
    ).limit(1))
    if blocked:
        raise HTTPException(409, "Camera bloccata per manutenzione")
    reservation = Reservation(code="P-" + token_urlsafe(9), lead_guest_id=payload.lead_guest_id,
        arrival=payload.arrival, departure=payload.departure, total=payload.total, status="confirmed", source="direct")
    try:
        db.add(reservation)
        db.flush()
        db.add(RoomAssignment(reservation_id=reservation.id, room_id=payload.room_id,
            arrival=payload.arrival, departure=payload.departure, status="active"))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Camera già occupata o prenotazione in conflitto")
    db.refresh(reservation)
    return reservation
