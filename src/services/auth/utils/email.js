const sgMail = require('@sendgrid/mail')
const verifyEmailTemplate = require('../templates/verify_email.js')
const { create, deleteVerificationCode, getVerificationCode } = require("../../../db/email.js")
const AppError = require('../../../errors/AppError.js')

sgMail.setApiKey(process.env.SEND_GRID_API_KEY)

async function sendEmail({ to, subject, html }) {
  await sgMail.send({
    to,
    from: process.env.MAIL_SENDER,
    replyTo: process.env.MAIL_SENDER,
    subject,
    html
  })
}

async function sendVerificationCode(to) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  if(!to) {
    return {
      status: false,
      message: "Missing recipient",
      data: null
    }
  }

  const create_code = await create({ code: code, email: to })

  if(create_code.status){
    await sendEmail( {
      to: to,
      subject: "Your verification code",
      text: `Your verification code is ${code}`,
      html: verifyEmailTemplate({
        code,
        appName: 'Scribo Blog',
        expiresInMinutes: 10
      })
    })
  }

  return create_code
}

async function verifyEmailCode(email, email_code) {
  if(!email) {
    throw new AppError("Missing email!")
  }
  if(!email_code) {
    throw new AppError("Missing email_code!")
  }
  
  const verification_code = await getVerificationCode(email)

  if(!verification_code.status) return false

  return verification_code.data.code === email_code
}

async function invalidateVerificationCode(email) {
  if(!email) {
    throw new AppError("Missing email!")
  }

  const result = await deleteVerificationCode(email)
  
  return result
}

module.exports = {
  sendVerificationCode,
  invalidateVerificationCode,
  verifyEmailCode
}