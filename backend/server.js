import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  passwordHash: String,
  analyses: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const analysisSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  resumeText: String,
  score: Number,
  skills: [String],
  suggestions: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const savedSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  jobId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);
const Analysis = mongoose.model("Analysis", analysisSchema);
const Saved = mongoose.model("Saved", savedSchema);

let db = false;

const jobs = [
  {
    _id: "j1",
    title: "Frontend Engineer",
    company: "Northstar Labs",
    location: "Remote",
    level: "Junior",
    skills: ["React", "JavaScript", "CSS"],
    matchScore: 94
  },
  {
    _id: "j2",
    title: "Full Stack Developer",
    company: "CloudForge",
    location: "Hybrid",
    level: "Mid",
    skills: ["Node.js", "React", "MongoDB"],
    matchScore: 91
  },
  {
    _id: "j3",
    title: "Data Analyst",
    company: "InsightWorks",
    location: "On-site",
    level: "Junior",
    skills: ["SQL", "Python", "Excel"],
    matchScore: 78
  },
  {
    _id: "j4",
    title: "AI Engineer",
    company: "NeuralWorks",
    location: "Remote",
    level: "Senior",
    skills: ["Python", "Machine Learning", "LLMs"],
    matchScore: 84
  },
  {
    _id: "j5",
    title: "Backend Engineer",
    company: "ScaleGrid",
    location: "Remote",
    level: "Mid",
    skills: ["Node.js", "PostgreSQL", "Redis"],
    matchScore: 87
  }
];

let memUsers = [];
let memAnalyses = [];
let memSaved = [];

mongoose
  .connect(process.env.MONGODB_URI || "")
  .then(() => {
    db = true;
    console.log("MongoDB connected");
  })
  .catch(() => {
    console.log("MongoDB unavailable; using memory mode");
  });

const tok = (u) =>
  jwt.sign(
    {
      id: String(u._id)
    },
    SECRET,
    {
      expiresIn: "7d"
    }
  );

const safe = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  token: tok(u)
});

async function auth(req, res, next) {
  try {
    req.user = jwt.verify(
      (req.headers.authorization || "").replace("Bearer ", ""),
      SECRET
    );

    next();
  } catch {
    res.status(401).json({
      message: "Authentication required"
    });
  }
}

function detect(text) {
  const dictionary = [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "SQL",
    "Python",
    "Java",
    "C++",
    "HTML",
    "CSS",
    "Git",
    "Docker",
    "AWS",
    "Machine Learning",
    "TensorFlow",
    "LLMs",
    "REST API",
    "GraphQL",
    "Redis"
  ];

  const low = text.toLowerCase();

  return dictionary.filter((skill) =>
    low.includes(skill.toLowerCase())
  );
}

function score(text, skills) {
  let s = Math.min(
    100,
    35 +
      skills.length * 5 +
      (text.length > 800 ? 15 : 0) +
      (text.includes("@") ? 5 : 0) +
      (text.toLowerCase().includes("project") ? 10 : 0) +
      (text.toLowerCase().includes("experience") ? 10 : 0)
  );

  return s;
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: db ? "mongodb" : "memory"
  });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const ex = db
      ? await User.findOne({ email })
      : memUsers.find((x) => x.email === email);

    if (ex) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const u = {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      analyses: 0
    };

    const x = db
      ? await User.create(u)
      : Object.assign(
          {
            _id: crypto.randomUUID()
          },
          u
        );

    if (!db) {
      memUsers.push(x);
    }

    res.status(201).json({
      user: safe(x)
    });
  } catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const u = db
      ? await User.findOne({ email })
      : memUsers.find((x) => x.email === email);

    if (
      !u ||
      !(await bcrypt.compare(password, u.passwordHash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    res.json({
      user: safe(u)
    });
  } catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const text = req.body.resumeText || "";

    if (text.length < 30) {
      return res.status(400).json({
        message: "Resume text is too short"
      });
    }

    const skills = detect(text);
    const sc = score(text, skills);
    const suggestions = [];

    if (!skills.includes("TypeScript")) {
      suggestions.push(
        "Add TypeScript projects or experience if applicable."
      );
    }

    if (!skills.includes("Git")) {
      suggestions.push(
        "Highlight version control and collaboration workflows."
      );
    }

    if (!text.toLowerCase().includes("project")) {
      suggestions.push(
        "Add measurable project outcomes."
      );
    }

    if (!text.toLowerCase().includes("experience")) {
      suggestions.push(
        "Describe responsibilities and measurable impact."
      );
    }

    if (!suggestions.length) {
      suggestions.push(
        "Keep achievements measurable and tailor keywords to each role."
      );
    }

    const out = {
      score: sc,
      skills,
      suggestions
    };

    if (req.headers.authorization) {
      try {
        const a = jwt.verify(
          req.headers.authorization.replace("Bearer ", ""),
          SECRET
        );

        const doc = {
          userId: a.id,
          resumeText: text,
          score: sc,
          skills,
          suggestions
        };

        if (db) {
          await Analysis.create(doc);
        } else {
          memAnalyses.push({
            ...doc,
            _id: crypto.randomUUID()
          });
        }

        const u = db
          ? await User.findById(a.id)
          : memUsers.find(
              (x) => String(x._id) === String(a.id)
            );

        if (u) {
          u.analyses = (u.analyses || 0) + 1;

          if (db) {
            await u.save();
          }
        }
      } catch {
        // Analysis can still be returned without authentication.
      }
    }

    res.json(out);
  } catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
});

app.get("/api/jobs", (req, res) => {
  res.json(jobs);
});

app.post("/api/saved-jobs", auth, async (req, res) => {
  try {
    const exists = db
      ? await Saved.findOne({
          userId: req.user.id,
          jobId: req.body.jobId
        })
      : memSaved.find(
          (x) =>
            x.userId === req.user.id &&
            x.jobId === req.body.jobId
        );

    if (exists) {
      return res.status(409).json({
        message: "Job already saved"
      });
    }

    const x = {
      userId: req.user.id,
      jobId: req.body.jobId
    };

    const d = db
      ? await Saved.create(x)
      : Object.assign(
          {
            _id: crypto.randomUUID()
          },
          x
        );

    if (!db) {
      memSaved.push(d);
    }

    res.status(201).json(d);
  } catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
});

app.get("/api/dashboard", auth, async (req, res) => {
  try {
    const saved = db
      ? await Saved.find({
          userId: req.user.id
        })
      : memSaved.filter(
          (x) => x.userId === req.user.id
        );

    const ids = saved.map((x) => String(x.jobId));

    const savedJobs = jobs.filter((j) =>
      ids.includes(j._id)
    );

    const u = db
      ? await User.findById(req.user.id)
      : memUsers.find(
          (x) =>
            String(x._id) === String(req.user.id)
        );

    res.json({
      analyses: u?.analyses || 0,
      savedJobs
    });
  } catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `CareerPilot API running on http://localhost:${PORT}`
  );
});