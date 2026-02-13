"""
Main entry point for the Flask application
"""

from flask import Flask
from app import create_app, db
import os

app = create_app()

# 🔥 Tell Flask where templates actually are
app.template_folder = 'app/templates'

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_ENV') != 'production'

    app.run(
        host='0.0.0.0',
        port=8888,
        debug=debug_mode
    )
