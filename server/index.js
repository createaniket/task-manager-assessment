import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10kb" }));

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);
const Task = mongoose.model("Task", taskSchema);

// Only these fields can be written by clients (prevents mass-assignment)
const pick = (body) => {
  const out = {};
  for (const k of ["title", "description", "status", "priority", "dueDate"]) {
    if (body[k] !== undefined) out[k] = body[k] === "" && k === "dueDate" ? null : body[k];
  }
  return out;
};

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/tasks", wrap(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.q) filter.title = { $regex: String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  res.json(await Task.find(filter).sort({ createdAt: -1 }));
}));

app.post("/api/tasks", wrap(async (req, res) => {
  res.status(201).json(await Task.create(pick(req.body)));
}));

app.patch("/api/tasks/:id", wrap(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, pick(req.body), {
    new: true,
    runValidators: true,
  });
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
}));

app.delete("/api/tasks/:id", wrap(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.status(204).end();
}));

app.use((err, _req, res, _next) => {
  if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
  if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 9000;
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/taskmanager")
  .then(() => app.listen(PORT, () => console.log(`API on :${PORT}`)))
  .catch((e) => { console.error("Mongo connection failed:", e.message); process.exit(1); });
