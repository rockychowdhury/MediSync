import bcrypt
from passlib.context import CryptContext

# 🚨 Workaround for passlib 1.7.4 and bcrypt 4.0.0+ incompatibility
# This fix prevents "AttributeError: module 'bcrypt' has no attribute '__about__'"
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (object,), {"__version__": bcrypt.__version__})

# Bcrypt configuration for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies that a plain password matches the hashed version."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashes a password using bcrypt."""
    return pwd_context.hash(password)



