/* Config */
// Depending on how you run, update BASE_URL accordingly.
const BASE_URL = 'http://localhost:5000/api';

const api = {
    // Helper for Authorization Headers
    getHeaders(withMedia = false) {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (!withMedia) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    },

    // Handle responses
    async handleResponse(response) {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    },

    // Auth API
    auth: {
        async login(credentials) {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            return api.handleResponse(res);
        },
        async register(userData) {
            const res = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return api.handleResponse(res);
        },
        async sendOTP(email) {
            const res = await fetch(`${BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return api.handleResponse(res);
        },
        async verifyOTP(email, otpCode) {
            const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otpCode })
            });
            return api.handleResponse(res);
        },
        async sendPhoneOTP(phone) {
            const res = await fetch(`${BASE_URL}/auth/send-otp-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            return api.handleResponse(res);
        },
        async verifyPhoneOTP(phone, otpCode) {
            const res = await fetch(`${BASE_URL}/auth/verify-otp-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otpCode })
            });
            return api.handleResponse(res);
        }
    },

    // Users & Profile
    users: {
        async getProfile() {
            const res = await fetch(`${BASE_URL}/users/profile`, {
                headers: api.getHeaders()
            });
            return api.handleResponse(res);
        },
        async updateProfile(formData) {
            const res = await fetch(`${BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: api.getHeaders(true), // Content-Type omitted for FormData
                body: formData
            });
            return api.handleResponse(res);
        }
    },

    // Jobs API
    jobs: {
        async getAll(query = '') {
            const res = await fetch(`${BASE_URL}/jobs${query}`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        async getOne(id) {
            const res = await fetch(`${BASE_URL}/jobs/${id}`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        async create(data) {
            const res = await fetch(`${BASE_URL}/jobs`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(data)
            });
            return api.handleResponse(res);
        }
    },

    // Events API
    events: {
        async getAll(query = '') {
            const res = await fetch(`${BASE_URL}/events${query}`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        async getOne(id) {
            const res = await fetch(`${BASE_URL}/events/${id}`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        async create(formData) {
            const res = await fetch(`${BASE_URL}/events`, {
                method: 'POST',
                headers: api.getHeaders(true),
                body: formData
            });
            return api.handleResponse(res);
        },
        async registerEvent(id, data) {
            const res = await fetch(`${BASE_URL}/events/${id}/register`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(data)
            });
            return api.handleResponse(res);
        },
        async startMeeting(id) {
            const res = await fetch(`${BASE_URL}/events/${id}/start`, {
                method: 'POST',
                headers: api.getHeaders()
            });
            return api.handleResponse(res);
        }
    },

    // Alumni
    alumni: {
        async getAll(query = '') {
            const res = await fetch(`${BASE_URL}/alumni${query}`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        async getOne(id) {
            const res = await fetch(`${BASE_URL}/alumni/${id}`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        }
    },
    
    // Mentorship API
    mentorship: {
        async getAll() {
            const res = await fetch(`${BASE_URL}/mentorship`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        async request(data) {
            const res = await fetch(`${BASE_URL}/mentorship`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(data)
            });
            return api.handleResponse(res);
        },
        async updateStatus(id, status) {
            const res = await fetch(`${BASE_URL}/mentorship/${id}/status`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify({ status })
            });
            return api.handleResponse(res);
        },
        async pay(id) {
            const res = await fetch(`${BASE_URL}/mentorship/${id}/pay`, {
                method: 'PUT',
                headers: api.getHeaders()
            });
            return api.handleResponse(res);
        }
    },

    // Posts & Community
    posts: {
        async getAll() {
            const res = await fetch(`${BASE_URL}/posts`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        async create(formData) {
            const res = await fetch(`${BASE_URL}/posts`, {
                method: 'POST',
                headers: api.getHeaders(true),
                body: formData
            });
            return api.handleResponse(res);
        },
        async like(id) {
            const res = await fetch(`${BASE_URL}/posts/${id}/like`, { method: 'POST', headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        async comment(id, text) {
            const res = await fetch(`${BASE_URL}/posts/${id}/comment`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify({ text })
            });
            return api.handleResponse(res);
        }
    },
    
    // Admin API
    admin: {
        getUsers: async () => {
            const res = await fetch(`${BASE_URL}/admin/users`, { headers: api.getHeaders() });
            return api.handleResponse(res);
        },
        toggleBlockUser: async (id) => {
            const res = await fetch(`${BASE_URL}/admin/users/${id}/block`, {
                method: 'PUT',
                headers: api.getHeaders()
            });
            return api.handleResponse(res);
        },
        deleteUser: async (id) => {
            const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return api.handleResponse(res);
        },
        deleteJob: async (id) => {
            const res = await fetch(`${BASE_URL}/admin/jobs/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return api.handleResponse(res);
        },
        deleteEvent: async (id) => {
            const res = await fetch(`${BASE_URL}/admin/events/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return api.handleResponse(res);
        },
        createAnnouncement: async (data) => {
            const res = await fetch(`${BASE_URL}/announcements`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(data)
            });
            return api.handleResponse(res);
        },
        deleteAnnouncement: async (id) => {
            const res = await fetch(`${BASE_URL}/announcements/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return api.handleResponse(res);
        }
    },
    
    // Fallback/Demo utilities
    checkAuth() {
        if (!localStorage.getItem('token')) {
            window.location.href = 'login.html';
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
};
