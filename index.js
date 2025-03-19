const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Instructor = require("./models/instructur.js");
const RecentActivity = require("./models/recentActivity.js");
const FormData = require("./models/form.js");
const bodyParser = require("body-parser");

const app = express();

const cors = require("cors");
app.set("trust proxy", 1);


app.use(cors({
    origin: "*", // Allow all origins (for testing)
    methods: ["POST"], // Allow only POST requests
}));


app.use((req, res, next) => {
    // Allow requests from Gmail and other AMP email clients
    const allowedOrigins = [
      'https://mail.google.com', // Gmail
      'https://outlook.live.com', // Outlook
      'https://mail.yahoo.com', // Yahoo Mail
    ];
  
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  
    // Required AMP4Email header: Specify the allowed sender email or domain
    res.setHeader('AMP-Email-Allow-Sender', 'annasfurquan27@gmail.com');
  
    // Allow specific HTTP methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
    res.setHeader('AMP-Access-Control-Allow-Source-Origin', 'annasfurquan27@gmail.com');
  
    // Allow specific headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.setHeader('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin');
  
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
  
    next();
  });
  
// app.use(ampCors({
//     verifyOrigin: false,
//     allowCredentials: false,
//     enableAmpRedirectTo: false,
//     email: true
//   }));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "annasfurquan27@gmail.com",
        pass: "rpeu mugu ssel aram",
    },
});

app.post("/instructor", async (req, res) => {
    try {
        const i = await Instructor.create(req.body);
        res.status(200).json(i);

        const activity = new RecentActivity({
            action: "Created new instructur",
            entity: "Instructur",
            entityId: i._id
        });
        await activity.save();

        console.log(i);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Function to send AMP emails
const sendBatchAMPEmails = async (instructors) => {
    const emailPromises = instructors.map(async (instructor) => {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

        const ampHtml = ` <!doctype html>
<html ⚡4email lang="en" data-css-strict>
<head>
<meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
 
  <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
  <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
  <style amp4email-boilerplate>body{visibility:hidden}</style>
  <style amp-custom>
   
  /* Hides all inputs after successful form submission */
  form.amp-form-submit-success.sample-form.hide-inputs > input {
    display: none;
  }

  /* sample styles */
  .sample-form {
    padding: 0 var(--space-2);
  }
  .sample-form > * {
    margin: var(--space-1);
  }
  .sample-heading {
    margin: 0 var(--space-3);
    margin-top: var(--space-3);
    font-size: 18px;
  }
  </style>
</head>
<body>
  <h2 class="sample-heading">Form Submission w-xhrith Page Reload</h2>
  <form class="sample-form" method="get" action-xhr="https://afaeb456fcd4fdb55a389495ce934206.serveo.net/submit-availability">
    <input type="search" placeholder="Search..." name="search">
    <input type="submit" value="OK">
  </form>

  <h2 class="sample-heading">Form Submission with Page Update</h2>
  <!-- ## Form submission with client-side rendering -->
  <form class="sample-form" method="post" action-xhr="https://d0dc19381db4a2e61b8dd5f6734680e4.serveo.net/submit-availability">
    <input type="text" name="name" placeholder="Name..." required>
    <input type="email" name="email" placeholder="Email..." required>
    <input type="submit" value="Subscribe">
    <div hidden submit-success>
      <template type="amp-mustache">
        Success! Thanks {{name}} for trying the <code>amp-form</code> demo! Try to insert the word "error" as a name input in the form to see how <code>amp-form</code> handles errors.
      </template>
    </div>
    <div hidden submit-error>
      <template type="amp-mustache">
        Error! Thanks {{name}} for trying the <code>amp-form</code> demo with an error response.
      </template>
    </div>
  </form>
    <h2 class="sample-heading">Input type="radio"</h2>
    <form class="sample-form" method="post" action-xhr=" https://d0dc19381db4a2e61b8dd5f6734680e4.serveo.net/submit-availability">
      <input type="radio" id="cat" name="favourite animal" value="cat" checked>
      <label for="cat">Cat</label>
      <input type="radio" id="dog" name="favourite animal" value="dog">
      <label for="dog">Dog</label>
      <input type="radio" id="other" name="favourite animal" value="other">
      <label for="other">Other</label>
      <input type="submit" value="OK">
      <div submit-success>
        Success!
      </div>
      <div submit-error>
        Error!
      </div>
    </form>
</body>
</html>
`;


        const mailOptions = {
            from: "Admin <annasfurquan27@gmail.com>",
            to: instructor.email,
            subject: `Availability Request for ${instructor.course}`,
            html: ampHtml,
            // amp: ampHtml,
        };

        try {
            await transporter.sendMail(mailOptions);
            await RecentActivity.create({
                action: `Sent availability request for ${instructor.course}`,
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
        const instructors = await Instructor.find();
        if (instructors.length === 0) return res.status(404).json({ message: "No instructors found" });

        await sendBatchAMPEmails(instructors);
        res.status(200).json({ message: "Batch emails sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// API to record instructor availability response
app.post("/submit-availability", async (req, res) => {
    console.log("i'm here");
    console.log(req.body);
    try {
        const { email, course, availability, name, instructorId } = req.body;
        console.log(req.body)
        console.log(email, course, availability, name, instructorId)
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

// setInterval(sendFollowUpEmails, 10 * 1000); // Runs every 24 hours




// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to the database");
        app.listen(process.env.PORT, () => {
            console.log("Server is running on port 3001");
        });
    })
    .catch((error) => {
        console.log("Connection failed!!!", error);
    });