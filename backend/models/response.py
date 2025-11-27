"""
API Response Wrapper Models for Eureka CMMS

This module defines generic API response wrapper Pydantic models for consistent
API responses across all endpoints. Provides standardized success, error, and
paginated response formats.

Models:
    - APIResponse: Generic success response with data payload
    - PaginatedResponse: Paginated list response with metadata
    - ErrorResponse: Standardized error response
    - ValidationErrorResponse: Validation error with field details
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

# Type variable for generic responses
T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Generic API success response wrapper.
    
    Used for all successful API responses to provide consistent structure.
    Wraps the actual data payload with success flag and optional message.
    
    Example:
        ```python
        user = User(id=..., name="John Doe")
        response = APIResponse[User](
            success=True,
            message="User retrieved successfully",
            data=user
        )
        ```
    """
    
    success: bool = Field(
        True,
        description="Indicates whether the request was successful. Always True for this response type"
    )
    
    message: Optional[str] = Field(
        None,
        description="Optional human-readable message describing the result"
    )
    
    data: T = Field(
        ...,
        description="The actual response data payload (can be any type)"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Paginated API response wrapper for list endpoints.
    
    Used for endpoints that return paginated lists of items.
    Includes pagination metadata (total count, page number, page size, etc.)
    along with the list of items.
    
    Example:
        ```python
        users = [User(...), User(...)]
        response = PaginatedResponse[User](
            items=users,
            total=100,
            page=1,
            page_size=20,
            total_pages=5
        )
        ```
    """
    
    items: List[T] = Field(
        ...,
        description="List of items for the current page"
    )
    
    total: int = Field(
        ...,
        ge=0,
        description="Total number of items across all pages"
    )
    
    page: int = Field(
        ...,
        ge=1,
        description="Current page number (1-indexed)"
    )
    
    page_size: int = Field(
        ...,
        ge=1,
        description="Number of items per page"
    )
    
    total_pages: int = Field(
        ...,
        ge=0,
        description="Total number of pages (calculated from total and page_size)"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility


class ErrorResponse(BaseModel):
    """
    Standardized API error response wrapper.
    
    Used for all error responses to provide consistent error structure.
    Includes error code, message, and optional details for debugging.
    
    Example:
        ```python
        response = ErrorResponse(
            success=False,
            error_code="NOT_FOUND",
            message="Resource not found",
            details={"resource_id": "123", "resource_type": "user"}
        )
        ```
    """
    
    success: bool = Field(
        False,
        description="Indicates whether the request was successful. Always False for this response type"
    )
    
    error_code: str = Field(
        ...,
        description="Machine-readable error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR', 'UNAUTHORIZED')"
    )
    
    message: str = Field(
        ...,
        description="Human-readable error message describing what went wrong"
    )
    
    details: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional additional error details for debugging (e.g., field errors, stack traces in dev)"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility


class ValidationErrorResponse(BaseModel):
    """
    Validation error response with field-level error details.
    
    Used specifically for request validation errors (422 status).
    Provides detailed field-level validation errors to help clients
    identify and fix input issues.
    
    Example:
        ```python
        response = ValidationErrorResponse(
            success=False,
            error_code="VALIDATION_ERROR",
            message="Request validation failed",
            field_errors={
                "email": ["Invalid email format"],
                "age": ["Must be a positive integer"]
            }
        )
        ```
    """
    
    success: bool = Field(
        False,
        description="Indicates whether the request was successful. Always False for this response type"
    )
    
    error_code: str = Field(
        "VALIDATION_ERROR",
        description="Machine-readable error code. Always 'VALIDATION_ERROR' for this response type"
    )
    
    message: str = Field(
        "Request validation failed",
        description="Human-readable error message"
    )
    
    field_errors: Dict[str, List[str]] = Field(
        ...,
        description="Dictionary mapping field names to lists of validation error messages for that field"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility

