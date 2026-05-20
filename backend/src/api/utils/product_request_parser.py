import json
from flask import request
from api.utils.file_utils import save_uploaded_file
def parse_product_request(schema_class):
    if 'data' not in request.form:
        return schema_class.model_validate(request.json)
        # return schema_class(**request.json)

    raw_data = request.form.get('data')
    product_dict = json.loads(raw_data)

    # Map uploaded files
    all_files = {
        file.filename: file
        for key in request.files
        for file in request.files.getlist(key)
    }

    # Handle product images
    if 'image_url' in product_dict:
        new_image_urls = []
        for img_item in product_dict.get('image_url', []):
            if img_item in all_files:
                url = save_uploaded_file(all_files[img_item], folder='products')
                if url:
                    new_image_urls.append(url)
            else:
                new_image_urls.append(img_item)
        product_dict['image_url'] = new_image_urls

    # Handle spec point images
    for pt in product_dict.get('spec_points', []):
        img_name = pt.get('point_image_url')
        if img_name and img_name in all_files:
            pt['point_image_url'] = save_uploaded_file(
                all_files[img_name], folder='points'
            )

    return schema_class(**product_dict)