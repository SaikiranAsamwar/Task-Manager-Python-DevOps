/**
 * Team Member Dashboard - View and complete assigned tasks
 */

// API base URL
const API_URL = '/api';

// Check authentication and role
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    const userRole = sessionStorage.getItem('userRole');
    
    if (isAuthenticated !== 'true' || userRole !== 'member') {
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
let myTasks = [];
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
            loadMyTasks(),
            loadNotifications()
        ]);
        updateStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('Error loading dashboard data', 'error');
    }
}

// Load my tasks
async function loadMyTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks/assigned?user_id=${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to load tasks');
        
        myTasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showMessage('Error loading tasks', 'error');
    }
}

// Update statistics
function updateStats() {
    const totalTasks = myTasks.length;
    const pendingTasks = myTasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = myTasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = myTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('inProgressTasks').textContent = inProgressTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
}

// Render tasks
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    
    if (myTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No tasks assigned yet</p>
                <small style="color: #888;">Your team lead will assign tasks to you</small>
            </div>
        `;
        return;
    }
    
    // Sort tasks by status and due date
    const sortedTasks = [...myTasks].sort((a, b) => {
        const statusOrder = { 'pending': 1, 'in_progress': 2, 'completed': 3, 'approved': 4 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        
        if (statusDiff !== 0) return statusDiff;
        
        if (a.due_date && b.due_date) {
            return new Date(a.due_date) - new Date(b.due_date);
        }
        return 0;
    });
    
    container.innerHTML = sortedTasks.map(task => `
        <div class="task-card">
            <div class="task-card-header">
                <h3 class="task-card-title">${escapeHtml(task.title)}</h3>
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            </div>
            <div class="task-card-body">
                <p>${task.description || 'No description provided'}</p>
                <div class="task-meta">
                    <span>📅 ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                    <span>⏰ Created: ${new Date(task.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="task-card-footer">
                <span class="status-badge status-${task.status}">${task.status.replace('_', ' ')}</span>
                <div>
                    ${renderTaskActions(task)}
                </div>
            </div>
        </div>
    `).join('');
}

// Render task actions based on status
function renderTaskActions(task) {
    const actions = [];
    
    // View details button always available
    actions.push(`<button class="btn-secondary" onclick="viewTaskDetails(${task.id})">View Details</button>`);
    
    if (task.status === 'pending' || task.status === 'in_progress') {
        actions.push(`<button class="btn-primary" onclick="openCompleteTaskModal(${task.id})">Complete Task</button>`);
    }
    
    if (task.status === 'completed') {
        actions.push(`<span style="color: #2ecc71; font-weight: 600; margin-left: 10px;">⏳ Awaiting Approval</span>`);
    }
    
    if (task.status === 'approved') {
        actions.push(`<span style="color: #9b59b6; font-weight: 600; margin-left: 10px;">✅ Approved</span>`);
    }
    
    return actions.join('');
}

// View task details
function viewTaskDetails(taskId) {
    const task = myTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const content = document.getElementById('taskDetailsContent');
    content.innerHTML = `
        <div style="color: #e0e0e0;">
            <h3 style="color: #00d4ff; margin-bottom: 15px;">${escapeHtml(task.title)}</h3>
            <p><strong>Status:</strong> <span class="status-badge status-${task.status}">${task.status.replace('_', ' ')}</span></p>
            <p><strong>Priority:</strong> <span class="priority-badge priority-${task.priority}">${task.priority}</span></p>
            <p><strong>Description:</strong></p>
            <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
                ${task.description || 'No description'}
            </div>
            <p><strong>Due Date:</strong> ${task.due_date ? new Date(task.due_date).toLocaleString() : 'No due date'}</p>
            <p><strong>Assigned:</strong> ${new Date(task.created_at).toLocaleString()}</p>
            ${task.completed_at ? `<p><strong>Completed:</strong> ${new Date(task.completed_at).toLocaleString()}</p>` : ''}
            ${task.result ? `
                <div style="margin-top: 15px;">
                    <p><strong>Your Result:</strong></p>
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
                        ${escapeHtml(task.result)}
                    </div>
                </div>
            ` : ''}
            ${task.approved ? `<p style="color: #9b59b6; font-weight: 600; margin-top: 15px;">✅ This task has been approved by your team lead</p>` : ''}
        </div>
    `;
    
    document.getElementById('viewTaskModal').classList.add('show');
}

// Open complete task modal
function openCompleteTaskModal(taskId) {
    document.getElementById('completeTaskId').value = taskId;
    document.getElementById('completeTaskModal').classList.add('show');
}

// Close modals
function closeCompleteTaskModal() {
    document.getElementById('completeTaskModal').classList.remove('show');
    document.getElementById('completeTaskForm').reset();
}

function closeViewTaskModal() {
    document.getElementById('viewTaskModal').classList.remove('show');
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
                <div style="flex: 1;">
                    <p style="color: #e0e0e0; margin: 0 0 5px 0;">${escapeHtml(notif.message)}</p>
                    <small style="color: #888;">${new Date(notif.created_at).toLocaleString()}</small>
                </div>
                ${!notif.read ? '<span style="color: #00d4ff; font-weight: 600; margin-left: 15px;">NEW</span>' : ''}
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

// Setup form handlers
function setupFormHandlers() {
    // Complete task form
    document.getElementById('completeTaskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskId = parseInt(document.getElementById('completeTaskId').value);
        const result = document.getElementById('taskResult').value;
        
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ result })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to complete task');
            }
            
            showMessage('Task completed successfully! Awaiting team lead approval.', 'success');
            closeCompleteTaskModal();
            await loadDashboardData();
        } catch (error) {
            console.error('Error completing task:', error);
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
    
    if (tabName === 'myTasks') {
        document.getElementById('myTasksTab').classList.add('active');
        document.querySelector('.tab-btn[onclick*="myTasks"]')?.classList.add('active');
    } else if (tabName === 'notifications') {
        document.getElementById('notificationsTab').classList.add('active');
        document.querySelector('.tab-btn[onclick*="notifications"]')?.classList.add('active');
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
