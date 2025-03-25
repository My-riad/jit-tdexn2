# Build stage
FROM nvidia/cuda:11.8.0-base-ubuntu22.04 AS build

# Set working directory
WORKDIR /build

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    gcc \
    g++ \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    libproj-dev \
    libspatialindex-dev \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python 3.11
RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3.11-distutils \
    python3.11-venv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Create and activate virtual environment
RUN python3.11 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    numpy==1.24.3 \
    pandas==2.1.0 \
    scikit-learn==1.3.0 \
    tensorflow==2.13.0 \
    torch==2.0.1 \
    fastapi==0.103.1 \
    uvicorn==0.23.2 \
    pydantic==2.4.0 \
    ortools==9.7.2996 \
    geopandas==0.13.2 \
    boto3==1.28.38 \
    kafka-python==2.0.2 \
    redis==4.6.0 \
    psycopg2-binary==2.9.7 \
    sqlalchemy==2.0.20 \
    python-dotenv==1.0.0

# Create model directory
RUN mkdir -p /build/models

# Copy application source code
COPY . /build/

# Final stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_ENV=production \
    PORT=3003 \
    OPTIMIZATION_ENGINE_PORT=3003 \
    OPTIMIZATION_ENGINE_HOST=0.0.0.0 \
    MODEL_REGISTRY_PATH=/app/models \
    PATH="/opt/venv/bin:$PATH"

# Install system runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libpq5 \
    libgdal30 \
    libproj19 \
    libspatialindex6 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from build stage
COPY --from=build /opt/venv /opt/venv

# Copy application code from build stage
COPY --from=build /build /app

# Create non-root user for security
RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app && \
    mkdir -p /app/models && \
    chown -R appuser:appuser /app/models

# Create volume for ML models
VOLUME /app/models

# Expose the application port
EXPOSE 3003

# Set the user to run the container
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl --fail http://localhost:3003/health || exit 1

# Define the entry point command
ENTRYPOINT ["python", "-m", "src.index"]