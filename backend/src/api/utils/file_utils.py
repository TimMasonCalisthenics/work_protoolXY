import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file, folder='products'):
    if not file or file.filename == '':
        return None

    if not allowed_file(file.filename):
        raise ValueError(f"File type not allowed: {file.filename}")

    # Use absolute path for upload folder
    base_upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
    target_folder = os.path.join(base_upload_folder, folder)

    if not os.path.exists(target_folder):
        os.makedirs(target_folder)

    filename = secure_filename(file.filename)
    # Generate unique filename to avoid collisions
    unique_filename = f"{uuid.uuid4().hex}_{filename}"

    file_path = os.path.join(target_folder, unique_filename)
    file.save(file_path)

    # Return relative URL
    return f"/static/uploads/{folder}/{unique_filename}"
def delete_file(file_path):
    try:
        base_upload_folder = os.path.join(current_app.root_path)
        for path in file_path:
            if not path:
                continue
            relative_path = path.lstrip('/')
            file_path = os.path.join(base_upload_folder, relative_path)
            if os.path.exists(file_path):
                os.remove(file_path)
        return True
    except Exception as e:
        current_app.logger.error(f"Error deleting file: {e}")
        return False