import datetime as dt
import os
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Path, Query, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import delete, func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from .db import get_session, init_db
from .models import Attendance, AttendanceStatus, Employee
from .schemas import (
    AttendanceCreate,
    AttendanceRead,
    DashboardRead,
    EmployeeCreate,
    EmployeeRead,
)

load_dotenv()


def _parse_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or ["http://localhost:5173"]


app = FastAPI(
    title="HRMS Lite API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.exception_handler(RequestValidationError)
def validation_exception_handler(_request: Request, exc: RequestValidationError):
    # Make validation errors more readable for the UI
    msg_parts = []
    for err in exc.errors():
        loc = ".".join([str(x) for x in err.get("loc", []) if x != "body"])
        message = err.get("msg", "Invalid value")
        if loc:
            msg_parts.append(f"{loc}: {message}")
        else:
            msg_parts.append(message)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": " | ".join(msg_parts) or "Validation error"},
    )


@app.get("/health")
def health():
    return {"ok": True}


def _get_employee_or_404(session: Session, employee_id: str) -> Employee:
    emp = session.exec(select(Employee).where(Employee.employee_id == employee_id)).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return emp


def _employee_to_read(emp: Employee) -> EmployeeRead:
    return EmployeeRead(
        employee_id=emp.employee_id,
        full_name=emp.full_name,
        email=emp.email,
        department=emp.department,
        created_at=emp.created_at,
    )


@app.post("/employees", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, session: Session = Depends(get_session)):
    employee_id = payload.employee_id.strip()
    full_name = payload.full_name.strip()
    department = payload.department.strip()
    email = str(payload.email).strip().lower()

    if not employee_id or not full_name or not department or not email:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="All fields are required")

    existing = session.exec(
        select(Employee).where((Employee.employee_id == employee_id) | (Employee.email == email))
    ).first()
    if existing:
        if existing.employee_id == employee_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee ID already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        )

    emp = Employee(employee_id=employee_id, full_name=full_name, email=email, department=department)
    session.add(emp)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate employee (employee_id or email)",
        )
    session.refresh(emp)
    return _employee_to_read(emp)


@app.get("/employees", response_model=List[EmployeeRead])
def list_employees(session: Session = Depends(get_session)):
    employees = session.exec(select(Employee).order_by(Employee.created_at.desc())).all()
    return [_employee_to_read(e) for e in employees]


@app.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: str = Path(min_length=1, max_length=50),
    session: Session = Depends(get_session),
):
    emp = _get_employee_or_404(session, employee_id)
    # Delete attendance records first (keeps it simple across DBs)
    session.exec(delete(Attendance).where(Attendance.employee_pk == emp.id))
    session.delete(emp)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    "/employees/{employee_id}/attendance",
    response_model=AttendanceRead,
    status_code=status.HTTP_201_CREATED,
)
def mark_attendance(
    payload: AttendanceCreate,
    employee_id: str = Path(min_length=1, max_length=50),
    session: Session = Depends(get_session),
):
    emp = _get_employee_or_404(session, employee_id)

    existing = session.exec(
        select(Attendance).where((Attendance.employee_pk == emp.id) & (Attendance.date == payload.date))
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance already marked for this date",
        )

    att = Attendance(employee_pk=emp.id, date=payload.date, status=payload.status)
    session.add(att)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance already marked for this date",
        )
    session.refresh(att)
    return AttendanceRead(date=att.date, status=att.status, created_at=att.created_at)


@app.get("/employees/{employee_id}/attendance", response_model=List[AttendanceRead])
def list_attendance(
    employee_id: str = Path(min_length=1, max_length=50),
    start_date: Optional[dt.date] = Query(default=None),
    end_date: Optional[dt.date] = Query(default=None),
    status_filter: Optional[AttendanceStatus] = Query(default=None, alias="status"),
    session: Session = Depends(get_session),
):
    emp = _get_employee_or_404(session, employee_id)

    q = select(Attendance).where(Attendance.employee_pk == emp.id)
    if start_date:
        q = q.where(Attendance.date >= start_date)
    if end_date:
        q = q.where(Attendance.date <= end_date)
    if status_filter:
        q = q.where(Attendance.status == status_filter)

    q = q.order_by(Attendance.date.desc())
    rows = session.exec(q).all()
    return [AttendanceRead(date=r.date, status=r.status, created_at=r.created_at) for r in rows]


@app.get("/dashboard", response_model=DashboardRead)
def dashboard(session: Session = Depends(get_session)):
    today = dt.date.today()

    employee_count = session.exec(select(func.count()).select_from(Employee)).one()
    attendance_records = session.exec(select(func.count()).select_from(Attendance)).one()

    today_present = session.exec(
        select(func.count())
        .select_from(Attendance)
        .where((Attendance.date == today) & (Attendance.status == AttendanceStatus.present))
    ).one()
    today_absent = session.exec(
        select(func.count())
        .select_from(Attendance)
        .where((Attendance.date == today) & (Attendance.status == AttendanceStatus.absent))
    ).one()

    return DashboardRead(
        employee_count=int(employee_count),
        attendance_records=int(attendance_records),
        today_present=int(today_present),
        today_absent=int(today_absent),
        today_date=today,
    )
