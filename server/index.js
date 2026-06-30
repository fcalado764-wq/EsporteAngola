import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import apiRouter from "./routes/api.js";
import authRouter from "./routes/auth.js";
import { initializeData } from "./config/init.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

initializeData();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/api/auth", authRouter);
app.use("/api", apiRouter);

app.use((error, req, res, next) => {
  if (error.name === "ZodError") {
    res.status(400).json({ error: "Dados invalidos", details: error.errors });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({ error: "JSON invalido" });
    return;
  }

  console.error(error);
  res.status(500).json({ error: error.message || "Erro interno do servidor" });
});

if (!process.env.VERCEL) {
  const server = app.listen(port, () => {
    console.log(`Bot de Gestao de Equipa de Andebol em http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM recebido, encerrando gracefully...");
    server.close(() => {
      console.log("Servidor encerrado");
      process.exit(0);
    });
  });
}

export default app;
