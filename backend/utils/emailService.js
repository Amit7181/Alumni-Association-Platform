const nodemailer = require('nodemailer');

const sendOTPByEmail = async (email, otpCode) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"AlumniConnect Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Verification Code - AlumniConnect',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #0d6efd;">AlumniConnect</h1>
                    </div>
                    <p>Hello,</p>
                    <p>You are receiving this email because you requested a verification code for your AlumniConnect account.</p>
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otpCode}</span>
                    </div>
                    <p>This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">© 2024 AlumniConnect Platform. All rights reserved.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send OTP email');
    }
};

const sendJobBroadcast = async (emails, jobData) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"AlumniConnect Opportunities" <${process.env.EMAIL_USER}>`,
            bcc: emails, // Use BCC for privacy
            subject: `New Job Opportunity: ${jobData.title} at ${jobData.company}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #0d6efd;">New Job Alert!</h2>
                    <p>Hi there, a new career opportunity has just been posted by our alumni network.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${jobData.title}</h3>
                        <p style="margin-bottom: 5px;"><strong>Company:</strong> ${jobData.company}</p>
                        <p style="margin-bottom: 5px;"><strong>Location:</strong> ${jobData.location}</p>
                        <p style="margin-bottom: 0;"><strong>Type:</strong> ${jobData.type}</p>
                    </div>
                    <p>${jobData.description.substring(0, 150)}...</p>
                    <a href="http://localhost:3000/job-details.html?id=${jobData._id}" style="display: inline-block; padding: 10px 20px; background: #0d6efd; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">View Job Details</a>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Job broadcast sent to ${emails.length} students.`);
    } catch (err) {
        console.error('Job broadcast failed', err);
    }
};

const sendEventBroadcast = async (emails, eventData) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"AlumniConnect Events" <${process.env.EMAIL_USER}>`,
            bcc: emails,
            subject: `Upcoming Event: ${eventData.title}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #6f42c1;">New Event Scheduled</h2>
                    <p>Mark your calendars! A new community event has been announced.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${eventData.title}</h3>
                        <p style="margin-bottom: 5px;"><strong>Date:</strong> ${new Date(eventData.date).toDateString()}</p>
                        <p style="margin-bottom: 5px;"><strong>Category:</strong> ${eventData.category}</p>
                        <p style="margin-bottom: 0;"><strong>Venue:</strong> ${eventData.venue || 'Online'}</p>
                    </div>
                    <p>${eventData.description.substring(0, 150)}...</p>
                    <a href="http://localhost:3000/event-details.html?id=${eventData._id}" style="display: inline-block; padding: 10px 20px; background: #6f42c1; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">RSVP Now</a>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Event broadcast sent to ${emails.length} community members.`);
    } catch (err) {
        console.error('Event broadcast failed', err);
    }
};

module.exports = { sendOTPByEmail, sendJobBroadcast, sendEventBroadcast };
