import { Router } from "express";
import { z } from "zod";
import { askCoachAssistant } from "../services/ai.js";
import { buildPerformancePdf } from "../services/report.js";
import {
  completeTraining,
  createAthlete,
  createTeam,
  createTraining,
  getDashboard,
  getStats,
  listAttendance,
  listAthletes,
  listCoaches,
  listTeams,
  listTrainings,
  registerCoach
} from "../services/store.js";

const router = Router();

const athleteSchema = z.object({
  name: z.string().min(2),
  number: z.coerce.number().int().min(1).max(99),
  position: z.string().min(2),
  age: z.coerce.number().int().min(10).max(60).optional()
});

const trainingSchema = z.object({
  date: z.string().min(10),
  time: z.string().min(4),
  title: z.string().min(2),
  focus: z.string().min(2),
  venue: z.string().min(2).optional(),
  invited: z.coerce.number().int().min(0).optional()
});

const attendanceSchema = z.object({
  notes: z.string().optional(),
  attendance: z
    .array(
      z.object({
        athleteId: z.string().min(1),
        status: z.enum(["present", "absent", "injured", "excused"]),
        notes: z.string().optional()
      })
    )
    .min(1)
});

const teamSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  season: z.string().min(4),
  coach: z.string().min(2),
  venue: z.string().min(2)
});

const coachSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  teamId: z.string().optional()
});

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "handball-team-manager" });
});

router.get("/dashboard", async (req, res, next) => {
  try {
    res.json(await getDashboard());
  } catch (error) {
    next(error);
  }
});

router.get("/athletes", async (req, res, next) => {
  try {
    res.json(await listAthletes());
  } catch (error) {
    next(error);
  }
});

router.post("/athletes", async (req, res, next) => {
  try {
    const input = athleteSchema.parse(req.body);
    res.status(201).json(await createAthlete(input));
  } catch (error) {
    next(error);
  }
});

router.get("/trainings", async (req, res, next) => {
  try {
    res.json(await listTrainings());
  } catch (error) {
    next(error);
  }
});

router.post("/trainings", async (req, res, next) => {
  try {
    const input = trainingSchema.parse(req.body);
    res.status(201).json(await createTraining(input));
  } catch (error) {
    next(error);
  }
});

router.get("/trainings/:id/attendance", async (req, res, next) => {
  try {
    res.json(await listAttendance(req.params.id));
  } catch (error) {
    next(error);
  }
});

router.post("/trainings/:id/complete", async (req, res, next) => {
  try {
    const input = attendanceSchema.parse(req.body);
    res.json(await completeTraining(req.params.id, input));
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    res.json(await getStats());
  } catch (error) {
    next(error);
  }
});

router.post("/ai/chat", async (req, res, next) => {
  try {
    const schema = z.object({ question: z.string().min(3) });
    const { question } = schema.parse(req.body);
    res.json(await askCoachAssistant(question));
  } catch (error) {
    next(error);
  }
});

router.get("/teams", async (req, res, next) => {
  try {
    res.json(await listTeams());
  } catch (error) {
    next(error);
  }
});

router.post("/teams", async (req, res, next) => {
  try {
    const input = teamSchema.parse(req.body);
    res.status(201).json(await createTeam(input));
  } catch (error) {
    next(error);
  }
});

router.get("/coaches", async (req, res, next) => {
  try {
    res.json(await listCoaches());
  } catch (error) {
    next(error);
  }
});

router.post("/auth/register-trainer", async (req, res, next) => {
  try {
    const input = coachSchema.parse(req.body);
    res.status(201).json(await registerCoach(input));
  } catch (error) {
    next(error);
  }
});

router.post("/reports/performance", async (req, res, next) => {
  try {
    const pdf = await buildPerformancePdf();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="relatorio-desempenho-andebol.pdf"');
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

export default router;
