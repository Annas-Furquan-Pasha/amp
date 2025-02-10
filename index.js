const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Instructur = require("./models/instructur.js");
const RecentActivity = require("./models/recentActivity.js");
const app = express();

app.use(express.json());

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "annasfurquan27@gmail.com",
        pass: "rpeu mugu ssel aram",
    },
});

// Function to send AMP emails to multiple instructors
const sendBatchAMPEmails = async (instructors, action) => {
    const emailPromises = instructors.map(async (instructor) => {
        const ampHtml = `
            <!doctype html>
            <html ⚡4email>
            <head>
                <meta charset="utf-8">
                <style amp4email-boilerplate>body{visibility:hidden}</style>
                <script async src="https://cdn.ampproject.org/v0.js"></script>
                <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
            </head>
            <body>
                <h1>Hello ${instructor.name}!</h1>
                <p>Your profile has been <b>${action}</b>.</p>

                <p>We'd love your feedback! Please fill out the form below:</p>

                <form method="post"
                    action-xhr="https://your-api.com/data"
                    target="_top">
                    <label for="feedback">Your Feedback:</label>
                    <input type="text" name="feedback" id="feedback" required>
                    <input type="hidden" name="email" value="${instructor.email}">
                    
                    <button type="submit">Submit</button>
                    
                    <div submit-success>
                        <template type="amp-mustache">
                            <p>Thank you! Your feedback has been received.</p>
                        </template>
                    </div>
                    <div submit-error>
                        <template type="amp-mustache">
                            <p>Oops! Something went wrong. Please try again.</p>
                        </template>
                    </div>
                </form>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Admin" <annasfurquan27@gmail.com>`,
            to: instructor.email,
            subject: `Your Profile Has Been ${action}`,
            text: `Hello ${instructor.name}, Your profile has been ${action}. Please provide feedback.`,
            html: ampHtml,
            amp: ampHtml,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            await RecentActivity.create({
                action: `Sent email with feedback form: ${action}`,
                entity: "Instructur",
                entityId: instructor._id,
                metadata: { emailResponse: info.response },
            });

            console.log(`Email sent to ${instructor.email}:`, info.response);
        } catch (error) {
            console.error(`Email failed to ${instructor.email}:`, error);
            await RecentActivity.create({
                action: "Failed to send AMP email",
                entity: "Instructur",
                entityId: instructor._id,
                metadata: { error: error.message },
            });
        }
    });

    // Execute all email sending promises
    await Promise.all(emailPromises);
};

// API to send batch emails
app.post("/send-batch-emails", async (req, res) => {
    try {
        const instructors = await Instructur.find(); // Get all instructors
        if (instructors.length === 0) {
            return res.status(404).json({ message: "No instructors found" });
        }

        await sendBatchAMPEmails(instructors, "Updated");
        res.status(200).json({ message: "Batch emails sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Connect to MongoDB
mongoose.connect("mongodb+srv://annasfurquan:Fsrxq13jTKVK8GXk@bac.6perr.mongodb.net/Node-API?retryWrites=true&w=majority&appName=Bac")
    .then(() => {
        console.log("Connected to the database");
        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch((error) => {
        console.log("Connection failed!!!", error);
    });
