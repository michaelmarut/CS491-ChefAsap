# Blueprint package for organizing API endpoints
from .auth_bp import auth_bp
from .booking_bp import booking_bp
from .profile_bp import profile_bp

__all__ = ['auth_bp', 'booking_bp', 'profile_bp']