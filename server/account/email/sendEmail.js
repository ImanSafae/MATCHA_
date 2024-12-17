const nodemailer = require('nodemailer');

function sendEmail(mailOptions) {
    let transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
        });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            // console.error("[SEND EMAIL] Error while sending email:", error)
        } else {
            // console.log("[SEND EMAIL] Email successfully sent.")
        }
    });

}

function sendEmailAccountConfirmation(email, username, uuid) {
    const confirmationLink =
    process.env.DOMAIN +
    ":" +
    process.env.CLIENT_PORT +
    `/account/confirm-email?uuid=${uuid}`;

    const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Confirmation',
    html:   `<p>Hi ${username},</p>
            <p>Please click on the link below to confirm your email:</p>
            <a href="${confirmationLink}">Confirm Email</a>
            <p>Thank you,<br>The Matcha Team</p>`
    }

    sendEmail(mailOptions);
}

function sendEmailReportProfile(reporterId, reportedId) {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'User Report',
        html:   `<p>The user number ${reporterId} reported the user</p>
                <p>number ${reportedId} as fake account on </p>
                <p>${timestamp} UTC</p>`
        }
        sendEmail(mailOptions);
}

function sendEmailUpdateEmail(email, username, uuid) {
    const confirmationLink =
    process.env.DOMAIN +
    ":" +
    process.env.CLIENT_PORT +
    `/account/update-email?uuid=${uuid}`;

    const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Confirmation',
    html:   `<p>Hi ${username},</p>
            <p>Please click on the link below to confirm your email:</p>
            <a href="${confirmationLink}">Confirm Email</a>
            <p>Thank you,<br>The Matcha Team</p>`
    }

    sendEmail(mailOptions);
}

function sendEmailForgottenPassword(email, username, uuid) {
    const confirmationLink =
    process.env.DOMAIN +
    ":" +
    process.env.CLIENT_PORT +
    `/account/password/recover?uuid=${uuid}`;

    const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Password',
    html:   `<p>Hi ${username},</p>
            <p>We received a request to reset the password for your account. If you made this request, please click the link below to reset your password. If you did not request a password reset, please ignore this email.</p>
            <p><a href="${confirmationLink}">Reset your password</a></p>
            <p>Thank you,<br>The Matcha Team</p>`
    }

    sendEmail(mailOptions);
}

module.exports = { 
    sendEmailAccountConfirmation,
    sendEmailForgottenPassword,
    sendEmailUpdateEmail,
    sendEmailReportProfile
};  