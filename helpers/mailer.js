const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars')

const { SMTP_USE_TEST_ACC } = process.env

//payload: {to: String, subject: String, url: String, type: String}
async function sendMail({ to, hash, type }) {
    if (SMTP_USE_TEST_ACC === "true") {
        testAccount = await nodemailer.createTestAccount();
    }

    // Get HTML template
    const filePath = path.join(__dirname, `../templates/${type}.html`);
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);

    const replacements = {
        HEADER_TEXT: getHeaderText(type),
        DESCRIPTION_TEXT: getDescriptionText(type),
        BUTTON_TEXT: getButtonText(type),
        BUTTON_LINK: getURL(type, hash),
        BUTTON_ERROR_TEXT: getButtonErrorText(type),
        FOOTER_TEXT: getFooterText(type),
        SITE_NAME: process.env.SITE_NAME
    };

    // Replace text in HTML template
    const htmlToSend = template(replacements);

    // Create nodemailer transport
    const transporter = nodemailer.createTransport({
        host: SMTP_USE_TEST_ACC !== "true" ? process.env.SMTP_HOST : testAccount.smtp.host,
        port: Number(SMTP_USE_TEST_ACC !== "true" ? process.env.SMTP_PORT : testAccount.smtp.port),
        secure: SMTP_USE_TEST_ACC !== "true" ? process.env.SMTP_SECURE : testAccount.smtp.secure,
        auth: {
            user: SMTP_USE_TEST_ACC !== "true" ? process.env.SMTP_USERNAME : testAccount.user,
            pass: SMTP_USE_TEST_ACC !== "true" ? process.env.SMTP_PASSWORD : testAccount.pass
        },
        tls: { rejectUnauthorized: false }
    })

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject: getSubjectText(type),
        text: getURL(type, hash),
        html: htmlToSend
    }
    // Try to send mail
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        if (SMTP_USE_TEST_ACC === "true") {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
            return { previewMail: nodemailer.getTestMessageUrl(info), verifyHash: hash }
        }
    } catch (err) {
        throw new Error(`Mail yollanamadı: ${err}`)
    }

}

function getHeaderText(type) {
    switch (type) {
        case "register_mail": {
            return "Mail Onaylama"
        }
        default: {
            return "null"
        }
    }
}

function getDescriptionText(type) {
    switch (type) {
        case "register_mail": {
            return `Bu maili ${process.env.SITE_NAME} sitesine kayıt olmak istediğiniz için aldınız.`
        }
        default: {
            return "null"
        }
    }
}

function getButtonText(type) {
    switch (type) {
        case "register_mail": {
            return "Hesabınızı doğrulamak için tıklayın"
        }
        default: {
            return "null"
        }
    }
}

function getSubjectText(type) {
    switch (type) {
        case "register_mail": {
            return `${process.env.SITE_NAME} Hesap Onaylama`
        }
        default: {
            return "null"
        }
    }
}

function getButtonErrorText(type) {
    switch (type) {
        case "register_mail": {
            return "Eğer yukardaki butonu kullanamıyorsanız, aşağıdaki URL'yi kullanarak kayıt işlemlerinizi tamamlayabilirsiniz."
        }
        default: {
            return "null"
        }
    }
}

function getURL(type, hash) {
    switch (type) {
        case "register_mail": {
            return `${process.env.HOST_URL}/kullanici-dogrula/${hash}`
        }
        default: {
            return "null"
        }
    }
}

function getFooterText(type) {
    switch (type) {
        case "register_mail": {
            return `Bu maili ${process.env.SITE_NAME} sitesine kayıt olmak istediğiniz için aldınız. Eğer sitemize kayıt olmadıysanız, maili yok sayabilirsiniz.`
        }
        default: {
            return "null"
        }
    }
}

module.exports = { sendMail }