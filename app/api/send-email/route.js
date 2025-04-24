import nodemailer from "nodemailer";

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { email, fileUrl } = req.body;

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: "Gmail", // Or use another email service
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Your email password or app password
            },
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Uploaded File",
            text: `Your file has been uploaded successfully. You can download it here: ${fileUrl}`,
            html: `<p>Your file has been uploaded successfully. You can download it here: <a href="${fileUrl}">${fileUrl}</a></p>`,
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ success: true, message: "Email sent successfully" });
        } catch (error) {
            console.error("Error sending email:", error);
            res.status(500).json({ success: false, error: "Failed to send email" });
        }
    } else {
        res.status(405).json({ success: false, error: "Method not allowed" });
    }
}