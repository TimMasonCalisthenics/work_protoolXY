from enum import Enum

class CommonEnum(Enum):

    Airgauge = "air_gauge"
    Airgauge_X_axis = "air_gauge_x"
    Airgauge_Y_axis = "air_gauge_y"
    Mitutoyo = "mitutoyo"
    QrCode = "qrcode"
    
    Pending = "pending"
    LessThan = "less than"
    GreaterThan = "more than"
    Normal = "normal"
    Ready = "ready"

    
    Completed = "completed"
    Ng = "ng"
    Pass = "pass"