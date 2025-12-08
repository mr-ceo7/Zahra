from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import uuid
import string
import random

db = SQLAlchemy()

class Message(db.Model):
    """Message model for storing customized messages"""
    __tablename__ = 'messages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Unique short link ID (e.g., "abc123")
    link_id = db.Column(db.String(8), unique=True, nullable=False, index=True)
    
    # Message content
    text = db.Column(db.Text, nullable=False)
    
    # Customization settings (JSON stored as string for simplicity)
    primary_color = db.Column(db.String(7), default="#FF69B4")  # Hex color
    secondary_color = db.Column(db.String(7), default="#FFB6D9")
    background_color = db.Column(db.String(7), default="#0f0c29")
    
    # Emojis (comma-separated or JSON)
    emojis = db.Column(db.Text, default="✨,💕,🤭")
    
    # Animation settings
    transition_type = db.Column(db.String(50), default="fadeIn")  # fadeIn, slideIn, bounce, etc.
    animation_duration = db.Column(db.Integer, default=2000)  # milliseconds
    
    # Font customization
    font_family = db.Column(db.String(100), default="Poppins")
    font_size = db.Column(db.Integer, default=48)
    
    # Background effect
    background_effect = db.Column(db.String(50), default="gradient")  # gradient, orbs, particles
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=30))
    
    def is_expired(self):
        """Check if message has expired"""
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        """Convert to dictionary for JSON response"""
        return {
            'id': self.id,
            'link_id': self.link_id,
            'text': self.text,
            'primaryColor': self.primary_color,
            'secondaryColor': self.secondary_color,
            'backgroundColor': self.background_color,
            'emojis': self.emojis.split(','),
            'transitionType': self.transition_type,
            'animationDuration': self.animation_duration,
            'fontFamily': self.font_family,
            'fontSize': self.font_size,
            'backgroundEffect': self.background_effect,
            'createdAt': self.created_at.isoformat(),
            'expiresAt': self.expires_at.isoformat(),
        }

    @staticmethod
    def generate_link_id():
        """Generate a unique short link ID"""
        chars = string.ascii_letters + string.digits
        while True:
            link_id = ''.join(random.choice(chars) for _ in range(8))
            if not Message.query.filter_by(link_id=link_id).first():
                return link_id
