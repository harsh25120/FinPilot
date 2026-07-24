def validate_password_strength(password: str) -> str:
    """Require at least one letter and one digit in a password."""
    if not any(character.isalpha() for character in password):
        raise ValueError("Password must contain at least one letter")
    if not any(character.isdigit() for character in password):
        raise ValueError("Password must contain at least one digit")
    return password


def normalize_currency_code(value: str) -> str:
    return value.strip().upper()
