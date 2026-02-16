import os

from sqlmodel import Session, SQLModel, create_engine


def _build_engine():
    database_url = os.getenv("DATABASE_URL", "sqlite:///./hrms.db").strip()
    connect_args = {}
    if database_url.startswith("sqlite"):
        # Needed for SQLite when used in multi-threaded servers
        connect_args = {"check_same_thread": False}
    return create_engine(database_url, connect_args=connect_args)


engine = _build_engine()


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
