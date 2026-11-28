from pydantic import BaseModel, Field


class OpenApiMetadataSerializer(BaseModel):
    """Schema metadata describing API versions and documentation links."""

    title: str = Field(description="Title of the API specification")
    version: str = Field(description="SemVer API version")
    enabled: bool = Field(description="Whether HTTP API documentation is enabled")
    docs_url: str | None = Field(description="Swagger UI URL, or null when disabled")
    redoc_url: str | None = Field(description="ReDoc URL, or null when disabled")
    openapi_url: str | None = Field(
        description="OpenAPI JSON URL, or null when disabled"
    )
    tags: list[str] = Field(description="List of primary categorized route tags")


class ApiEndpointInfoSerializer(BaseModel):
    """Information regarding an API version path and its supported sub-resources."""

    prefix: str = Field(description="URL prefix for the API version")
    status: str = Field(description="Lifecycle status of this API version")
    is_default: bool = Field(description="Whether this prefix is the primary default")
    resources: list[str] = Field(
        description="Available resource endpoints under this prefix"
    )


class ApiVersionOverviewSerializer(BaseModel):
    """API version overview and discovery payload."""

    service: str = Field(description="Service identification name")
    current_version: str = Field(description="Current primary API version prefix")
    available_versions: list[ApiEndpointInfoSerializer] = Field(
        description="List of active API versions"
    )
    documentation: OpenApiMetadataSerializer = Field(
        description="Links to interactive API documentation"
    )
