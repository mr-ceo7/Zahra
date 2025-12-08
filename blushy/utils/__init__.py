from functools import wraps
from flask import jsonify
from blushy.models import Message

def require_json(f):
    """Decorator to require JSON content-type"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        return f(*args, **kwargs)
    return decorated_function

def get_or_404_message(link_id):
    """Get message by link_id or return 404 error"""
    message = Message.query.filter_by(link_id=link_id).first()
    
    if not message:
        return None, ({'error': 'Message not found'}, 404)
    
    if message.is_expired():
        return None, ({'error': 'This message has expired'}, 410)
    
    return message, None

def validate_message_data(data):
    """Validate message creation data"""
    errors = []
    
    if not data.get('text'):
        errors.append('Message text is required')
    elif len(data.get('text', '')) > 500:
        errors.append('Message text must be under 500 characters')
    
    if data.get('fontSize'):
        try:
            size = int(data['fontSize'])
            if size < 12 or size > 200:
                errors.append('Font size must be between 12 and 200')
        except (ValueError, TypeError):
            errors.append('Font size must be a valid number')
    
    return errors
