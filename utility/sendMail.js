const nodemainler = require('nodemailer');
module.exports = async (email, subject, text) => {
    try {
        const transporter = nodemainler.createTransport({
            host: process.env.HOST,
            service: process.env.SERVICE,
            port: Number(process.env.PORT),
            secure: Boolean(process.env.SECURE),
            auth: {
                user: process.env.USER,
                pass: process.env.PASS
            }
        });

        await transporter.sendMail({
            from: process.env.USER,
            to: email,
            subject: subject,
            headers: {
                'Content-Type': 'text/html',
            },
            html: text
        });

        console.log("Email is Sent");
    } catch (error) {
        console.log("Error sending email: ", error);
        throw error;
    }
};
