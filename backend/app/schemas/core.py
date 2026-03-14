import re
from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator


class CoreModel(BaseModel):
    """
    Base Pydantic model for MediSync.
    Enforces global data cleaning rules to prevent security vulnerabilities like XSS.
    All schemas should inherit from this class.
    """

    model_config = ConfigDict(
        # Globally strip leading/trailing whitespace from all strings
        str_strip_whitespace=True,
        # Forbid extra fields to prevent mass assignment vulnerabilities
        extra="forbid",
        # Allow population from ORM attributes
        from_attributes=True,
    )

    @model_validator(mode="before")
    @classmethod
    def prevent_xss(cls, data: Any) -> Any:
        """
        Validates all incoming dictionary values to ensure they do not contain
        potential HTML tags or script injection attempts.
        """
        if isinstance(data, dict):
            # Basic pattern to detect HTML-like tags (<something>)
            html_pattern = re.compile(r"<[^>]*>")
            
            for key, value in data.items():
                if isinstance(value, str):
                    if html_pattern.search(value):
                        raise ValueError(f"Potential XSS detected in field '{key}': HTML tags are strictly prohibited.")
        
        return data

