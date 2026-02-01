from flask import Blueprint, request, jsonify, render_template
from app import db
from app.models import User, Task, Notification
from sqlalchemy.exc import IntegrityError
from datetime import datetime

main_bp = Blueprint('main', __name__)
api_bp = Blueprint('api', __name__)


# Health check endpoints for Kubernetes
@api_bp.route('/health', methods=['GET'])
def health_check():
    """Liveness probe - check if app is running"""
    return jsonify({"status": "healthy"}), 200


@api_bp.route('/ready', methods=['GET'])
def readiness_check():
    """Readiness probe - check if app can serve traffic"""
    try:
        # Check database connection
        db.session.execute(db.text('SELECT 1'))
        return jsonify({"status": "ready"}), 200
    except Exception as e:
        return jsonify({"status": "not ready", "error": str(e)}), 503


# Main Routes (for serving HTML)
@main_bp.route('/')
def index():
    """Redirect to login page"""
    return render_template('login.html')


@main_bp.route('/login')
def login():
    """Serve the login page"""
    return render_template('login.html')


@main_bp.route('/register')
def register():
    """Serve the registration page"""
    return render_template('register.html')


@main_bp.route('/dashboard')
def dashboard():
    """Serve the dashboard page"""
    return render_template('dashboard.html')


@main_bp.route('/lead-dashboard')
def lead_dashboard():
    """Serve the team lead dashboard page"""
    return render_template('lead-dashboard.html')


@main_bp.route('/member-dashboard')
def member_dashboard():
    """Serve the team member dashboard page"""
    return render_template('member-dashboard.html')


@main_bp.route('/users')
def users_page():
    """Serve the users management page"""
    return render_template('users.html')


@main_bp.route('/tasks')
def tasks_page():
    """Serve the tasks management page"""
    return render_template('tasks.html')


@main_bp.route('/analytics')
def analytics():
    """Serve the analytics page"""
    return render_template('analytics.html')


@main_bp.route('/settings')
def settings():
    """Serve the settings page"""
    return render_template('settings.html')


@main_bp.route('/reports')
def reports():
    """Serve the reports page"""
    return render_template('reports.html')


@main_bp.route('/profile')
def profile():
    """Serve the profile page"""
    return render_template('profile.html')


@main_bp.route('/calendar')
def calendar():
    """Serve the calendar page"""
    return render_template('calendar.html')


@main_bp.route('/notifications')
def notifications():
    """Serve the notifications page"""
    return render_template('notifications.html')


# API Routes - Users
@api_bp.route('/users', methods=['GET'])
def get_users():
    """Get all users"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@api_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get a specific user by ID"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200


@api_bp.route('/users', methods=['POST'])
def create_user():
    """Create a new user"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not all(k in data for k in ('username', 'email', 'full_name')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            role=data.get('role', 'member')  # Default to member
        )
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Username or email already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update a user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    try:
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        db.session.commit()
        return jsonify(user.to_dict()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Username or email already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# API Routes - Tasks
@api_bp.route('/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks or filter by user"""
    user_id = request.args.get('user_id', type=int)
    
    if user_id:
        tasks = Task.query.filter_by(user_id=user_id).all()
    else:
        tasks = Task.query.all()
    
    return jsonify([task.to_dict() for task in tasks]), 200


@api_bp.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """Get a specific task by ID"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify(task.to_dict()), 200


@api_bp.route('/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not all(k in data for k in ('user_id', 'title')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user exists
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        task = Task(
            user_id=data['user_id'],
            title=data['title'],
            description=data.get('description'),
            priority=data.get('priority', 'medium'),
            due_date=datetime.fromisoformat(data['due_date']) if 'due_date' in data else None
        )
        db.session.add(task)
        db.session.commit()
        return jsonify(task.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    try:
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'completed' in data:
            task.completed = data['completed']
        if 'priority' in data:
            task.priority = data['priority']
        if 'due_date' in data:
            task.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
        
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# API Routes - Authentication
@api_bp.route('/auth/register', methods=['POST'])
def register_user():
    """Register a new user"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ('username', 'email', 'full_name', 'role')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    try:
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            role=data['role'],
            password=data.get('password')  # Store password if provided
        )
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/auth/login', methods=['POST'])
def login_user():
    """Authenticate existing user and return user info"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ('username', 'password', 'role')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user exists with matching username and role
    user = User.query.filter_by(username=data['username'], role=data['role']).first()
    
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Verify password (simple comparison - in production, use hashed passwords)
    if user.password != data['password']:
        return jsonify({'error': 'Invalid username or password'}), 401
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    }), 200


# API Routes - Task Assignment (Team Lead only)
@api_bp.route('/tasks/assign', methods=['POST'])
def assign_task():
    """Assign a task to a team member"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ('title', 'assigned_to', 'assigned_by')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify assigner is a team lead
    assigner = User.query.get(data['assigned_by'])
    if not assigner or assigner.role != 'lead':
        return jsonify({'error': 'Only team leads can assign tasks'}), 403
    
    # Verify assignee exists
    assignee = User.query.get(data['assigned_to'])
    if not assignee:
        return jsonify({'error': 'Assignee not found'}), 404
    
    try:
        task = Task(
            user_id=data['assigned_by'],
            assigned_to=data['assigned_to'],
            assigned_by=data['assigned_by'],
            title=data['title'],
            description=data.get('description'),
            priority=data.get('priority', 'medium'),
            status='pending',
            due_date=datetime.fromisoformat(data['due_date']) if 'due_date' in data else None
        )
        db.session.add(task)
        
        # Create notification for assignee
        notification = Notification(
            user_id=data['assigned_to'],
            task_id=task.id,
            message=f"New task assigned: {task.title}"
        )
        db.session.add(notification)
        
        db.session.commit()
        return jsonify(task.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# API Routes - Task Completion (Team Member)
@api_bp.route('/tasks/<int:task_id>/complete', methods=['PUT'])
def complete_task(task_id):
    """Mark task as completed and upload result"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    try:
        task.completed = True
        task.status = 'completed'
        task.result = data.get('result', '')
        task.completed_at = datetime.utcnow()
        
        # Notify team lead
        if task.assigned_by:
            notification = Notification(
                user_id=task.assigned_by,
                task_id=task.id,
                message=f"Task '{task.title}' has been completed by team member"
            )
            db.session.add(notification)
        
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# API Routes - Task Approval (Team Lead)
@api_bp.route('/tasks/<int:task_id>/approve', methods=['PUT'])
def approve_task(task_id):
    """Approve a completed task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    user_id = data.get('user_id')
    
    # Verify user is team lead
    user = User.query.get(user_id)
    if not user or user.role != 'lead':
        return jsonify({'error': 'Only team leads can approve tasks'}), 403
    
    try:
        task.approved = True
        task.status = 'approved'
        
        # Notify team member
        if task.assigned_to:
            notification = Notification(
                user_id=task.assigned_to,
                task_id=task.id,
                message=f"Task '{task.title}' has been approved"
            )
            db.session.add(notification)
        
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# API Routes - Get Tasks by Assignment
@api_bp.route('/tasks/assigned', methods=['GET'])
def get_assigned_tasks():
    """Get tasks assigned to a specific user"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    tasks = Task.query.filter_by(assigned_to=user_id).all()
    return jsonify([task.to_dict() for task in tasks]), 200


@api_bp.route('/tasks/created', methods=['GET'])
def get_created_tasks():
    """Get tasks created by a specific user (team lead)"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    tasks = Task.query.filter_by(assigned_by=user_id).all()
    return jsonify([task.to_dict() for task in tasks]), 200


# API Routes - Notifications
@api_bp.route('/notifications/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    """Get all notifications for a user"""
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([notif.to_dict() for notif in notifications]), 200


@api_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    try:
        notification.read = True
        db.session.commit()
        return jsonify(notification.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# API Routes - Team Members (Team Lead view)
@api_bp.route('/users/members', methods=['GET'])
def get_team_members():
    """Get all team members"""
    members = User.query.filter_by(role='member').all()
    return jsonify([member.to_dict() for member in members]), 200


# Health check endpoint
@api_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'API is running'}), 200
