from dataclasses import dataclass
from datetime import datetime

@dataclass
class UserEntity:
    id: int | None = None
    username: str | None = None
    password_hash: str | None = None
    created_at: datetime | None = None