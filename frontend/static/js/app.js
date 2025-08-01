// DOM Elements
const loginContainer = document.getElementById('login-container');
const portalContainer = document.getElementById('portal-container');
const loginBtn = document.getElementById('login-btn');
const loginBtnText = document.getElementById('login-btn-text');
const loginSpinner = document.getElementById('login-spinner');
const logoutBtn = document.getElementById('logout-btn');
const addStudentBtn = document.getElementById('add-student-btn');
const studentTableBody = document.getElementById('student-table-body');
const loadingDiv = document.getElementById('loading');
const noStudentsDiv = document.getElementById('no-students');
const studentListContent = document.getElementById('student-list-content');
const addModal = document.getElementById('add-modal');
const closeModal = document.getElementById('close-modal');
const cancelAddBtn = document.getElementById('cancel-add-btn');
const submitStudentBtn = document.getElementById('submit-student-btn');
const loginError = document.getElementById('login-error');
const addError = document.getElementById('add-error');

// State
let students = [];
let accessToken = localStorage.getItem('accessToken') || '';
let refreshToken = localStorage.getItem('refreshToken') || '';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (accessToken) {
        verifyToken();
    }

    // Event listeners
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    addStudentBtn.addEventListener('click', showAddModal);
    closeModal.addEventListener('click', hideAddModal);
    cancelAddBtn.addEventListener('click', hideAddModal);
    submitStudentBtn.addEventListener('click', addStudent);
    document.getElementById('add-first-student').addEventListener('click', showAddModal);
});

// Verify token on page load
async function verifyToken() {
    try {
        const response = await fetch('/api/auth/profile/', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            showPortal();
            fetchStudents();
        } else {
            if (response.status === 401 && refreshToken) {
                await refreshAccessToken();
            } else {
                logout();
            }
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        logout();
    }
}

// Refresh access token
async function refreshAccessToken() {
    try {
        const response = await fetch('/api/auth/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access;
            localStorage.setItem('accessToken', accessToken);
            verifyToken();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
    }
}

// Handle login
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!email || !password) {
        showLoginError('Please enter both email and password');
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtnText.textContent = 'Logging in...';
    loginSpinner.style.display = 'block';

    try {
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save tokens
            accessToken = data.access;
            refreshToken = data.refresh;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Hide error and show portal
            loginError.textContent = '';
            showPortal();
            fetchStudents();
        } else {
            showLoginError(data.detail || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Network error. Please try again.');
    } finally {
        // Reset login button
        loginBtn.disabled = false;
        loginBtnText.textContent = 'Login';
        loginSpinner.style.display = 'none';
    }
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    setTimeout(() => {
        loginError.style.opacity = '1';
    }, 10);
}

// Handle logout
function handleLogout() {
    logout();
}

function logout() {
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    accessToken = '';
    refreshToken = '';
    students = [];

    // Show login screen
    loginContainer.style.display = 'flex';
    portalContainer.style.display = 'none';

    // Reset form
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    loginError.textContent = '';
}

// Show portal after successful login
function showPortal() {
    loginContainer.style.display = 'none';
    portalContainer.style.display = 'block';
}

// Fetch students from API
async function fetchStudents() {
    loadingDiv.style.display = 'flex';
    noStudentsDiv.style.display = 'none';
    studentListContent.style.display = 'none';

    try {
        const response = await fetch('/api/students/', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            students = Array.isArray(data) ? data : (data.results || data.data || []);
            renderStudents();
        } else {
            throw new Error('Failed to fetch students');
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Failed to load students. Please try again.');
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Render students to the table
function renderStudents() {
    studentTableBody.innerHTML = '';

    if (students.length === 0) {
        noStudentsDiv.style.display = 'flex';
        return;
    }

    studentListContent.style.display = 'block';

    students.forEach(student => {
        const row = document.createElement('tr');
        row.dataset.id = student.id;

        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.subject}</td>
            <td>${student.marks}</td>
            <td class="actions">
                <button class="edit-btn" data-id="${student.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-btn" data-id="${student.id}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </td>
        `;

        studentTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => startEditing(e.target.closest('button').dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteStudent(e.target.closest('button').dataset.id));
    });
}

// Show add student modal
function showAddModal() {
    addModal.style.display = 'flex';
    document.getElementById('student-name').value = '';
    document.getElementById('student-subject').value = '';
    document.getElementById('student-marks').value = '';
    addError.textContent = '';
}

// Hide add student modal
function hideAddModal() {
    addModal.style.display = 'none';
}

// Add new student
async function addStudent() {
    const name = document.getElementById('student-name').value;
    const subject = document.getElementById('student-subject').value;
    const marks = document.getElementById('student-marks').value;

    // Validate inputs
    if (!name || !subject || !marks) {
        addError.textContent = 'All fields are required';
        return;
    }

    // Show loading state
    submitStudentBtn.disabled = true;
    submitStudentBtn.querySelector('span').textContent = 'Adding...';
    submitStudentBtn.querySelector('.spinner').style.display = 'block';

    try {
        const response = await fetch('/api/students/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                subject, 
                marks: parseFloat(marks) 
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Add new student to the list
            students.unshift(data);
            renderStudents();
            hideAddModal();
        } else {
            addError.textContent = data.detail || 'Error adding student';
        }
    } catch (error) {
        console.error('Error adding student:', error);
        addError.textContent = 'Network error. Please try again.';
    } finally {
        // Reset button
        submitStudentBtn.disabled = false;
        submitStudentBtn.querySelector('span').textContent = 'Add Student';
        submitStudentBtn.querySelector('.spinner').style.display = 'none';
    }
}

// Start editing a student
function startEditing(studentId) {
    const student = students.find(s => s.id == studentId);
    if (!student) return;

    const row = document.querySelector(`tr[data-id="${studentId}"]`);
    row.innerHTML = `
        <td><input type="text" value="${student.name}" id="edit-name-${studentId}"></td>
        <td><input type="text" value="${student.subject}" id="edit-subject-${studentId}"></td>
        <td><input type="number" value="${student.marks}" id="edit-marks-${studentId}"></td>
        <td class="actions">
            <button class="save-btn" data-id="${studentId}">
                <i class="fas fa-save"></i> Save
            </button>
            <button class="cancel-btn" data-id="${studentId}">
                <i class="fas fa-times"></i> Cancel
            </button>
        </td>
    `;

    // Focus on the first input
    document.getElementById(`edit-name-${studentId}`).focus();

    // Add event listeners
    row.querySelector('.save-btn').addEventListener('click', () => updateStudent(studentId));
    row.querySelector('.cancel-btn').addEventListener('click', () => renderStudents());
}

// Update student
async function updateStudent(studentId) {
    const name = document.getElementById(`edit-name-${studentId}`).value;
    const subject = document.getElementById(`edit-subject-${studentId}`).value;
    const marks = document.getElementById(`edit-marks-${studentId}`).value;

    try {
        const response = await fetch(`/api/students/${studentId}/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                subject, 
                marks: parseFloat(marks) 
            })
        });

        if (response.ok) {
            const updatedStudent = await response.json();
            const index = students.findIndex(s => s.id == studentId);
            if (index !== -1) {
                students[index] = updatedStudent;
            }
            renderStudents();
        } else {
            const errorData = await response.json();
            alert(errorData.detail || 'Failed to update student');
        }
    } catch (error) {
        console.error('Error updating student:', error);
        alert('Network error. Please try again.');
    }
}

// Delete student
async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
        const response = await fetch(`/api/students/${studentId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            students = students.filter(s => s.id != studentId);
            renderStudents();
        } else {
            alert('Failed to delete student');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Network error. Please try again.');
    }
}