import os
import json
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)

# Database Configuration
# Use SQLite for local development, postgres for production
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///blush.db')
if app.config['SQLALCHEMY_DATABASE_URI'].startswith("postgres://"):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# --- Models ---
class Blush(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient_name = db.Column(db.String(100), nullable=False)
    # Storing lists/dicts as JSON strings for simplicity in SQLite/Postgres compatibility
    message_data = db.Column(db.Text, nullable=False) 
    theme_config = db.Column(db.Text, nullable=True)
    audio_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'recipient_name': self.recipient_name,
            'messages': json.loads(self.message_data) if self.message_data else [],
            'theme_config': json.loads(self.theme_config) if self.theme_config else {},
            'audio_url': self.audio_url,
            'created_at': self.created_at.isoformat()
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/v/<id>')
def view_blush(id):
    blush = Blush.query.get_or_404(id)
    # Pass data to template - or we can just render the template and let it fetch via API
    # For better SEO/Performance, passing data directly is better.
    # But for now, let's keep it consistent.
    return render_template('view.html', blush=blush) # We will create view.html later

# --- API Endpoints ---

@app.route('/api/create', methods=['POST'])
def create_blush():
    data = request.get_json()
    
    recipient_name = data.get('recipient_name')
    messages = data.get('messages')
    
    if not recipient_name or not messages:
        return jsonify({'error': 'recipient_name and messages are required'}), 400
        
    theme_config = data.get('theme_config', {})
    audio_url = data.get('audio_url')
    
    new_blush = Blush(
        recipient_name=recipient_name,
        message_data=json.dumps(messages),
        theme_config=json.dumps(theme_config),
        audio_url=audio_url
    )
    
    db.session.add(new_blush)
    db.session.commit()
    
    return jsonify({
        'message': 'Blush created successfully!',
        'id': new_blush.id,
        'url': f'/v/{new_blush.id}'
    }), 201

@app.route('/api/view/<id>', methods=['GET'])
def get_blush_data(id):
    blush = Blush.query.get_or_404(id)
    return jsonify(blush.to_dict())


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
