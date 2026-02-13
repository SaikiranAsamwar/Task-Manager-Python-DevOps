FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app app
COPY run.py .


EXPOSE 8888

# Use Gunicorn for production
RUN mkdir -p app/templates

CMD ["gunicorn", "--bind", "0.0.0.0:8888", "--workers", "4", "--timeout", "120", "run:app"]
