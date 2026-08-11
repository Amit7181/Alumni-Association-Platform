// auth.js - Login and Registration Logic

document.addEventListener('DOMContentLoaded', () => {
    
    // Login Handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('loginBtn');
            
            try {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
                
                const data = await api.auth.login({ email, password });
                
                // Store auth
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    profileImage: data.profileImage
                }));

                alert('You have successfully logged in!');
                // Redirect based on role
                if (data.role === 'admin') window.location.href = 'admin-dashboard.html';
                else if (data.role === 'alumni') window.location.href = 'alumni-dashboard.html';
                else window.location.href = 'student-dashboard.html';

            } catch (error) {
                const errorAlert = document.getElementById('errorAlert');
                errorAlert.classList.remove('d-none');
                errorAlert.innerText = error.message;
            } finally {
                btn.disabled = false;
                btn.innerText = 'Log In';
            }
        });
    }

    // OTP Login - Step 1: Send OTP
    const otpSendForm = document.getElementById('otpSendForm');
    const otpVerifyForm = document.getElementById('otpVerifyForm');
    if (otpSendForm && otpVerifyForm) {
        otpSendForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('sendOtpBtn');
            try {
                btn.disabled = true;
                btn.innerText = 'Sending...';
                const email = document.getElementById('otpEmail').value;
                await api.auth.sendOTP(email);
                otpSendForm.classList.add('d-none');
                otpVerifyForm.classList.remove('d-none');
            } catch (error) {
                alert(error.message);
            } finally {
                btn.disabled = false;
                btn.innerText = 'Send Verification Code';
            }
        });

        otpVerifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('verifyOtpBtn');
            try {
                btn.disabled = true;
                btn.innerText = 'Verifying...';
                const email = document.getElementById('otpEmail').value;
                const code = document.getElementById('otpCode').value;
                const data = await api.auth.verifyOTP(email, code);

                if (data.isNewUser) {
                    sessionStorage.setItem('pendingEmail', data.email);
                    window.location.href = 'register.html';
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify({
                        id: data._id,
                        name: data.name,
                        email: data.email,
                        role: data.role,
                        profileImage: data.profileImage
                    }));
                    alert('You have successfully logged in!');
                    if (data.role === 'admin') window.location.href = 'admin-dashboard.html';
                    else if (data.role === 'alumni') window.location.href = 'alumni-dashboard.html';
                    else window.location.href = 'student-dashboard.html';
                }
            } catch (error) {
                alert(error.message);
            } finally {
                btn.disabled = false;
                btn.innerText = 'Verify & Log In';
            }
        });
    }

    // Mobile OTP Flow
    const mobileSendForm = document.getElementById('mobileSendForm');
    const mobileVerifyForm = document.getElementById('mobileVerifyForm');
    if (mobileSendForm && mobileVerifyForm) {
        mobileSendForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('sendMobileBtn');
            try {
                btn.disabled = true;
                btn.innerText = 'Sending...';
                const phone = document.getElementById('mobilePhone').value;
                await api.auth.sendPhoneOTP(phone);
                mobileSendForm.classList.add('d-none');
                mobileVerifyForm.classList.remove('d-none');
            } catch (error) {
                alert(error.message);
            } finally {
                btn.disabled = false;
                btn.innerText = 'Send Code';
            }
        });

        mobileVerifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('verifyMobileBtn');
            try {
                btn.disabled = true;
                btn.innerText = 'Verifying...';
                const phone = document.getElementById('mobilePhone').value;
                const code = document.getElementById('mobileCode').value;
                const data = await api.auth.verifyPhoneOTP(phone, code);

                if (data.isNewUser) {
                    sessionStorage.setItem('pendingPhone', data.phone);
                    window.location.href = 'register.html';
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify({
                        id: data._id,
                        name: data.name,
                        email: data.email,
                        role: data.role,
                        profileImage: data.profileImage
                    }));
                    alert('You have successfully logged in!');
                    if (data.role === 'admin') window.location.href = 'admin-dashboard.html';
                    else if (data.role === 'alumni') window.location.href = 'alumni-dashboard.html';
                    else window.location.href = 'student-dashboard.html';
                }
            } catch (error) {
                alert(error.message);
            } finally {
                btn.disabled = false;
                btn.innerText = 'Verify & Log In';
            }
        });
    }

    // Role Tab Switching visually on Register
    const roleBtns = document.querySelectorAll('.role-tab-btn');
    const studentFields = document.getElementById('studentFields');
    const alumniFields = document.getElementById('alumniFields');
    const selectedRoleInput = document.getElementById('selectedRole');

    if (roleBtns.length > 0) {
        roleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                roleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const role = btn.dataset.role;
                selectedRoleInput.value = role;

                const adminFields = document.getElementById('adminFields');
                const departmentWrapper = document.getElementById('departmentWrapper');
                const passingYearWrapper = document.getElementById('passingYearWrapper');
                
                if (adminFields) adminFields.classList.add('d-none');
                if (departmentWrapper) departmentWrapper.classList.remove('d-none');
                if (passingYearWrapper) passingYearWrapper.classList.remove('d-none');
                
                // Reset required attributes
                document.getElementById('department').required = true;
                document.getElementById('passingYear').required = true;

                if (role === 'student') {
                    studentFields.classList.remove('d-none');
                    alumniFields.classList.add('d-none');
                } else if (role === 'alumni') {
                    alumniFields.classList.remove('d-none');
                    studentFields.classList.add('d-none');
                } else if (role === 'admin') {
                    alumniFields.classList.add('d-none');
                    studentFields.classList.add('d-none');
                    if (adminFields) adminFields.classList.remove('d-none');
                    
                    // Hide department/passingYear
                    if (departmentWrapper) departmentWrapper.classList.add('d-none');
                    if (passingYearWrapper) passingYearWrapper.classList.add('d-none');
                    document.getElementById('department').required = false;
                    document.getElementById('passingYear').required = false;
                }
            });
        });
    }

    // Registration Handling
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            const role = selectedRoleInput.value;
            const userData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: password,
                role: role,
                department: document.getElementById('department').value,
                passingYear: document.getElementById('passingYear').value,
            };

            if (role === 'student') {
                userData.rollNumber = document.getElementById('rollNumber').value;
            } else if (role === 'alumni') {
                userData.currentCompany = document.getElementById('currentCompany').value;
                userData.jobRole = document.getElementById('jobRole').value;
                const skillsStr = document.getElementById('skills').value;
                userData.skills = skillsStr.split(',').map(s => s.trim());
            } else if (role === 'admin') {
                const passcode = document.getElementById('adminPasscode').value;
                if (passcode !== 'ADMIN123') {
                    alert('Invalid Admin Passcode!');
                    return;
                }
            }

            const btn = document.getElementById('registerBtn');
            
            try {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
                
                const data = await api.auth.register(userData);
                
                // Store auth
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    profileImage: data.profileImage
                }));

                alert('You have successfully registered!');
                // Redirect
                if (data.role === 'admin') window.location.href = 'admin-dashboard.html';
                else if (data.role === 'alumni') window.location.href = 'alumni-dashboard.html';
                else window.location.href = 'student-dashboard.html';

            } catch (error) {
                alert('Registration failed: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.innerText = 'Register Now';
            }
        });
    }
});
