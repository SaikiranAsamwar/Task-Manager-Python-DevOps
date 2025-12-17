"""
Main entry point for the Flask application
Run: python run.py
"""
from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True  # Enable debug mode to see errors
    )
