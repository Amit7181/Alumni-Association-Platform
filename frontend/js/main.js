// main.js - Shared UI logic

document.addEventListener('DOMContentLoaded', () => {
    // Handle Navbar UI based on Auth State
    const navAuthSpans = document.getElementById('navAuthSpans');
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr && navAuthSpans) {
        const user = JSON.parse(userStr);
        
        // Initialize socket immediately if not already done
        if (typeof io !== 'undefined' && !window.socket) {
            window.socket = io('http://localhost:5000');
            
            // Join user-specific room
            window.socket.emit('join', user._id || user.id);

            // Universal Notification Listener
            window.socket.on('notification_received', (data) => {
                showToast(data.message, 'info', data.title);
            });

            // Handle global user state changes
            window.socket.on('user_updated', (data) => {
                if (data.userId === (user._id || user.id) && data.isBlocked) {
                    alert('Your account has been blocked. Logging out...');
                    api.logout();
                }
            });
        }

        let dashboardLink = 'student-dashboard.html';
        if (user.role === 'alumni') dashboardLink = 'alumni-dashboard.html';
        if (user.role === 'admin') dashboardLink = 'admin-dashboard.html';

        navAuthSpans.className = "d-flex ms-lg-3 gap-2 align-items-center";
        navAuthSpans.innerHTML = `
            <a href="${dashboardLink}" class="btn btn-primary d-flex align-items-center gap-2 text-nowrap">
                <i class="bi bi-person-circle"></i> Dashboard
            </a>
            <button onclick="api.logout()" class="btn btn-outline-danger text-nowrap">Log Out</button>
        `;

            // LIVE MEETING ALERT
            window.socket.on('meeting_started', (data) => {
                const message = `
                    <div class="mb-2">${data.title} is now LIVE!</div>
                    <a href="${data.meetingLink}" target="_blank" class="btn btn-sm btn-danger w-100 fw-bold">
                        <i class="bi bi-camera-video"></i> JOIN MEETING NOW
                    </a>
                `;
                showToast(message, 'danger', 'Live Event Started');
            });
        }
    }
});

// Utility to show Toast notifications dynamically
function showToast(message, type = 'info', title = 'Notification') {
    // Check if a toast container exists, if not create one
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const html = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type} text-white">
                <i class="bi bi-bell-fill me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    const toastElem = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElem);
    toast.show();
}
