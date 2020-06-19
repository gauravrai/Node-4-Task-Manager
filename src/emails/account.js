const sgMail = require('@sendgrid/mail')
const sendGridApiKey = process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendGridApiKey);

const sendWelcomeEmail = (email, name) => {
  
  sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Welcome to the Task App',
    text: `Welcome to the app ${name}. Let me know if any problem!!`
  })
}

const sendCancellationEmail = (email, name) => {
  
  sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Good Bye....',
    text: `A good bye note for ${name} from Task app`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
}