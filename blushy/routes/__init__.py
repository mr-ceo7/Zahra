from flask import Blueprint, request, jsonify, render_template
from blushy.models import db, Message
from blushy.utils import validate_message_data, get_or_404_message

# Create blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/messages', methods=['POST'])
def create_message():
    """Create a new message with customizations"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        errors = validate_message_data(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Create message
        message = Message(
            link_id=Message.generate_link_id(),
            text=data.get('text'),
            primary_color=data.get('primaryColor', '#FF69B4'),
            secondary_color=data.get('secondaryColor', '#FFB6D9'),
            background_color=data.get('backgroundColor', '#0f0c29'),
            emojis=','.join(data.get('emojis', ['✨', '💕', '🤭'])),
            transition_type=data.get('transitionType', 'fadeIn'),
            animation_duration=int(data.get('animationDuration', 2000)),
            font_family=data.get('fontFamily', 'Poppins'),
            font_size=int(data.get('fontSize', 48)),
            background_effect=data.get('backgroundEffect', 'gradient'),
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message.to_dict(),
            'shareLink': f'/m/{message.link_id}',
            'shareUrl': request.host_url.rstrip('/') + f'/m/{message.link_id}'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/messages/<link_id>', methods=['GET'])
def get_message(link_id):
    """Get a specific message by link_id"""
    message, error = get_or_404_message(link_id)
    
    if error:
        return jsonify(error[0]), error[1]
    
    return jsonify({
        'success': True,
        'message': message.to_dict()
    }), 200

# Routes blueprint for page rendering
pages_bp = Blueprint('pages', __name__)

@pages_bp.route('/')
def index():
    """Home page with message creator"""
    return render_template('index.html')

@pages_bp.route('/m/<link_id>')
def view_message(link_id):
    """View a message with animations"""
    message, error = get_or_404_message(link_id)
    
    if error:
        return render_template('error.html', 
                             error=error[0]['error'], 
                             code=error[1]), error[1]
    
    return render_template('viewer.html', message=message)
