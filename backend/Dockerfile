# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Copy requirements file
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend application
COPY backend/ .

# Copy frontend templates to backend templates directory
COPY frontend/templates ./templates

# Copy frontend static assets (CSS, JS) to backend static directory
COPY frontend/css ./static/css
COPY frontend/js ./static/js

# Expose port 5000
EXPOSE 5000

# Set environment variable for Flask
ENV FLASK_ENV=production

# Run the application
CMD ["python", "run.py"]
