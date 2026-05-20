from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class Product:
    id: int
    product_name: str
    spec_config: Dict[str, Any]
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    #for logic