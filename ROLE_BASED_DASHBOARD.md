# Task Manager - Role-Based Dashboard System

## Overview
This application now features a comprehensive role-based dashboard system with two distinct user types: **Team Lead** and **Team Member**, each with specific capabilities and permissions.

## User Roles

### 1. Team Lead
Team leads have full administrative capabilities to manage team members and tasks.

#### Capabilities:
- ✅ **Create Users** - Add new team members or team leads
- ✅ **Assign Tasks** - Create and assign tasks to team members
- ✅ **Delete Users** - Remove team members from the system
- ✅ **Delete Tasks** - Remove tasks from the system
- ✅ **Manage Tasks** - View all assigned tasks and their status
- ✅ **Manage Users** - View and manage all team members
- ✅ **View Analytics** - Access dashboard statistics and metrics
- ✅ **Approve Tasks** - Review and approve completed tasks
- ✅ **Task Progress Tracking** - Monitor task status (pending, in progress, completed, approved)
- ✅ **Notifications** - Receive notifications when tasks are completed

#### Dashboard Features:
- Statistics cards showing team metrics
- Quick action buttons for common tasks
- Tabbed interface for tasks, users, and notifications
- Task management table with filtering
- Team member management interface
- Real-time notification system

### 2. Team Member
Team members have task-focused capabilities to receive, work on, and complete assignments.

#### Capabilities:
- ✅ **Receive Tasks** - View all tasks assigned by team leads
- ✅ **Mark as Done** - Complete tasks and mark them as done
- ✅ **Upload Results** - Submit task results and notes
- ✅ **View Task Details** - Access full task information
- ✅ **Notifications** - Receive notifications about task assignments and approvals
- ✅ **Task Status Tracking** - Track personal task progress

#### Dashboard Features:
- Personal task statistics
- Task cards with priority and status indicators
- Task completion interface with result submission
- Notification center
- Clean, focused interface for task management

## Login System

The login page now features:
- **User Type Selection**: Choose between Team Lead or Team Member
- **Simple Authentication**: Username and full name entry
- **Role-Based Routing**: Automatic redirect to the appropriate dashboard

## Task Workflow

### 1. Task Assignment (Team Lead)
1. Team lead creates a task
2. Assigns it to a team member
3. Sets priority (low, medium, high)
4. Sets due date (optional)
5. System sends notification to team member

### 2. Task Completion (Team Member)
1. Team member views assigned tasks
2. Clicks "Complete Task"
3. Enters task results/notes
4. Submits completion
5. System sends notification to team lead

### 3. Task Approval (Team Lead)
1. Team lead receives notification of completed task
2. Reviews task details and results
3. Approves the task
4. System sends approval notification to team member

## Task Statuses

- **Pending**: Task assigned but not started
- **In Progress**: Task being worked on
- **Completed**: Task done, awaiting approval
- **Approved**: Task approved by team lead

## Notifications

Both roles receive real-time notifications:
- **Team Lead**: Notified when tasks are completed
- **Team Member**: Notified when tasks are assigned or approved

Notification features:
- Unread badge indicator
- Mark as read functionality
- Automatic polling every 30 seconds
- Timestamp for each notification

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: User email
- `full_name`: Display name
- `role`: 'lead' or 'member'
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Tasks Table
- `id`: Primary key
- `user_id`: Creator (team lead)
- `assigned_to`: Assignee (team member)
- `assigned_by`: Assigner (team lead)
- `title`: Task title
- `description`: Task details
- `completed`: Boolean flag
- `approved`: Boolean flag
- `status`: pending, in_progress, completed, approved
- `priority`: low, medium, high
- `result`: Task completion notes
- `created_at`: Task creation timestamp
- `updated_at`: Last update timestamp
- `due_date`: Optional deadline
- `completed_at`: Completion timestamp

### Notifications Table
- `id`: Primary key
- `user_id`: Recipient
- `task_id`: Related task
- `message`: Notification text
- `read`: Boolean flag
- `created_at`: Notification timestamp

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user with role

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `GET /api/users/<id>` - Get user by ID
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user
- `GET /api/users/members` - Get all team members

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/<id>` - Get task by ID
- `PUT /api/tasks/<id>` - Update task
- `DELETE /api/tasks/<id>` - Delete task
- `POST /api/tasks/assign` - Assign task to member
- `PUT /api/tasks/<id>/complete` - Mark task complete
- `PUT /api/tasks/<id>/approve` - Approve task
- `GET /api/tasks/assigned?user_id=<id>` - Get tasks assigned to user
- `GET /api/tasks/created?user_id=<id>` - Get tasks created by user

### Notifications
- `GET /api/notifications/<user_id>` - Get user notifications
- `PUT /api/notifications/<id>/read` - Mark notification as read

## Setup Instructions

### 1. Database Migration
After pulling these changes, you need to update your database:

```bash
# Navigate to backend directory
cd backend

# Drop existing database (WARNING: This will delete all data)
# Then restart the application to recreate tables
python run.py
```

### 2. Start the Application

```bash
# Start backend (from backend directory)
python run.py

# Backend will run on http://localhost:5000
```

### 3. Access the Application

1. Open browser to `http://localhost:5000`
2. Select user type (Team Lead or Team Member)
3. Enter username and full name
4. Click Login

## Usage Examples

### Example 1: Team Lead Creates a Task
1. Login as Team Lead
2. Click "Assign Task" button
3. Fill in task details:
   - Title: "Implement login feature"
   - Description: "Add user authentication"
   - Assign to: Select team member
   - Priority: High
   - Due date: Tomorrow
4. Click "Assign Task"
5. Team member receives notification

### Example 2: Team Member Completes a Task
1. Login as Team Member
2. View assigned tasks
3. Click "Complete Task" on a task
4. Enter results: "Implemented JWT authentication"
5. Click "Submit Task"
6. Team lead receives notification

### Example 3: Team Lead Approves a Task
1. Login as Team Lead
2. Click notification about completed task
3. View task details and results
4. Click "Approve" button
5. Team member receives approval notification

## File Structure

```
frontend/
├── templates/
│   ├── login.html              # Login page with role selection
│   ├── lead-dashboard.html     # Team lead dashboard
│   └── member-dashboard.html   # Team member dashboard
└── js/
    ├── lead-dashboard.js       # Team lead functionality
    └── member-dashboard.js     # Team member functionality

backend/
├── app/
│   ├── models.py              # Database models (User, Task, Notification)
│   └── routes.py              # API endpoints
```

## Security Considerations

⚠️ **Note**: This implementation uses session storage for authentication. For production use, implement:
- Proper password hashing
- JWT or session-based authentication
- HTTPS
- CSRF protection
- Input validation and sanitization
- Rate limiting

## Future Enhancements

Potential improvements:
- [ ] Password authentication
- [ ] Task comments/discussion
- [ ] File attachments for tasks
- [ ] Task categories and tags
- [ ] Advanced filtering and search
- [ ] Export reports
- [ ] Email notifications
- [ ] Mobile responsive design improvements
- [ ] Task time tracking
- [ ] Performance analytics

## Troubleshooting

### Issue: Cannot login
- Ensure backend server is running
- Check browser console for errors
- Clear session storage: `sessionStorage.clear()`

### Issue: Notifications not updating
- Check browser console for API errors
- Ensure user_id is correct
- Verify backend is running

### Issue: Tasks not appearing
- Check user role matches dashboard
- Verify tasks are assigned correctly
- Check API endpoint responses

## Support

For issues or questions:
1. Check the console for error messages
2. Verify all files are in correct locations
3. Ensure database is properly initialized
4. Review API endpoint responses

## License

This project is part of the Resume-Projects/Python-DevOps repository.
