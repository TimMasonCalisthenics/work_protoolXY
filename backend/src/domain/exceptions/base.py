class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, payload: any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload

class ConflictError(AppError):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, 409)

class EntityNotFoundError(AppError):
    def __init__(self, entity: str, identifier: any):
        super().__init__(f"{entity} '{identifier}' not found", 404)

class ForbiddenError(AppError):
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, 403)