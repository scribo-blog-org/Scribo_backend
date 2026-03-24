const nodemailer = require('nodemailer');
const verifyEmailTemplate = require('../templates/verify_email.js');
const AppError = require('../../../errors/AppError.js');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_SENDER,
        pass: process.env.MAIL_PASSWORD
    }
});

async function sendEmail({ to, subject, code }) {
    try {
        const htmlContent = verifyEmailTemplate({
            code,
            appName: 'Scribo Blog',
            expiresInMinutes: 10
        });

        const mailOptions = {
            from: '"Scribo Blog" <scribo.blog.dev@gmail.com>',
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        
        return { status: true, data: info };

    } catch (error) {
        throw new AppError({ message: "Failed to send email!"})
    }
}

module.exports = { sendEmail };