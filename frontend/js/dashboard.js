// dashboard.js - Shared dashboard logic

let currentSection = 'overview';
let currentEventFilter = '';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    api.checkAuth();
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);

    // Populate user profile info in dashboard header/sidebar
    const userNameElements = document.querySelectorAll('.dashboard-user-name');
    userNameElements.forEach(el => el.innerText = user.name);

    const avatars = document.querySelectorAll('.dashboard-user-avatar');
    const imgUrl = user.profileImage 
        ? `http://localhost:5000${user.profileImage}` 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
        
    avatars.forEach(img => {
        img.src = imgUrl;
        img.style.objectFit = 'cover';
    });

    if (user.role === 'alumni') {
        const alumniOnlyElems = document.querySelectorAll('.alumni-only');
        alumniOnlyElems.forEach(el => el.classList.remove('d-none'));
        loadPendingMentorships();
    }

    if (user.role === 'admin') {
        const adminOnlyElems = document.querySelectorAll('.admin-only');
        adminOnlyElems.forEach(el => el.classList.remove('d-none'));
        fetchAdminAnalytics();
        fetchAdminUsers();
        
        // Handle Announcement Form
        const annForm = document.getElementById('announcementForm');
        if (annForm) {
            annForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('annSubmitBtn');
                btn.disabled = true;
                btn.innerText = 'Broadcasting...';

                try {
                    await api.admin.createAnnouncement({
                        title: document.getElementById('annTitle').value,
                        content: document.getElementById('annContent').value,
                        category: document.getElementById('annCategory').value,
                        isPinned: document.getElementById('annPinned').checked
                    });
                    annForm.reset();
                    alert('Announcement broadcasted successfully!');
                    fetchAdminAnnouncements();
                } catch (error) {
                    alert(error.message);
                } finally {
                    btn.disabled = false;
                    btn.innerText = 'Broadcast Announcement';
                }
            });
        }

        // Handle Event Creation Form (Integrated)
        const eventForm = document.getElementById('dashboardCreateEventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('eventSubmitBtn');
                const alertBox = document.getElementById('eventAlertBox');
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';

                try {
                    const formData = new FormData();
                    formData.append('title', document.getElementById('eventTitle').value);
                    formData.append('description', document.getElementById('eventDescription').value);
                    formData.append('category', document.getElementById('eventCategory').value);
                    formData.append('speaker', document.getElementById('eventSpeaker').value);
                    formData.append('date', document.getElementById('eventDate').value);
                    formData.append('time', document.getElementById('eventTime').value);
                    formData.append('venue', document.getElementById('eventVenue').value);
                    formData.append('meetingLink', document.getElementById('eventMeetingLink').value);
                    formData.append('capacity', document.getElementById('eventCapacity').value || 0);

                    const linkedJobId = document.getElementById('eventLinkedJob').value;
                    if (linkedJobId) formData.append('linkedJob', linkedJobId);

                    const fileInput = document.getElementById('eventBannerImage');
                    if (fileInput.files[0]) formData.append('bannerImage', fileInput.files[0]);

                    await api.events.create(formData);
                    
                    alertBox.className = 'alert alert-success d-block';
                    alertBox.innerText = 'Event created successfully!';
                    
                    setTimeout(() => {
                        alertBox.classList.add('d-none');
                        eventForm.reset();
                        switchAdminSection('events');
                    }, 1500);
                } catch (error) {
                    alertBox.className = 'alert alert-danger d-block';
                    alertBox.innerText = error.message;
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-calendar-check me-2"></i> Create Event';
                }
            });
        }
    }

    // Socket.io Real-Time Updates
    const setupSocketListeners = () => {
        if (!window.socket) {
            // Wait for main.js to initialize the socket
            setTimeout(setupSocketListeners, 100);
            return;
        }

        const refreshActiveSection = () => {
            if (currentSection === 'overview') loadDashboardData(user.role);
            if (currentSection === 'directory') fetchDirectory();
            if (currentSection === 'jobs') fetchFullJobs();
            if (currentSection === 'events') fetchFullEvents(currentEventFilter);
            if (currentSection === 'mentorship') fetchMentorshipHub();
            if (currentSection === 'community') fetchCommunityFeed();
            if (user.role === 'admin') {
                if (currentSection === 'jobs') fetchAdminJobs();
                if (currentSection === 'events') fetchAdminEvents();
                if (currentSection === 'announcements') fetchAdminAnnouncements();
                if (currentSection === 'users') fetchAdminUsers();
            }
        };

        window.socket.on('job_created', () => {
             fetchUserAnalytics();
             if (user.role === 'admin') fetchAdminAnalytics();
             refreshActiveSection();
        });

        window.socket.on('event_created', () => {
            fetchUserAnalytics();
            if (user.role === 'admin') fetchAdminAnalytics();
            refreshActiveSection();
        });

        window.socket.on('post_created', () => {
             fetchUserAnalytics();
             if (user.role === 'admin') fetchAdminAnalytics();
             refreshActiveSection();
        });

        window.socket.on('mentorship_request', () => {
            fetchUserAnalytics();
            if (user.role === 'alumni') loadPendingMentorships();
            refreshActiveSection();
        });

        window.socket.on('mentorship_updated', (data) => {
            fetchUserAnalytics();
            if (user.role === 'alumni') loadPendingMentorships();
            refreshActiveSection();
        });

        window.socket.on('mentorship_request', (data) => {
            if (user.role === 'alumni') {
                loadPendingMentorships();
                refreshActiveSection();
            }
        });

        window.socket.on('user_registered', () => {
            if (user.role === 'admin') {
                fetchAdminUsers();
                fetchAdminAnalytics();
            }
            if (currentSection === 'directory') fetchDirectory();
        });

        window.socket.on('mentorship_updated', () => {
            fetchUserAnalytics();
            if (user.role === 'alumni') loadPendingMentorships();
            refreshActiveSection();
        });

        window.socket.on('event_updated', () => {
            fetchUserAnalytics();
            if (user.role === 'admin') fetchAdminAnalytics();
            refreshActiveSection();
        });

        window.socket.on('user_updated', (data) => {
            const currentUserId = user._id || user.id;
            if (data.userId === currentUserId) {
                if (data.isBlocked) {
                    alert('Your account has been blocked. Logging out...');
                    api.logout();
                }
                fetchUserAnalytics();
            }
            if (user.role === 'admin') {
                fetchAdminUsers();
                fetchAdminAnalytics();
            }
        });

        window.socket.on('job_deleted', () => {
             fetchUserAnalytics();
             if (user.role === 'admin') fetchAdminAnalytics();
             refreshActiveSection();
        });

        window.socket.on('event_deleted', () => {
             fetchUserAnalytics();
             if (user.role === 'admin') fetchAdminAnalytics();
             refreshActiveSection();
        });

        window.socket.on('announcement_created', () => {
             if (user.role === 'admin') {
                 fetchAdminAnnouncements();
                 fetchAdminAnalytics();
             }
        });

        window.socket.on('announcement_deleted', () => {
             if (user.role === 'admin') fetchAdminAnnouncements();
        });
        
        window.socket.on('post_updated', () => {
             refreshActiveSection();
        });
    };

    setupSocketListeners();

    // Update time greeting
    const hour = new Date().getHours();
    // Sidebar Toggle for Mobile
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Load Basic Dashboard Data (Mock loading if API fails to keep UI nice)
    loadDashboardData(user.role);

    // Dynamic Section Forms Listeners
    setupSectionFormListeners(user);

    // Event Registration Form Logic
    const regForm = document.getElementById('eventRegistrationForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('regSubmitBtn');
            const alertBox = document.getElementById('regAlert');
            const eventId = document.getElementById('regEventId').value;
            
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Registering...';

            try {
                const data = {
                    fullName: document.getElementById('regFullName').value,
                    registrationNumber: document.getElementById('regNumber').value,
                    mobileNumber: document.getElementById('regMobile').value
                };

                await api.events.registerEvent(eventId, data);

                alertBox.className = 'alert alert-success d-block';
                alertBox.innerText = 'Registration successful! See you at the event.';
                
                setTimeout(() => {
                    const modalEl = document.getElementById('eventRegistrationModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    
                    // Refresh current view if applicable
                    if (currentSection === 'events') fetchFullEvents(currentEventFilter);
                    else if (currentSection === 'overview') {
                        const user = JSON.parse(localStorage.getItem('user'));
                        loadDashboardData(user.role);
                    }
                }, 2000);

            } catch (error) {
                alertBox.className = 'alert alert-danger d-block';
                alertBox.innerText = error.message;
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Confirm Registration';
            }
        });
    }
});

function setupSectionFormListeners(user) {
    // Directory Filter
    const dirForm = document.getElementById('directoryFilterForm');
    if(dirForm) {
        dirForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = `?search=${document.getElementById('dirSearch').value}&location=${document.getElementById('dirLocation').value}&skill=${document.getElementById('dirSkill').value}`;
            fetchDirectory(q);
        });

        // Add real-time search listeners
        const dirSearchInput = document.getElementById('dirSearch');
        const dirLocationInput = document.getElementById('dirLocation');
        const dirSkillInput = document.getElementById('dirSkill');

        const triggerSearch = () => {
            const q = `?search=${dirSearchInput?.value || ''}&location=${dirLocationInput?.value || ''}&skill=${dirSkillInput?.value || ''}`;
            fetchDirectory(q);
        };

        if (dirSearchInput) dirSearchInput.addEventListener('input', triggerSearch);
        if (dirLocationInput) dirLocationInput.addEventListener('input', triggerSearch);
        if (dirSkillInput) dirSkillInput.addEventListener('change', triggerSearch);
    }

    // Job Board Filter
    const jobForm = document.getElementById('dashJobFilterForm');
    if(jobForm) {
        jobForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = `?search=${document.getElementById('dashJobSearch').value}&type=${document.getElementById('dashJobType').value}&location=${document.getElementById('dashJobLocation').value}`;
            fetchFullJobs(q);
        });
    }

    // Community Post Form
    const postForm = document.getElementById('dashPostForm');
    if(postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('dashPostBtn');
            const content = document.getElementById('dashPostContent').value;
            const type = document.getElementById('dashPostType').value;
            
            if(!content.trim()) return;

            try {
                btn.disabled = true;
                btn.innerText = 'Posting...';
                
                const formData = new FormData();
                formData.append('content', content);
                formData.append('type', type);
                
                await api.posts.create(formData);
                
                document.getElementById('dashPostContent').value = '';
                fetchCommunityFeed();
            } catch(err) { alert(err.message); }
            finally { btn.disabled = false; btn.innerText = 'Post to Feed'; }
        });
    }
}

async function loadDashboardData(role) {
    try {
        // Here we would fetch recent jobs, events, etc.
        // For the dummy UI to look nice immediately, we just show containers.
        if (role === 'student' || role === 'alumni') {
            await fetchRecentJobs();
            await fetchRecentEvents();
            await fetchUserAnalytics();
            await loadPendingMentorships();
        }
    } catch (e) {
        console.warn('Could not load dashboard dynamic data', e);
    }
}

async function fetchRecentJobs() {
    try {
        const jobs = await api.jobs.getAll('?limit=3');
        const container = document.getElementById('recentJobsContainer');
        if (!container) return;

        if (jobs.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent jobs available.</p>';
            return;
        }

        let html = '';
        jobs.slice(0, 3).forEach(job => {
            html += `
                <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                    <div>
                        <h6 class="mb-0 fw-bold">${job.title}</h6>
                        <small class="text-muted">${job.company} • ${job.location}</small>
                    </div>
                    <div class="d-flex gap-2">
                        ${job.applyLink ? `<a href="${job.applyLink}" target="_blank" class="btn btn-sm btn-primary">Apply</a>` : ''}
                        <a href="job-details.html?id=${job._id}" class="btn btn-sm btn-outline-primary">View</a>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        const container = document.getElementById('recentJobsContainer');
        if (container) container.innerHTML = '<p class="text-muted small">Could not load jobs.</p>';
    }
}

async function fetchRecentEvents() {
    try {
        const events = await api.events.getAll();
        const container = document.getElementById('recentEventsContainer');
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<p class="text-muted">No upcoming events.</p>';
            return;
        }

        let html = '';
        events.slice(0, 3).forEach(event => {
            html += `
                <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                    <div>
                        <h6 class="mb-0 fw-bold">${event.title}</h6>
                        <small class="text-muted">${new Date(event.date).toLocaleDateString()} • ${event.category}</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-primary-light me-2">${event.registeredUsers.length} Going</span>
                        <button onclick="initRegistrationModal('${event._id}', '${event.title.replace(/'/g, "\\'")}')" class="btn btn-sm btn-primary rounded-pill px-3 shadow-sm">Register</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch(error) {
        const container = document.getElementById('recentEventsContainer');
        if (container) container.innerHTML = '<p class="text-muted small">Could not load events.</p>';
    }
}

async function fetchAdminAnalytics() {
    const statCards = {
        totalUsers: document.getElementById('stat-users'),
        totalAlumni: document.getElementById('stat-alumni'),
        totalJobs: document.getElementById('stat-jobs'),
        totalEvents: document.getElementById('stat-events')
    };

    try {
        const res = await fetch(`${BASE_URL}/admin/analytics`, { headers: api.getHeaders() });
        const data = await api.handleResponse(res);
        
        if (statCards.totalUsers) statCards.totalUsers.innerText = data.totalUsers;
        if (statCards.totalAlumni) statCards.totalAlumni.innerText = data.totalAlumni;
        if (statCards.totalJobs) statCards.totalJobs.innerText = data.totalJobs;
        if (statCards.totalEvents) statCards.totalEvents.innerText = data.totalEvents;
    } catch (error) {
        console.warn('Admin Analytics failed', error);
    }
}

async function fetchAdminUsers() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    try {
        const users = await api.admin.getUsers();
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No users found.</td></tr>';
            return;
        }

        let html = '';
        users.forEach(u => {
            let roleBadge = '';
            if (u.role === 'student') roleBadge = '<span class="badge bg-primary">Student</span>';
            else if (u.role === 'alumni') roleBadge = '<span class="badge bg-info">Alumni</span>';
            else roleBadge = '<span class="badge bg-danger">Admin</span>';

            const statusBadge = u.isBlocked 
                ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Blocked</span>'
                : '<span class="badge bg-success bg-opacity-10 text-success border border-success">Active</span>';
            
            const actionBtn = u.role === 'admin' 
                ? '<button class="btn btn-sm btn-secondary" disabled>Admin</button>'
                : `<button class="btn btn-sm ${u.isBlocked ? 'btn-success' : 'btn-outline-warning'} me-1" onclick="toggleUserBlock('${u._id}')">
                    ${u.isBlocked ? 'Unblock' : 'Block'}
                   </button>
                   <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}')">Remove</button>`;

            html += `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>${roleBadge}</td>
                    <td>${statusBadge}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load users.</td></tr>';
        console.warn('Admin users fetch failed', error);
    }
}

window.toggleUserBlock = async function(id) {
    try {
        await api.admin.toggleBlockUser(id);
        // The table will re-render automatically because the backend emits 'user_updated'
    } catch (e) {
        alert("Failed to update user status: " + e.message);
    }
}

window.deleteUser = async function(id) {
    if (!confirm('Are you sure you want to permanently remove this user? They will have to register again to log in.')) return;
    try {
        await api.admin.deleteUser(id);
        fetchAdminUsers();
        fetchAdminAnalytics();
        alert('User removed successfully.');
    } catch (e) {
        alert("Failed to remove user: " + e.message);
    }
}

async function fetchUserAnalytics() {
    try {
        const res = await fetch(`${BASE_URL}/users/analytics`, { headers: api.getHeaders() });
        const data = await api.handleResponse(res);
        
        const statJobs = document.getElementById('stat-my-jobs');
        const statMentees = document.getElementById('stat-my-mentees');
        const statEvents = document.getElementById('stat-my-events');
        const statPosts = document.getElementById('stat-my-posts');
        const statMentorships = document.getElementById('stat-my-mentorships');

        if (statJobs) statJobs.innerText = data.jobsPosted;
        if (statMentees) statMentees.innerText = data.mentees;
        if (statEvents) statEvents.innerText = data.eventsHosted;
        if (statPosts) statPosts.innerText = data.communityPosts;
        if (statMentorships) statMentorships.innerText = data.activeMentorships;
    } catch(err) {
        console.warn('Personal analytics fetch failed', err);
    }
}

async function loadPendingMentorships() {
    const container = document.getElementById('recentMentorshipsContainer');
    if(!container) return;

    try {
        const res = await fetch(`${BASE_URL}/mentorship`, { headers: api.getHeaders() });
        const requests = await api.handleResponse(res);
        
        // Filter pending
        const pending = requests.filter(r => r.status === 'pending');
        
        if(pending.length === 0) {
            container.innerHTML = '<p class="text-muted mb-0">No new pending requests.</p>';
            return;
        }

        let html = '';
        pending.slice(0,3).forEach(req => {
            const studentImg = req.student.profileImage ? `http://localhost:5000${req.student.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(req.student.name)}&background=random`;
            html += `
            <div class="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div class="d-flex align-items-center">
                    <img src="${studentImg}" class="rounded-circle me-3" width="40" height="40">
                    <div>
                        <h6 class="mb-0 fw-bold">${req.student.name}</h6>
                        <small class="text-muted d-inline-block text-truncate" style="max-width: 150px;">${req.topic}</small>
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-success me-1" onclick="updateStatus('${req._id}', 'accepted')"><i class="bi bi-check"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="updateStatus('${req._id}', 'rejected')"><i class="bi bi-x"></i></button>
                </div>
            </div>`;
        });
        html += `<p class="text-center mt-3 mb-0"><a href="mentorship.html" class="text-decoration-none small fw-semibold">View All Requests</a></p>`;
        container.innerHTML = html;
        
    } catch(err) {
        container.innerHTML = '<p class="text-danger small">Failed to load requests.</p>';
    }
}

// Dashboard Navigation Logic
window.switchDashboardSection = function(section) {
    currentSection = section;
    // 1. Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.add('d-none'));
    // 2. Show target
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('d-none');

    // 3. Update sidebar links
    document.querySelectorAll('.sidebar-link').forEach(l => {
        l.classList.remove('active');
        l.style.borderLeftColor = 'transparent';
    });
    const activeLink = document.getElementById(`link-${section}`);
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.style.borderLeftColor = 'var(--bs-primary)';
    }

    // 4. Fetch data for specific sections
    if (section === 'directory') fetchDirectory();
    if (section === 'jobs') fetchFullJobs();
    if (section === 'events') fetchFullEvents();
    if (section === 'mentorship') fetchMentorshipHub();
    if (section === 'community') fetchCommunityFeed();
    if (section === 'settings') fetchProfileSettings();
    if (section === 'overview') {
        const user = JSON.parse(localStorage.getItem('user'));
        loadDashboardData(user.role);
    }
}

// Admin Navigation Logic
window.switchAdminSection = function(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('d-none'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('d-none');

    document.querySelectorAll('.sidebar-link').forEach(l => {
        l.classList.remove('active');
        if(l.id === `link-${section}`) l.classList.add('active');
    });

    // Auto-fetch data
    if (section === 'users') fetchAdminUsers();
    if (section === 'jobs') fetchAdminJobs();
    if (section === 'events') fetchAdminEvents();
    if (section === 'announcements') fetchAdminAnnouncements();
    if (section === 'settings') fetchProfileSettings();
}

// Profile Settings Logic (Integrated in Dashboard)
async function fetchProfileSettings() {
    const container = document.getElementById('section-settings');
    if (!container) return;

    try {
        const profile = await api.users.getProfile();
        
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('settings-name', profile.name);
        setVal('settings-phone', profile.phone);
        setVal('settings-location', profile.location);
        setVal('settings-bio', profile.bio);
        setVal('settings-linkedin', profile.linkedinUrl);
        setVal('settings-github', profile.githubUrl);

        const avatarUrl = profile.profileImage 
            ? `http://localhost:5000${profile.profileImage}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`;
            
        const preview = document.getElementById('settings-profilePreview');
        if (preview) preview.src = avatarUrl;

        const alumniFields = document.getElementById('settings-alumniFields');
        if (profile.role === 'alumni' && alumniFields) {
            alumniFields.classList.remove('d-none');
            setVal('settings-company', profile.currentCompany);
            setVal('settings-job', profile.jobRole);
            setVal('settings-skills', (profile.skills || []).join(', '));
            const mentorCheck = document.getElementById('settings-mentorshipAvailable');
            if (mentorCheck) mentorCheck.checked = profile.mentorshipAvailable;
        }

    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

window.handleSettingsSubmit = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    }

    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('settings-name').value);
        formData.append('phone', document.getElementById('settings-phone').value);
        formData.append('location', document.getElementById('settings-location').value);
        formData.append('bio', document.getElementById('settings-bio').value);
        formData.append('linkedinUrl', document.getElementById('settings-linkedin').value || '');
        formData.append('githubUrl', document.getElementById('settings-github').value || '');

        const alumniFields = document.getElementById('settings-alumniFields');
        if (alumniFields && !alumniFields.classList.contains('d-none')) {
            formData.append('currentCompany', document.getElementById('settings-company').value);
            formData.append('jobRole', document.getElementById('settings-job').value);
            formData.append('skills', document.getElementById('settings-skills').value);
            formData.append('mentorshipAvailable', document.getElementById('settings-mentorshipAvailable').checked);
        }

        const fileInput = document.getElementById('settings-profileImage');
        if (fileInput && fileInput.files[0]) {
            formData.append('profileImage', fileInput.files[0]);
        }

        const updatedProfile = await api.users.updateProfile(formData);
        if (window.showToast) showToast('Profile updated successfully!', 'success');
        else alert('Profile updated successfully!');
        
        // Update local user object in storage
        const user = JSON.parse(localStorage.getItem('user'));
        const newUser = { ...user, ...updatedProfile };
        localStorage.setItem('user', JSON.stringify(newUser));
        
        // Sync UI
        document.querySelectorAll('.dashboard-user-name').forEach(el => el.innerText = newUser.name);
        if (newUser.profileImage) {
            const imgUrl = `http://localhost:5000${newUser.profileImage}`;
            document.querySelectorAll('.dashboard-user-avatar').forEach(img => {
                img.src = imgUrl;
            });
        }

    } catch (error) {
        if (window.showToast) showToast(error.message || 'Update failed', 'error');
        else alert(error.message || 'Update failed');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Save Changes';
        }
    }
};

window.previewSettingsImage = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Update main preview
            const preview = document.getElementById('settings-profilePreview');
            if (preview) preview.src = e.target.result;
            
            // Update navbar previews as well (for immediate feedback)
            document.querySelectorAll('.dashboard-user-avatar').forEach(img => {
                img.src = e.target.result;
            });
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// Data Fetching for Student/Alumni Sections
async function fetchDirectory(query = '') {
    const container = document.getElementById('directoryContainer');
    if(!container) return;
    container.innerHTML = '<div class="text-center py-5 w-100"><div class="spinner-border text-primary"></div></div>';
    try {
        const res = await fetch(`${BASE_URL}/alumni${query}`, { headers: api.getHeaders() });
        const alumni = await api.handleResponse(res);
        if(alumni.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-5 text-muted">No alumni found matching your filters.</div>';
            return;
        }
        let html = '';
        alumni.forEach(a => {
            const avatar = a.profileImage ? `http://localhost:5000${a.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=random`;
            html += `
            <div class="item-card d-flex flex-column p-4 h-100">
                <div class="d-flex align-items-center mb-4">
                    <div class="position-relative">
                        <img src="${avatar}" class="rounded-circle border border-3 border-white shadow-sm" width="70" height="70" style="object-fit: cover;">
                        <span class="position-absolute bottom-0 end-0 p-2 bg-success border border-white border-2 rounded-circle shadow-sm"></span>
                    </div>
                    <div class="ms-3">
                        <h6 class="fw-bold mb-0 text-dark">${a.name}</h6>
                        <div class="d-flex flex-column">
                            <small class="text-primary fw-bold text-uppercase" style="font-size: 0.7rem;">${a.currentCompany || 'Alumni'}</small>
                            ${a.location ? `<small class="text-muted" style="font-size: 0.65rem;"><i class="bi bi-geo-alt-fill me-1"></i>${a.location}</small>` : ''}
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <p class="small text-muted mb-0 line-clamp-3" style="min-height: 4.5em;">${a.headline || 'Experienced professional in the network, ready to connect and share insights.'}</p>
                </div>
                <div class="mt-auto d-flex gap-2">
                    <a href="alumni-profile.html?id=${a._id}" class="btn btn-sm btn-outline-primary flex-grow-1 py-2 rounded-pill">Profile</a>
                    <button onclick="switchDashboardSection('mentorship')" class="btn btn-sm btn-primary flex-grow-1 py-2 rounded-pill">Connect</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<div class="alert alert-danger">Failed to load directory.</div>'; }
}

async function fetchFullJobs(query = '') {
    const container = document.getElementById('dashJobsContainer');
    if(!container) return;
    container.innerHTML = '<div class="text-center py-5 w-100"><div class="spinner-border text-primary"></div></div>';
    try {
        const jobs = await api.jobs.getAll(query);
        if(jobs.length === 0) {
            container.innerHTML = '<div class="alert alert-info border-0 shadow-sm"><i class="bi bi-info-circle me-2"></i> No jobs found matching your criteria.</div>';
            return;
        }
        let html = '';
        jobs.forEach(j => {
            const userImg = j.postedBy && j.postedBy.profileImage ? `http://localhost:5000${j.postedBy.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(j.company)}&background=random`;
            const icon = j.type === 'job' ? 'bi-briefcase-fill text-primary' : 'bi-mortarboard-fill text-warning';
            
            html += `
            <div class="item-card flex-row align-items-center mb-3 p-3 bg-white shadow-sm rounded-3">
                <img src="${userImg}" alt="${j.company}" class="rounded-3 border" style="width: 70px; height: 70px; object-fit: cover;">
                <div class="ms-3 flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="fw-bold mb-1"><a href="job-details.html?id=${j._id}" class="text-dark text-decoration-none">${j.title}</a></h6>
                            <p class="text-muted small mb-1"><i class="${icon} me-1"></i> ${j.company} &bull; <i class="bi bi-geo-alt-fill me-1"></i> ${j.location}</p>
                            <div class="d-flex align-items-center gap-2 flex-wrap mt-2">
                                <span class="badge ${j.type === 'job' ? 'bg-primary' : 'bg-warning'} bg-opacity-10 ${j.type === 'job' ? 'text-primary' : 'text-warning'} text-uppercase border ${j.type === 'job' ? 'border-primary' : 'border-warning'} py-1">${j.type}</span>
                                <span class="badge bg-light text-dark border"><i class="bi bi-clock me-1"></i> ${j.deadline ? new Date(j.deadline).toLocaleDateString() : 'No deadline'}</span>
                            </div>
                        </div>
                        <div class="text-end">
                            <h6 class="text-success fw-bold mb-3">${j.salaryOrStipend || 'Competitive'}</h6>
                            <a href="job-details.html?id=${j._id}" class="btn btn-primary rounded-pill px-4 btn-sm shadow-sm">Details</a>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
        // Show post button for alumni
        const user = JSON.parse(localStorage.getItem('user'));
        if(user.role === 'alumni') document.getElementById('alumniPostJobBtn')?.classList.remove('d-none');
    } catch(e) { container.innerHTML = '<div class="alert alert-danger">Failed to load jobs.</div>'; }
}

async function fetchFullEvents(query = '') {
    const container = document.getElementById('dashEventsContainer');
    if(!container) return;
    container.innerHTML = '<div class="text-center py-5 w-100"><div class="spinner-border text-warning"></div></div>';
    try {
        const events = await api.events.getAll(query);
        if (events.length === 0) {
            container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="bg-light rounded-circle d-inline-flex p-4 mb-3">
                    <i class="bi bi-calendar-x text-muted h1 mb-0"></i>
                </div>
                <h5 class="text-muted">No events found for this category.</h5>
                <p class="text-muted small">Try checking another category or all events.</p>
            </div>`;
            return;
        }
        let html = '';
        const user = JSON.parse(localStorage.getItem('user'));
        events.forEach(e => {
            const imgUrl = e.bannerImage ? `http://localhost:5000${e.bannerImage}` : `assets/images/event-fallback.png`;
            const isOnline = e.venue && (e.venue.toLowerCase().includes('online') || e.meetingLink);
            const currentUserId = user.id || user._id;
            const isRegistered = user && e.registeredUsers && e.registeredUsers.some(uid => uid.toString() === currentUserId.toString());
            
            html += `
            <div class="item-card overflow-hidden w-100 p-0 h-100 position-relative" style="min-width: 280px; transition: transform 0.3s ease;">
                <!-- Register Button at the Top -->
                <div class="position-absolute top-0 end-0 p-3" style="z-index: 10;">
                    ${isRegistered 
                        ? `<span class="badge bg-success bg-opacity-75 backdrop-blur py-2 px-3 rounded-pill border border-white shadow-sm"><i class="bi bi-check-circle-fill me-1"></i> Registered</span>`
                        : `<button onclick="initRegistrationModal('${e._id}', '${e.title.replace(/'/g, "\\'")}')" class="btn btn-primary btn-sm px-4 py-2 rounded-pill shadow-lg border-2 border-white fw-bold">Register Now</button>`
                    }
                </div>

                <div class="cover-banner m-0" style="height: 180px; width: 100%;">
                    <img src="${imgUrl}" alt="${e.title}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="p-4 d-flex flex-column h-100">
                    <div class="d-flex flex-wrap gap-2 mb-3 mt-1">
                        <span class="badge-custom"><i class="bi bi-globe me-1"></i> ${isOnline ? 'Online' : 'In-Person'}</span>
                        <span class="badge-custom">${e.category}</span>
                    </div>
                    <h5 class="fw-bold mb-2 text-dark">${e.title}</h5>
                    <p class="opacity-75 small mb-3"><i class="bi bi-calendar-event text-primary me-2"></i>${new Date(e.date).toLocaleDateString()}</p>
                    
                    <div class="mt-auto pt-3 border-top border-light border-opacity-10 d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div class="small fw-bold opacity-50">
                            <i class="bi bi-people-fill text-primary me-1"></i> ${e.registeredUsers.length} Going
                        </div>
                        <div class="d-flex gap-2">
                             <a href="event-details.html?id=${e._id}" class="btn btn-outline-primary btn-sm px-3 rounded-pill">View Details</a>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<div class="alert alert-danger col-12">Failed to load events.</div>'; }
}

async function fetchMentorshipHub() {
    const container = document.getElementById('mentorshipContainer');
    if(!container) return;
    const user = JSON.parse(localStorage.getItem('user'));
    container.innerHTML = '<div class="text-center py-5 w-100"><div class="spinner-border text-primary"></div></div>';
    
    try {
        if(user.role === 'student') {
            // 1. Fetch all Alumni
            const alumnis = await api.alumni.getAll();
            // 2. Fetch student's existing requests to show status
            const myRequests = await api.mentorship.getAll();

            // Header section with better styling
            let html = `
            <div class="col-12 mb-5" style="grid-column: 1 / -1;">
                <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
                    <div>
                        <h3 class="fw-bold text-dark mb-1">Professional Mentors</h3>
                        <p class="text-muted mb-0">Connect with experienced alumni for guidance and career growth.</p>
                    </div>
                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-4 py-2 rounded-pill fw-bold">
                        <i class="bi bi-people-fill me-2"></i>Available Members: ${alumnis.length}
                    </span>
                </div>
            </div>`; 
            
            alumnis.forEach(a => {
                const avatar = a.profileImage ? `http://localhost:5000${a.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=random`;
                
                // Check if already requested
                const messageReq = myRequests.find(r => r.mentor._id === a._id && r.type === 'message');
                const callReq = myRequests.find(r => r.mentor._id === a._id && r.type === 'call');

                html += `
                <div class="item-card p-4 h-100 d-flex flex-column" style="min-height: 480px;">
                    <div class="text-center mb-4">
                        <div class="position-relative d-inline-block">
                            <img src="${avatar}" class="rounded-circle border border-4 border-white shadow-lg" width="100" height="100" style="object-fit: cover;">
                            <span class="position-absolute bottom-0 end-0 p-2 bg-success border border-white border-2 rounded-circle shadow-sm" title="Available"></span>
                        </div>
                        <h5 class="fw-bold mt-3 mb-1 text-dark">${a.name}</h5>
                        <p class="text-primary small fw-bold mb-0 text-uppercase letter-spacing-1">${a.jobRole || 'Professional'}</p>
                        <p class="text-muted small"><i class="bi bi-building me-1"></i> ${a.currentCompany || 'N/A'}</p>
                    </div>
                    
                    <div class="flex-grow-1 mb-4">
                        <div class="p-3 bg-light bg-opacity-50 rounded-4 mb-3" style="min-height: 80px;">
                            <p class="text-muted small mb-0 line-clamp-3" style="line-height: 1.6;">${a.bio || 'Experienced professional ready to help juniors navigate their career path through personalized guidance and industry insights.'}</p>
                        </div>
                        <div class="d-flex flex-wrap justify-content-center gap-2">
                            ${(a.skills || []).slice(0, 4).map(s => `<span class="badge bg-white text-primary border border-primary border-opacity-10 small px-3 py-2 rounded-pill shadow-sm">${s}</span>`).join('')}
                        </div>
                    </div>

                    <div class="mt-auto pt-4 border-top border-light border-opacity-10">
                        <button onclick="viewAlumniProfile('${a._id}')" class="btn btn-outline-primary btn-sm w-100 rounded-pill mb-3 fw-bold py-2 shadow-sm">View Full Profile</button>
                        <div class="d-flex gap-2">
                            <div class="flex-grow-1">
                                ${renderMentorshipBtn('message', messageReq, a._id)}
                            </div>
                            <div class="flex-grow-1">
                                ${renderMentorshipBtn('call', callReq, a._id)}
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        } else {
            // Alumni see their requests
            const requests = await api.mentorship.getAll();
            let html = '<div class="col-12"><div class="card shadow-sm border-0 overflow-hidden"><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="table-light"><tr><th>Student</th><th>Topic / Request</th><th>Type</th><th>Status</th><th>Action</th></tr></thead><tbody>';
            if(requests.length === 0) {
                html += '<tr><td colspan="5" class="text-center py-5 text-muted">No connection requests yet.</td></tr>';
            } else {
                requests.forEach(r => {
                    const statusClass = r.status === 'pending' ? 'bg-warning' : (r.status === 'accepted' ? 'bg-success' : 'bg-secondary');
                    const isCall = r.type === 'call';
                    const paymentBadge = isCall ? `<br><small class="badge ${r.paymentStatus === 'paid' ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${r.paymentStatus === 'paid' ? 'success' : 'danger'} py-0 mt-1">${r.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</small>` : '';

                    html += `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${r.student.profileImage ? 'http://localhost:5000'+r.student.profileImage : 'https://ui-avatars.com/api/?name='+r.student.name}" class="rounded-circle me-2" width="30" height="30">
                                <div><h6 class="mb-0 small fw-bold">${r.student.name}</h6><p class="text-muted mb-0" style="font-size: 0.7rem;">${r.student.department}</p></div>
                            </div>
                        </td>
                        <td><p class="mb-0 small">${r.topic}</p><small class="text-muted d-block text-truncate" style="max-width: 150px;">${r.message}</small></td>
                        <td><span class="badge bg-light text-dark border-0 text-uppercase" style="font-size: 0.65rem;">${r.type}</span></td>
                        <td><span class="badge ${statusClass} bg-opacity-10 text-${r.status === 'pending' ? 'warning' : (r.status === 'accepted' ? 'success' : 'dark')} border text-uppercase" style="font-size: 0.65rem;">${r.status}</span> ${paymentBadge}</td>
                        <td>
                            <div class="d-flex gap-1">
                                ${r.status === 'pending' ? `
                                    <button onclick="updateMentorshipStatus('${r._id}', 'accepted')" class="btn btn-sm btn-success shadow-sm"><i class="bi bi-check"></i></button>
                                    <button onclick="updateMentorshipStatus('${r._id}', 'rejected')" class="btn btn-sm btn-outline-danger shadow-sm"><i class="bi bi-x"></i></button>
                                ` : (r.status === 'accepted' ? '<span class="text-success small fw-bold">Active</span>' : '-')}
                            </div>
                        </td>
                    </tr>`;
                });
            }
            html += '</tbody></table></div></div></div>';
            container.innerHTML = html;
        }
    } catch(e) { 
        container.innerHTML = '<div class="alert alert-danger w-100">Failed to load mentorship hub. Error: ' + e.message + '</div>'; 
    }
}

function renderMentorshipBtn(type, request, mentorId) {
    if (!request) {
        const icon = type === 'message' ? 'bi-chat-dots' : 'bi-telephone';
        const label = type === 'message' ? 'Chat' : 'Call';
        return `<button onclick="initiateMentorshipRequest('${mentorId}', '${type}')" class="btn btn-sm btn-primary w-100 rounded-pill"><i class="bi ${icon} me-1"></i> ${label}</button>`;
    }

    if (request.status === 'pending') {
        return `<button class="btn btn-sm btn-warning w-100 rounded-pill text-white" disabled><i class="bi bi-hourglass-split me-1"></i> Requested</button>`;
    }

    if (request.status === 'rejected') {
        return `<button class="btn btn-sm btn-outline-secondary w-100 rounded-pill" disabled>Declined</button>`;
    }

    if (request.status === 'accepted') {
        if (type === 'call') {
            if (request.paymentStatus === 'paid') {
                return `<a href="tel:000" class="btn btn-sm btn-success w-100 rounded-pill"><i class="bi bi-telephone-outbound me-1"></i> Call Now</a>`;
            } else {
                return `<button onclick="processMentorshipPayment('${request._id}')" class="btn btn-sm btn-danger w-100 rounded-pill animate-pulse"><i class="bi bi-credit-card me-1"></i> Pay ₹500</button>`;
            }
        }
        return `<button onclick="window.location.href='community.html'" class="btn btn-sm btn-success w-100 rounded-pill"><i class="bi bi-chat-fill me-1"></i> Messaging</button>`;
    }

    return '';
}

// UI Actions
window.viewAlumniProfile = async function(id) {
    try {
        const a = await api.alumni.getOne(id);
        const modalBody = `
            <div class="text-center mb-4">
                <img src="${a.profileImage ? 'http://localhost:5000'+a.profileImage : 'https://ui-avatars.com/api/?name='+a.name}" class="rounded-circle border border-4 border-white shadow mb-3" width="120" height="120" style="object-fit: cover;">
                <h4 class="fw-bold mb-1">${a.name}</h4>
                <p class="text-primary fw-bold mb-0">${a.jobRole} @ ${a.currentCompany}</p>
                <div class="d-flex justify-content-center gap-3 mt-3">
                    ${a.linkedinUrl ? `<a href="${a.linkedinUrl}" target="_blank" class="text-muted fs-4"><i class="bi bi-linkedin"></i></a>` : ''}
                    ${a.githubUrl ? `<a href="${a.githubUrl}" target="_blank" class="text-muted fs-4"><i class="bi bi-github"></i></a>` : ''}
                    ${a.portfolioUrl ? `<a href="${a.portfolioUrl}" target="_blank" class="text-muted fs-4"><i class="bi bi-globe"></i></a>` : ''}
                </div>
            </div>
            <div class="row g-4 mb-4">
                <div class="col-md-6">
                    <h6 class="fw-bold small text-uppercase opacity-50 mb-2">Education</h6>
                    <p class="mb-0 fw-bold"><i class="bi bi-mortarboard me-2"></i> ${a.department}</p>
                    <p class="text-muted small">Class of ${a.passingYear}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold small text-uppercase opacity-50 mb-2">Skills</h6>
                    <div class="d-flex flex-wrap gap-1">
                        ${a.skills.map(s => `<span class="badge bg-primary bg-opacity-10 text-primary border-0 small px-2 py-1">${s}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div class="mb-4">
                <h6 class="fw-bold small text-uppercase opacity-50 mb-2">About</h6>
                <p class="small text-muted" style="line-height: 1.6;">${a.bio || 'No bio provided.'}</p>
            </div>
            <div class="alert alert-info border-0 p-3 rounded-4 small">
                <i class="bi bi-info-circle-fill me-2"></i> Note: For privacy reasons, mobile numbers are only shared after a request is accepted and verified.
            </div>
        `;
        
        document.getElementById('profileModalContent').innerHTML = modalBody;
        new bootstrap.Modal(document.getElementById('alumniProfileModal')).show();
    } catch(e) { alert("Failed to load profile: " + e.message); }
}

window.initiateMentorshipRequest = async function(mentorId, type) {
    if (!confirm(`Are you sure you want to send a ${type} request to this alumni?`)) return;
    try {
        await api.mentorship.request({
            mentorId,
            type,
            topic: `Request for ${type} connection`,
            message: `Hi, I would like to connect with you via ${type} for career guidance.`
        });
        alert("Request sent successfully! You will be notified when they accept.");
        fetchMentorshipHub();
    } catch(e) { alert(e.message); }
}

window.updateMentorshipStatus = async function(id, status) {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;
    try {
        await api.mentorship.updateStatus(id, status);
        fetchMentorshipHub();
    } catch(e) { alert(e.message); }
}

window.processMentorshipPayment = async function(id) {
    if (!confirm("Proceed to simulate payment of ₹500 for this call connection?")) return;
    try {
        const btn = event.target;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Processing...';
        
        await api.mentorship.pay(id);
        
        alert("Payment successful! Call feature is now enabled.");
        fetchMentorshipHub();
    } catch(e) { alert(e.message); }
}

async function loadPendingMentorships() {
    try {
        const requests = await api.mentorship.getAll();
        const user = JSON.parse(localStorage.getItem('user'));
        let pending = 0;
        
        if (user.role === 'alumni') {
            pending = requests.filter(r => r.status === 'pending').length;
        } else if (user.role === 'student') {
            // Number of accepted but unpaid/unviewed connections
            pending = requests.filter(r => r.status === 'accepted' && (r.type === 'message' || r.paymentStatus === 'pending')).length;
        }

        const badge = document.getElementById('mentorshipBadge');
        if (badge) {
            badge.innerText = pending > 0 ? pending : '0';
            if (pending > 0) badge.classList.remove('d-none');
            else badge.classList.add('d-none');
        }
    } catch (e) { 
        console.warn('Failed to load mentorship badge', e); 
    }
}

async function fetchCommunityFeed() {
    const container = document.getElementById('dashCommunityFeed');
    if(!container) return;
    container.innerHTML = '<div class="text-center py-5 w-100"><div class="spinner-border text-primary"></div></div>';
    try {
        const posts = await api.posts.getAll();
        const user = JSON.parse(localStorage.getItem('user'));
        let html = '';
        posts.forEach(p => {
            const hasLiked = p.likes.includes(user.id || user._id);
            const authorImg = p.author.profileImage ? `http://localhost:5000${p.author.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.author.name)}&background=random`;
            const postImg = p.image ? `<img src="http://localhost:5000${p.image}" class="img-fluid rounded border mt-3 w-100" style="max-height: 400px; object-fit: contain; background: #f8f9fa;">` : '';
            
            let badgeClass = 'bg-secondary';
            if (p.type === 'success_story') badgeClass = 'bg-success';
            else if (p.type === 'job_update') badgeClass = 'bg-primary';

            html += `
            <div class="card border-0 shadow-sm mb-4 p-4 item-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center">
                        <img src="${authorImg}" class="rounded-circle border me-3" width="50" height="50" style="object-fit: cover;">
                        <div>
                            <h6 class="fw-bold mb-0">${p.author.name}</h6>
                            <small class="text-muted">${new Date(p.createdAt).toLocaleDateString()} &bull; ${p.author.role}</small>
                        </div>
                    </div>
                    <span class="badge ${badgeClass} bg-opacity-10 text-dark border text-capitalize small">${p.type.replace('_', ' ')}</span>
                </div>
                <p class="mb-1" style="white-space: pre-wrap;">${p.content}</p>
                ${postImg}
                <div class="d-flex border-top mt-3 pt-3 gap-3">
                    <button class="btn btn-sm ${hasLiked ? 'btn-primary' : 'btn-light'} flex-grow-1 shadow-sm rounded-pill py-2" onclick="dashboardLikePost('${p._id}')"><i class="bi bi-hand-thumbs-up-fill me-1"></i> ${p.likes.length} Likes</button>
                    <button class="btn btn-sm btn-light flex-grow-1 shadow-sm rounded-pill py-2"><i class="bi bi-chat-fill me-1"></i> ${p.comments.length} Comments</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<div class="alert alert-danger">Failed to load community feed.</div>'; }
}

window.dashboardLikePost = async function(id) {
    try {
        await api.posts.like(id);
        fetchCommunityFeed();
    } catch(e) { alert(e.message); }
}

window.filterEventsByCategory = function(cat) {
    const q = cat === 'All' ? '' : `?category=${cat}`;
    currentEventFilter = q;
    fetchFullEvents(q);
    // UI feedback
    document.querySelectorAll('#eventCategories button').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.includes(cat) || (cat === 'All' && btn.innerText.includes('All'))) btn.classList.add('active');
    });
}

// Admin Specific Logic
window.switchAdminSection = function(section) {
    // 1. Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('d-none'));
    // 2. Show target
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('d-none');

    // 3. Update links
    document.querySelectorAll('.sidebar-link').forEach(l => {
        l.classList.remove('active');
        l.classList.add('text-white-50');
        l.style.borderLeftColor = 'transparent';
    });
    const activeLink = document.getElementById(`link-${section}`);
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.classList.remove('text-white-50');
        activeLink.style.borderLeftColor = 'var(--danger)';
    }

    // 4. Fetch data if needed
    if (section === 'jobs') fetchAdminJobs();
    if (section === 'events') fetchAdminEvents();
    if (section === 'announcements') fetchAdminAnnouncements();
    if (section === 'users') fetchAdminUsers();
    if (section === 'overview') fetchAdminAnalytics();
    if (section === 'create-event') fetchJobsForEventLinking();
}

async function fetchJobsForEventLinking() {
    const select = document.getElementById('eventLinkedJob');
    if (!select) return;
    try {
        const jobs = await api.jobs.getAll();
        select.innerHTML = '<option value="">-- No linked Job --</option>';
        jobs.forEach(job => {
            const opt = document.createElement('option');
            opt.value = job._id;
            opt.innerText = `${job.title} at ${job.company}`;
            select.appendChild(opt);
        });
    } catch(e) { console.error("Failed to fetch jobs for events", e); }
}

async function fetchAdminJobs() {
    const tbody = document.getElementById('adminJobsTableBody');
    if (!tbody) return;
    try {
        const jobs = await api.jobs.getAll();
        if (jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No jobs found.</td></tr>';
            return;
        }
        let html = '';
        jobs.forEach(j => {
            html += `
                <tr>
                    <td>${j.title}</td>
                    <td>${j.company}</td>
                    <td>${j.postedBy ? j.postedBy.name : 'Unknown'}</td>
                    <td>${new Date(j.createdAt).toLocaleDateString()}</td>
                    <td><div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteJob('${j._id}')">Delete</button>
                        ${j.applyLink ? `<a href="${j.applyLink}" target="_blank" class="btn btn-sm btn-outline-info"><i class="bi bi-link-45deg"></i> Link</a>` : ''}
                    </div></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (e) { tbody.innerHTML = '<tr><td colspan="5" class="text-danger">Error loading jobs.</td></tr>'; }
}

async function fetchAdminEvents() {
    const tbody = document.getElementById('adminEventsTableBody');
    if (!tbody) return;
    try {
        const events = await api.events.getAll();
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No events found.</td></tr>';
            return;
        }
        let html = '';
        events.forEach(e => {
            const startBtn = e.meetingLink ? `<button class="btn btn-sm btn-success ms-2" onclick="startMeeting('${e._id}')"><i class="bi bi-play-fill"></i> Start</button>` : '';
            html += `
                <tr>
                    <td>${e.title}</td>
                    <td>${new Date(e.date).toLocaleDateString()}</td>
                    <td>${e.createdBy ? e.createdBy.name : 'Admin'}</td>
                    <td>${e.registeredUsers.length} Users</td>
                    <td><div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent('${e._id}')">Delete</button>
                        ${startBtn}
                    </div></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) { tbody.innerHTML = '<tr><td colspan="5" class="text-danger">Error loading events.</td></tr>'; }
}

window.startMeeting = async function(id) {
    if (!confirm('Start this meeting and notify all users?')) return;
    try {
        await api.events.startMeeting(id);
        alert('Meeting started! Notification broadcasted to all users.');
    } catch (e) {
        alert(e.message);
    }
}

async function fetchAdminAnnouncements() {
    const container = document.getElementById('adminAnnouncementsList');
    if (!container) return;
    try {
        const announcements = await api.announcements.getAll();
        if (announcements.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-5">No announcements posted yet.</div>';
            return;
        }
        let html = '';
        announcements.forEach(a => {
            html += `
                <div class="card border mb-2">
                    <div class="card-body py-3 d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1 fw-bold">${a.title} ${a.isPinned ? '📌' : ''}</h6>
                            <small class="text-muted">${a.category} • ${new Date(a.createdAt).toLocaleDateString()}</small>
                        </div>
                        <button class="btn btn-sm btn-link text-danger" onclick="deleteAnnouncement('${a._id}')">Remove</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) { container.innerHTML = '<div class="text-danger p-3">Failed to load list.</div>'; }
}

window.deleteJob = async function(id) {
    if (!confirm('Are you sure you want to delete this job listing?')) return;
    try { await api.admin.deleteJob(id); } catch(e) { alert(e.message); }
}

window.deleteEvent = async function(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try { await api.admin.deleteEvent(id); } catch(e) { alert(e.message); }
}

window.deleteAnnouncement = async function(id) {
    if (!confirm('Delete this announcement?')) return;
    try { await api.admin.deleteAnnouncement(id); } catch(e) { alert(e.message); }
}
// Event Registration Modal Initialization (Global scope for button onclick)
window.initRegistrationModal = function(eventId, eventTitle) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Please login to register for events.');
        window.location.href = 'login.html';
        return;
    }

    // Populate modal
    document.getElementById('regEventId').value = eventId;
    const titleEl = document.getElementById('regModalTitle');
    if (titleEl) titleEl.innerText = `Register for ${eventTitle}`;
    
    document.getElementById('regFullName').value = user.name || '';
    document.getElementById('regNumber').value = user.rollNumber || '';
    document.getElementById('regMobile').value = user.phone || '';

    // Clear alerts
    const alertBox = document.getElementById('regAlert');
    if (alertBox) {
        alertBox.classList.add('d-none');
        alertBox.classList.remove('alert-success', 'alert-danger');
    }

    // Show modal
    const modalEl = document.getElementById('eventRegistrationModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        console.error('Event registration modal not found on this page');
    }
};

window.viewFullImage = function(src) {
    if (!src) return;
    
    // Use high-quality URL if it's a ui-avatars one
    let displaySrc = src;
    if (src.includes('ui-avatars.com')) {
        displaySrc = src.includes('?') ? src + '&size=512' : src + '?size=512';
    }

    let modalEl = document.getElementById('imagePreviewModal');
    if (!modalEl) {
        const modalHtml = `
            <div class="modal fade" id="imagePreviewModal" tabindex="-1" aria-hidden="true" style="z-index: 9999;">
                <div class="modal-dialog modal-dialog-centered modal-md">
                    <div class="modal-content bg-transparent border-0 shadow-none">
                        <div class="modal-body p-0 text-center position-relative">
                            <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-4" data-bs-dismiss="modal" aria-label="Close" style="z-index: 10000; filter: invert(1) brightness(2);"></button>
                            <img id="fullImageDisplay" src="${displaySrc}" class="img-fluid rounded-circle shadow-lg border border-white border-opacity-25" style="width: 400px; height: 400px; object-fit: cover; cursor: zoom-out;" onclick="bootstrap.Modal.getInstance(document.getElementById('imagePreviewModal')).hide()">
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalEl = document.getElementById('imagePreviewModal');
    } else {
        document.getElementById('fullImageDisplay').src = displaySrc;
    }
    
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};
