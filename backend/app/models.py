import datetime as dt
from enum import Enum
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class AttendanceStatus(str, Enum):
    present = "Present"
    absent = "Absent"


class Employee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    employee_id: str = Field(index=True, nullable=False, unique=True, min_length=1, max_length=50)
    full_name: str = Field(nullable=False, min_length=1, max_length=120)
    email: str = Field(index=True, nullable=False, unique=True, min_length=3, max_length=254)
    department: str = Field(nullable=False, min_length=1, max_length=80)

    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.timezone.utc), nullable=False)


class Attendance(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("employee_pk", "date", name="uq_attendance_employee_date"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    employee_pk: int = Field(foreign_key="employee.id", index=True, nullable=False)

    date: dt.date = Field(index=True, nullable=False)
    status: AttendanceStatus = Field(nullable=False)

    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.timezone.utc), nullable=False)
