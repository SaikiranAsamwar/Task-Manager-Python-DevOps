/**
 * Users Management Page
 */

const API_URL = '/api';

// State
let users = [];

/**
 * Initialize users page
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    setupFormListeners();
});

/**
 * Load all users
 */
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Failed to load users');

        users = await response.json();
        displayUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        showMessage('Error loading users', 'error');
    }
}

/**
 * Display users in grid
 */
function displayUsers() {
    const usersGrid = document.getElementById('usersGrid');
    if (!usersGrid) return;

    if (users.length === 0) {
        usersGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No users yet. Create one to get started!</p>';
        return;
    }

    usersGrid.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-header">
                <h3>${escapeHtml(user.full_name || user.username)}</h3>
                <button class="btn-icon" onclick="deleteUser(${user.id})">×</button>
            </div>
            <div class="user-details">
                <p><strong>Username:</strong> ${escapeHtml(user.username)}</p>
                <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
                <p><strong>Created:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                <button class="btn btn-primary" onclick="editUser(${user.id})">Edit</button>
            </div>
        </div>
    `).join('');

    // Add CSS for user cards
    addUserCardStyles();
}

/**
 * Setup form event listeners
 */
function setupFormListeners() {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createUser();
        });
    }
}

/**
 * Create new user
 */
async function createUser() {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const fullNameInput = document.getElementById('fullName');

    if (!usernameInput || !emailInput || !fullNameInput) return;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const fullName = fullNameInput.value.trim();
    const passwordInput = document.getElementById('password');
    const password = passwordInput ? passwordInput.value.trim() : '';

    // Validate
    if (!username || !email || !fullName || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                full_name: fullName,
                password,
                role: 'member'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create user');
        }

        showMessage('User created successfully!', 'success');
        document.getElementById('addUserForm').reset();
        await loadUsers();
    } catch (error) {
        console.error('Error creating user:', error);
        showMessage(error.message, 'error');
    }
}

/**
 * Delete user
 */
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? All their tasks will be deleted too.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete user');

        showMessage('User deleted successfully', 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Error deleting user', 'error');
    }
}

/**
 * Edit user (placeholder)
 */
async function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newFullName = prompt('Enter new full name:', user.full_name);
    if (!newFullName) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: newFullName
            })
        });

        if (!response.ok) throw new Error('Failed to update user');

        showMessage('User updated successfully', 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        showMessage('Error updating user', 'error');
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Add CSS for user cards
 */
function addUserCardStyles() {
    if (document.getElementById('userCardStyles')) return;

    const style = document.createElement('style');
    style.id = 'userCardStyles';
    style.textContent = `
        #usersGrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }

        .user-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: box-shadow 0.3s ease;
        }

        .user-card:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .user-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }

        .user-header h3 {
            margin: 0;
            color: #333;
        }

        .btn-icon {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #f44336;
            padding: 0;
            width: 30px;
            height: 30px;
        }

        .btn-icon:hover {
            background: #ffebee;
            border-radius: 50%;
        }

        .user-details p {
            margin: 8px 0;
            font-size: 0.9em;
            color: #555;
        }

        .user-details strong {
            color: #333;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Show notification message
 */
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease-in-out;
    `;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
