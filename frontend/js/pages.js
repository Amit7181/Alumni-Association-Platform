// pages.js - Logic for public/private pages (directory, jobs)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Alumni Directory Logic
    const directoryContainer = document.getElementById('alumniDirectoryContainer');
    if (directoryContainer) {
        fetchAlumniDirectory();
        
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const search = document.getElementById('searchName').value;
                const dept = document.getElementById('filterDept').value;
                const year = document.getElementById('filterYear').value;
                fetchAlumniDirectory(`?search=${search}&department=${dept}&passingYear=${year}`);
            });
        }

        // Global socket listener for new alumni or profile changes
        if (window.socket) {
            window.socket.on('user_registered', (data) => {
                if (data.role === 'alumni') fetchAlumniDirectory();
            });
            window.socket.on('user_updated', (data) => {
                if (data.role === 'alumni') fetchAlumniDirectory();
            });
        }
    }
});

async function fetchAlumniDirectory(query = '') {
    const container = document.getElementById('alumniDirectoryContainer');
    container.innerHTML = '<div class="text-center py-5 w-100"><div class="spinner-border text-primary"></div></div>';
    
    try {
        const alumnis = await api.alumni.getAll(query);
        
        if (alumnis.length === 0) {
            container.innerHTML = `<div class="alert alert-info w-100 text-center">No alumni found matching your criteria.</div>`;
            return;
        }

        let html = '';
        alumnis.forEach(alumni => {
            const imgUrl = alumni.profileImage ? `http://localhost:5000${alumni.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.name)}&background=random`;
            const skillsHtml = alumni.skills.slice(0, 3).map(s => `<span class="skill-tag">${s}</span>`).join('');
            
            html += `
            <div class="col-md-6 col-lg-4">
                <div class="user-card">
                    <img src="${imgUrl}" alt="${alumni.name}">
                    <h5 class="fw-bold mb-1">${alumni.name}</h5>
                    <p class="text-primary mb-2 small fw-semibold">${alumni.jobRole || 'Professional'} @ ${alumni.currentCompany || 'Company'}</p>
                    <p class="text-muted small mb-3"><i class="bi bi-mortarboard me-1"></i> ${alumni.department} '${alumni.passingYear || ''}</p>
                    <div class="mb-3">
                        ${skillsHtml}
                        ${alumni.skills.length > 3 ? `<span class="skill-tag">+${alumni.skills.length - 3}</span>` : ''}
                    </div>
                    <div class="d-flex gap-2 justify-content-center">
                        <a href="alumni-profile.html?id=${alumni._id}" class="btn btn-outline-primary btn-sm rounded-pill px-3">View Profile</a>
                        ${alumni.mentorshipAvailable ? `<a href="mentorship.html?mentor=${alumni._id}" class="btn btn-primary btn-sm rounded-pill px-3"><i class="bi bi-person-up"></i> Mentor</a>` : ''}
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger w-100 text-center">Failed to load directory.</div>`;
    }
}
