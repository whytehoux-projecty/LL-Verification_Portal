"""
Session code generation and validation utilities
"""
import random
import string
from datetime import datetime, timedelta


def generate_session_code() -> str:
    """
    Generate a unique 6-character alphanumeric session code
    
    Returns:
        6-character uppercase alphanumeric code (e.g., "A3X9K2")
    """
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=6))


def is_code_expired(expires_at: datetime) -> bool:
    """
    Check if a session code has expired
    
    Args:
        expires_at: Expiration datetime
        
    Returns:
        True if code has expired, False otherwise
    """
    return datetime.utcnow() > expires_at


def get_code_expiry(hours: int = 24) -> datetime:
    """
    Get expiry datetime for a session code
    
    Args:
        hours: Number of hours until expiration (default: 24)
        
    Returns:
        Datetime object representing expiration time
    """
    return datetime.utcnow() + timedelta(hours=hours)


def format_session_code(code: str) -> str:
    """
    Format session code for display (e.g., "ABC123" -> "ABC-123")
    
    Args:
        code: 6-character session code
        
    Returns:
        Formatted code with hyphen
    """
    if len(code) != 6:
        return code
    return f"{code[:3]}-{code[3:]}"


def validate_session_code_format(code: str) -> bool:
    """
    Validate session code format
    
    Args:
        code: Session code to validate
        
    Returns:
        True if format is valid (6 alphanumeric characters)
    """
    if not code or len(code) != 6:
        return False
    return code.isalnum() and code.isupper()
