import datetime as dt
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from .models import AttendanceStatus


class EmployeeCreate(BaseModel):
    employee_id: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    department: str = Field(min_length=1, max_length=80)


class EmployeeRead(BaseModel):
    employee_id: str
    full_name: str
    email: str
    department: str
    created_at: dt.datetime


class AttendanceCreate(BaseModel):
    date: dt.date
    status: AttendanceStatus


class AttendanceRead(BaseModel):
    date: dt.date
    status: AttendanceStatus
    created_at: dt.datetime


class DashboardRead(BaseModel):
    employee_count: int
    attendance_records: int
    today_present: int
    today_absent: int
    today_date: dt.date


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
