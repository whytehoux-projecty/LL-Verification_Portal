"""
Input sanitization utilities to prevent XSS and injection attacks
"""
import bleach
from typing import Any, Dict, List, Union


# Allowed HTML tags (empty for complete sanitization)
ALLOWED_TAGS: List[str] = []
ALLOWED_ATTRIBUTES: Dict[str, List[str]] = {}


def sanitize_string(value: str) -> str:
    """
    Remove all HTML tags and dangerous characters from a string
    
    Args:
        value: Input string to sanitize
        
    Returns:
        Sanitized string with all HTML removed
    """
    if not isinstance(value, str):
        return value
    
    return bleach.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    ).strip()


def sanitize_dict(data: dict) -> dict:
    """
    Recursively sanitize all string values in a dictionary
    
    Args:
        data: Dictionary to sanitize
        
    Returns:
        Dictionary with all string values sanitized
    """
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_string(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_string(v) if isinstance(v, str) else v 
                for v in value
            ]
        else:
            sanitized[key] = value
    return sanitized


def sanitize_list(data: list) -> list:
    """
    Sanitize all string values in a list
    
    Args:
        data: List to sanitize
        
    Returns:
        List with all string values sanitized
    """
    return [
        sanitize_string(item) if isinstance(item, str) 
        else sanitize_dict(item) if isinstance(item, dict)
        else item
        for item in data
    ]


def validate_email(email: str) -> bool:
    """
    Basic email validation
    
    Args:
        email: Email address to validate
        
    Returns:
        True if email format is valid
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal attacks
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    import os
    import re
    
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove dangerous characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    
    return filename
