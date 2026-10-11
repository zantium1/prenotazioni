from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field, model_validator

class StayDates(BaseModel):
    arrival: date
    departure: date

    @model_validator(mode="after")
    def valid_dates(self):
        if self.departure <= self.arrival:
            raise ValueError("La partenza deve essere successiva all'arrivo")
        return self

class RoomTypeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    capacity: int = Field(gt=0)
    base_rate: Decimal = Field(ge=0, decimal_places=2)

class RoomCreate(BaseModel):
    number: str = Field(min_length=1, max_length=30)
    room_type_id: int = Field(gt=0)

class GuestCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: str | None = None
    phone: str | None = None

class ReservationCreate(StayDates):
    lead_guest_id: int = Field(gt=0)
    room_id: int = Field(gt=0)
    total: Decimal = Field(ge=0, decimal_places=2)

class RoomOut(BaseModel):
    id: int
    number: str
    room_type_id: int
    housekeeping_status: str
    active: bool
    model_config = {"from_attributes": True}

class ReservationOut(StayDates):
    id: int
    code: str
    lead_guest_id: int
    status: str
    total: Decimal
    model_config = {"from_attributes": True}
