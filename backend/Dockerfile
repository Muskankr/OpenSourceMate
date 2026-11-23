# syntax=docker/dockerfile:1
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install curl for container health checks and clean up apt cache
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root system user and group for container security
RUN groupadd --gid 10001 appgroup \
    && useradd --uid 10001 --gid appgroup --shell /bin/bash --create-home appuser

# Copy dependency specifications first to leverage Docker layer caching
COPY requirements.txt ./
COPY requirements/ ./requirements/

# Install Python dependencies (no secrets baked into image)
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code and project configuration
COPY app/ ./app/
COPY pyproject.toml ./

# Ensure ownership by non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 8000

# Health check against FastAPI health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start FastAPI with Uvicorn bound to 0.0.0.0
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
