const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Instructur = require("./models/instructur.js");
const RecentActivity = require("./models/recentActivity.js");
const FormData = require("./models/form.js");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "annasfurquan27@gmail.com",
        pass: "rpeu mugu ssel aram",
    },
});

// Function to send AMP emails
const sendBatchAMPEmails = async (instructors, course) => {
    const emailPromises = instructors.map(async (instructor) => {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

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
                <h1>${greeting}, ${instructor.name}!</h1>
                <p>We have a new course for you: <b>${course.name}</b></p>
                <p>Description: ${course.description}</p>
                <p>Would you be available to teach this course?</p>

                <form method="post" action-xhr="/submit-availability" target="_top">
                    <input type="hidden" name="email" value="${instructor.email}">
                    <input type="hidden" name="course" value="${course.name}">
                    <input type="hidden" name="name" value="${instructor.name}">
                    <input type="hidden" name="instructorId" value="${instructor._id}">
                    <label>Choose Availability:</label><br>
                    <input type="radio" name="availability" value="9AM - 12PM" required> 9AM - 12PM<br>
                    <input type="radio" name="availability" value="1PM - 4PM"> 1PM - 4PM<br>
                    <input type="radio" name="availability" value="5PM - 8PM"> 5PM - 8PM<br>
                    <input type="radio" name="availability" value="Not Available"> Not Available<br>
                    
                    <button type="submit">Submit</button>

                   
                </form>
            </body>
            </html>
        `;

        const mailOptions = {
            from: "Admin <annasfurquan27@gmail.com>",
            to: instructor.email,
            subject: `Availability Request for ${course.name}`,
            html: ampHtml,
            amp: ampHtml,
        };

        try {
            await transporter.sendMail(mailOptions);
            await RecentActivity.create({
                action: `Sent availability request for ${course.name}`,
                entity: "Instructor",
                entityId: instructor._id,
            });
        } catch (error) {
            console.error(`Email failed to ${instructor.email}:`, error);
        }
    });

    await Promise.all(emailPromises);
};

// API to send batch emails
app.post("/send-batch-emails", async (req, res) => {
    try {
        const instructors = await Instructur.find();
        if (instructors.length === 0) return res.status(404).json({ message: "No instructors found" });

        await sendBatchAMPEmails(instructors, { name: 'CSE', description: 'This is a great course' });
        res.status(200).json({ message: "Batch emails sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API to record instructor availability response
app.post("/submit-availability", async (req, res) => {
    try {
        const { email, course, availability, name, instructorId } = req.body;
        if (!email || !course || !availability) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const formData = new FormData({
            email : email,
            availability : availability,
            instructorName : name,
            instructorId  : instructorId

        })
        await formData.save()
        res.send("Form Submission successfull")

        await RecentActivity.create({
            action: "Instructor Availability Response",
            entity: "Instructor",
            metadata: { email, course, availability },
        });

        res.json({ message: "Availability submitted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error submitting availability" });
    }
});

// Automated Follow-Up System
const sendFollowUpEmails = async () => {
    const pendingResponses = await RecentActivity.find({ action: "Sent availability request for CSE" });
    const respondedEmails = new Set(
        (await RecentActivity.find({ action: "Instructor Availability Response" })).map(r => r.metadata.email)
    );
    const followUpInstructors = pendingResponses.filter(p => p.metadata && p.metadata.email && !respondedEmails.has(p.metadata.email));

    if (followUpInstructors.length > 0) {
        console.log("Sending follow-up emails...");
        await sendBatchAMPEmails(followUpInstructors.map(i => ({ email: i.metadata.email, name: "Instructor" })), { name: 'CSE', description: 'Follow-up: Please respond' });
    }
};

setInterval(sendFollowUpEmails, 10 * 1000); // Runs every 24 hours




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
