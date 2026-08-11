/**
 * Simulated SMS Service for AlumniConnect
 * In a production environment, this would integrate with Twilio, AWS SNS, etc.
 */
const sendOTPBySMS = async (phone, otpCode) => {
    try {
        // SIMULATION: Log the OTP to the console
        console.log(`
---------------------------------------
[SMS SIMULATOR]
To: ${phone}
Message: Your AlumniConnect verification code is: ${otpCode}
Expires in: 5 minutes
---------------------------------------
        `);

        // In a real app, you would do:
        // await twilioClient.messages.create({ body: ..., from: ..., to: phone });

        return true;
    } catch (error) {
        console.error('SMS sending simulation failed:', error);
        throw new Error('Failed to send OTP via SMS');
    }
};

module.exports = { sendOTPBySMS };
