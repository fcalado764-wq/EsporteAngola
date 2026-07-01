import { Router } from "express";
import { z } from "zod";
import { askCoachAssistant } from "../services/ai.js";
import { getCurrentUser } from "../services/auth.js";
import { buildPerformancePdf } from "../services/report.js";
import {
  completeTraining,
  createAthlete,
  createMatchStat,
  createTeam,
  createTraining,
  getDashboard,
  getMatchStatsSummary,
  getStats,
  listAttendance,
  listAthletes,
  listCoaches,
  listMatchStats,
  listTeams,
  listTrainings,
  registerCoach,
  updateAthlete
} from "../services/store.js";

const router = Router();

function requireAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    const error = new Error("Token nao fornecido");
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const user = getCurrentUser(token);
  if (!user || user.role !== "admin") {
    const error = new Error("Apenas o diretor desportivo pode criar treinadores");
    error.statusCode = 403;
    throw error;
  }

  return user;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";
  return Array.from({ length: 12 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

const athleteSchema = z.object({
  name: z.string().min(2),
  number: z.coerce.number().int().min(1).max(99),
  position: z.string().min(2),
  age: z.coerce.number().int().min(10).max(60).optional()
});

const athleteUpdateSchema = athleteSchema
  .extend({
    status: z.enum(["active", "injured", "suspended", "archived"]).optional()
  })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Informe pelo menos um campo para actualizar"
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
  teamId: z.string().optional()
});

const matchStatSchema = z.object({
  athleteId: z.string().min(1),
  match: z.string().min(2),
  goals: z.coerce.number().int().min(0).default(0),
  assists: z.coerce.number().int().min(0).default(0),
  shots: z.coerce.number().int().min(0).default(0),
  shotsOnTarget: z.coerce.number().int().min(0).default(0),
  saves: z.coerce.number().int().min(0).default(0),
  turnovers: z.coerce.number().int().min(0).default(0)
});

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "handball-team-manager" });
});

router.get("/config/emailjs", (req, res) => {
  res.json({
    enabled: Boolean(process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID),
    publicKey: process.env.EMAILJS_PUBLIC_KEY || "",
    serviceId: process.env.EMAILJS_SERVICE_ID || "",
    templateId: process.env.EMAILJS_TEMPLATE_ID || "",
    loginUrl: process.env.APP_BASE_URL ? `${process.env.APP_BASE_URL.replace(/\/$/, "")}/login.html` : "/login.html"
  });
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

router.put("/athletes/:id", async (req, res, next) => {
  try {
    const input = athleteUpdateSchema.parse(req.body);
    res.json(await updateAthlete(req.params.id, input));
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

router.get("/match-stats", async (req, res, next) => {
  try {
    res.json(await listMatchStats());
  } catch (error) {
    next(error);
  }
});

router.post("/match-stats", async (req, res, next) => {
  try {
    const input = matchStatSchema.parse(req.body);
    res.status(201).json(await createMatchStat(input));
  } catch (error) {
    next(error);
  }
});

router.get("/match-stats/summary", async (req, res, next) => {
  try {
    res.json(await getMatchStatsSummary());
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
    const admin = requireAdmin(req);
    const input = coachSchema.parse(req.body);
    const temporaryPassword = generateTemporaryPassword();
    const trainer = await registerCoach({ ...input, password: temporaryPassword });
    res.status(201).json({
      ...trainer,
      temporaryPassword,
      createdBy: {
        name: admin.name,
        email: admin.email
      }
    });
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
