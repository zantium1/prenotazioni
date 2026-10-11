from datetime import date
from decimal import Decimal
import pytest
from pydantic import ValidationError
from app.schemas import ReservationCreate, RoomCreate

def test_departure_must_follow_arrival():
    with pytest.raises(ValidationError):
        ReservationCreate(lead_guest_id=1, room_id=1, arrival=date(2026, 10, 15),
            departure=date(2026, 10, 15), total=Decimal("100.00"))

def test_valid_booking():
    booking = ReservationCreate(lead_guest_id=1, room_id=1,
        arrival=date(2026, 10, 15), departure=date(2026, 10, 17), total=Decimal("200.00"))
    assert (booking.departure - booking.arrival).days == 2

def test_invalid_room_type_id():
    with pytest.raises(ValidationError):
        RoomCreate(number="101", room_type_id=0)
