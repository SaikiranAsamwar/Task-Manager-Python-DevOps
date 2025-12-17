"""
Main entry point for the Flask application
Run: python run.py
"""
from app import create_app, db
import os

app = create_app()

# Initialize database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Development server - use debug mode only in development
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=debug_mode
    )
