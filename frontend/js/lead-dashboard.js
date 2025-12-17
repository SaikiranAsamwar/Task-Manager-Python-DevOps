/**
 * Team Lead Dashboard - Manage team members and tasks
 */

// API base URL
const API_URL = '/api';

// Check authentication and role
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    const userRole = sessionStorage.getItem('userRole');
    
    if (isAuthenticated !== 'true' || userRole !== 'lead') {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '/login';
    }
}

// State management
let currentUser = null;
let teamMembers = [];
let allTasks = [];
let notifications = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
    currentUser = {
        id: parseInt(sessionStorage.getItem('userId')),
        username: sessionStorage.getItem('username'),
        fullName: sessionStorage.getItem('fullName'),
        role: sessionStorage.getItem('userRole')
    };
    
    // Update welcome message
    document.getElementById('welcomeMessage').textContent = 
        `Welcome back, ${currentUser.fullName || currentUser.username}!`;
    
    // Load initial data
    await loadDashboardData();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup notification polling
    setInterval(loadNotifications, 30000); // Check every 30 seconds
});

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStats(),
            loadTasks(),
            loadTeamMembers(),
            loadNotifications()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('Error loading dashboard data', 'error');
    }
}

// Load statistics
async function loadStats() {
    try {
        const [membersResponse, tasksResponse] = await Promise.all([
            fetch(`${API_URL}/users/members`),
            fetch(`${API_URL}/tasks/created?user_id=${currentUser.id}`)
        ]);
        
        if (!membersResponse.ok || !tasksResponse.ok) {
            throw new Error('Failed to load statistics');
        }
        
        const members = await membersResponse.json();
        const tasks = await tasksResponse.json();
        
        document.getElementById('totalMembers').textContent = members.length;
        document.getElementById('totalTasks').textContent = tasks.length;
        document.getElementById('pendingTasks').textContent = 
            tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
        document.getElementById('completedTasks').textContent = 
            tasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load all tasks
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks/created?user_id=${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to load tasks');
        
        allTasks = await response.json();
        renderTasksTable();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showMessage('Error loading tasks', 'error');
    }
}

// Render tasks table
function renderTasksTable() {
    const tbody = document.getElementById('tasksTableBody');
    
    if (allTasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <p style="color: #666;">No tasks yet. Create your first task!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allTasks.map(task => {
        const assignee = teamMembers.find(m => m.id === task.assigned_to);
        const assigneeName = assignee ? assignee.full_name : 'Unassigned';
        
        return `
            <tr>
                <td>${escapeHtml(task.title)}</td>
                <td>${assigneeName}</td>
                <td><span class="priority-badge priority-${task.priority}">${task.priority}</span></td>
                <td><span class="status-badge status-${task.status}">${task.status.replace('_', ' ')}</span></td>
                <td>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</td>
                <td>
                    <button class="btn-action btn-view" onclick="viewTask(${task.id})">View</button>
                    ${task.completed && !task.approved ? 
                        `<button class="btn-action btn-approve" onclick="approveTask(${task.id})">Approve</button>` : ''}
                    <button class="btn-action btn-delete" onclick="deleteTask(${task.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Load team members
async function loadTeamMembers() {
    try {
        const response = await fetch(`${API_URL}/users/members`);
        if (!response.ok) throw new Error('Failed to load team members');
        
        teamMembers = await response.json();
        renderTeamMembersTable();
        updateAssignToDropdown();
    } catch (error) {
        console.error('Error loading team members:', error);
        showMessage('Error loading team members', 'error');
    }
}

// Render team members table
function renderTeamMembersTable() {
    const tbody = document.getElementById('usersTableBody');
    
    if (teamMembers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <p style="color: #666;">No team members yet. Create your first team member!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = teamMembers.map(member => {
        const tasksCount = allTasks.filter(t => t.assigned_to === member.id).length;
        
        return `
            <tr>
                <td>${escapeHtml(member.username)}</td>
                <td>${escapeHtml(member.full_name)}</td>
                <td>${escapeHtml(member.email)}</td>
                <td>${tasksCount}</td>
                <td>
                    <button class="btn-action btn-delete" onclick="deleteUser(${member.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update assign to dropdown
function updateAssignToDropdown() {
    const select = document.getElementById('assignTo');
    select.innerHTML = '<option value="">Select team member</option>' +
        teamMembers.map(member => 
            `<option value="${member.id}">${member.full_name} (${member.username})</option>`
        ).join('');
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_URL}/notifications/${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to load notifications');
        
        notifications = await response.json();
        
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
        
        renderNotifications();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Render notifications
function renderNotifications() {
    const container = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No notifications</p>';
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? 'read' : 'unread'}" 
             onclick="markNotificationRead(${notif.id})"
             style="cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <p style="color: #e0e0e0; margin: 0 0 5px 0;">${escapeHtml(notif.message)}</p>
                    <small style="color: #888;">${new Date(notif.created_at).toLocaleString()}</small>
                </div>
                ${!notif.read ? '<span style="color: #00d4ff; font-weight: 600;">NEW</span>' : ''}
            </div>
        </div>
    `).join('');
}

// Mark notification as read
async function markNotificationRead(notifId) {
    try {
        const response = await fetch(`${API_URL}/notifications/${notifId}/read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            await loadNotifications();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Modal functions
function openCreateUserModal() {
    document.getElementById('createUserModal').classList.add('show');
}

function closeCreateUserModal() {
    document.getElementById('createUserModal').classList.remove('show');
    document.getElementById('createUserForm').reset();
}

function openAssignTaskModal() {
    document.getElementById('assignTaskModal').classList.add('show');
}

function closeAssignTaskModal() {
    document.getElementById('assignTaskModal').classList.remove('show');
    document.getElementById('assignTaskForm').reset();
}

function closeViewTaskModal() {
    document.getElementById('viewTaskModal').classList.remove('show');
}

// View task details
async function viewTask(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const assignee = teamMembers.find(m => m.id === task.assigned_to);
    
    document.getElementById('taskDetails').innerHTML = `
        <div style="color: #e0e0e0;">
            <h3 style="color: #00d4ff; margin-bottom: 15px;">${escapeHtml(task.title)}</h3>
            <p><strong>Status:</strong> <span class="status-badge status-${task.status}">${task.status.replace('_', ' ')}</span></p>
            <p><strong>Priority:</strong> <span class="priority-badge priority-${task.priority}">${task.priority}</span></p>
            <p><strong>Assigned To:</strong> ${assignee ? assignee.full_name : 'Unassigned'}</p>
            <p><strong>Description:</strong> ${task.description || 'No description'}</p>
            <p><strong>Due Date:</strong> ${task.due_date ? new Date(task.due_date).toLocaleString() : 'No due date'}</p>
            <p><strong>Created:</strong> ${new Date(task.created_at).toLocaleString()}</p>
            ${task.completed_at ? `<p><strong>Completed:</strong> ${new Date(task.completed_at).toLocaleString()}</p>` : ''}
            ${task.result ? `<div style="margin-top: 15px; padding: 15px; background: #1a1a1a; border-radius: 8px;">
                <strong>Result:</strong><br/>${escapeHtml(task.result)}
            </div>` : ''}
        </div>
    `;
    
    document.getElementById('viewTaskModal').classList.add('show');
}

// Approve task
async function approveTask(taskId) {
    if (!confirm('Are you sure you want to approve this task?')) return;
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });
        
        if (!response.ok) throw new Error('Failed to approve task');
        
        showMessage('Task approved successfully!', 'success');
        await loadDashboardData();
    } catch (error) {
        console.error('Error approving task:', error);
        showMessage('Error approving task', 'error');
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete task');
        
        showMessage('Task deleted successfully!', 'success');
        await loadDashboardData();
    } catch (error) {
        console.error('Error deleting task:', error);
        showMessage('Error deleting task', 'error');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? All their tasks will be deleted.')) return;
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete user');
        
        showMessage('User deleted successfully!', 'success');
        await loadDashboardData();
    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Error deleting user', 'error');
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Create user form
    document.getElementById('createUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userData = {
            username: document.getElementById('newUsername').value,
            email: document.getElementById('newEmail').value,
            full_name: document.getElementById('newFullName').value,
            role: document.getElementById('newUserRole').value
        };
        
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create user');
            }
            
            showMessage('User created successfully!', 'success');
            closeCreateUserModal();
            await loadDashboardData();
        } catch (error) {
            console.error('Error creating user:', error);
            showMessage(error.message, 'error');
        }
    });
    
    // Assign task form
    document.getElementById('assignTaskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            assigned_to: parseInt(document.getElementById('assignTo').value),
            assigned_by: currentUser.id,
            priority: document.getElementById('taskPriority').value,
            due_date: document.getElementById('taskDueDate').value || null
        };
        
        if (!taskData.assigned_to) {
            showMessage('Please select a team member', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/tasks/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to assign task');
            }
            
            showMessage('Task assigned successfully!', 'success');
            closeAssignTaskModal();
            await loadDashboardData();
        } catch (error) {
            console.error('Error assigning task:', error);
            showMessage(error.message, 'error');
        }
    });
    
    // Notifications link
    document.getElementById('notificationsLink').addEventListener('click', (e) => {
        e.preventDefault();
        showTab('notifications');
    });
}

// Tab switching
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'tasks') {
        document.getElementById('tasksTab').classList.add('active');
        const tasksBtn = document.querySelector('.tab-btn[onclick*="tasks"]');
        if (tasksBtn) tasksBtn.classList.add('active');
    } else if (tabName === 'users') {
        document.getElementById('usersTab').classList.add('active');
        const usersBtn = document.querySelector('.tab-btn[onclick*="users"]');
        if (usersBtn) usersBtn.classList.add('active');
    } else if (tabName === 'notifications') {
        document.getElementById('notificationsTab').classList.add('active');
        const notifBtn = document.querySelector('.tab-btn[onclick*="notifications"]');
        if (notifBtn) notifBtn.classList.add('active');
        // Reload notifications when viewing
        loadNotifications();
    }
}

// Show message
function showMessage(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background: #2ecc71;' : 'background: #e74c3c;'}
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
