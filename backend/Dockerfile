# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies including production server
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend application files
COPY app/ ./app/
COPY run.py config.py utils.py ./

# Set working directory to parent for proper path resolution
WORKDIR /app

# Copy frontend files from project root
# Note: When building, use context from project root: docker build -f backend/Dockerfile .
COPY frontend/ ./frontend/

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port 5000
EXPOSE 5000

# Set environment variables
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/').read()"

# Run with Gunicorn for production
# The app object is in backend/run.py, so we need to adjust the path
WORKDIR /app/backend
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "run:app"]
