import PDFDocument from "pdfkit";
import { getDashboard, getStats, listAthletes, listTrainings } from "./store.js";

export async function buildPerformancePdf() {
  const [dashboard, athletes, trainings, stats] = await Promise.all([
    getDashboard(),
    listAthletes(),
    listTrainings(),
    getStats()
  ]);

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(20).text("Relatorio de Desempenho", { align: "left" });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#4b5563").text(`${dashboard.team.name} - ${dashboard.team.category}`);
  doc.text(`Epoca ${dashboard.team.season} | Treinador: ${dashboard.team.coach}`);
  doc.moveDown();

  doc.fillColor("#111827").fontSize(14).text("Indicadores gerais");
  doc.moveDown(0.4);
  doc.fontSize(10);
  doc.text(`Atletas registados: ${dashboard.metrics.athletes}`);
  doc.text(`Lesionados: ${dashboard.metrics.injured}`);
  doc.text(`Assiduidade media: ${dashboard.metrics.attendanceAverage}%`);
  doc.text(`Golos marcados: ${dashboard.metrics.goals}`);
  doc.moveDown();

  doc.fontSize(14).text("Top marcadores");
  doc.moveDown(0.4);
  stats.goalsByAthlete.slice(0, 6).forEach((row, index) => {
    doc.fontSize(10).text(`${index + 1}. ${row.name} - ${row.value} golos`);
  });
  doc.moveDown();

  doc.fontSize(14).text("Assiduidade por atleta");
  doc.moveDown(0.4);
  stats.attendanceByAthlete.slice(0, 8).forEach((row, index) => {
    doc.fontSize(10).text(`${index + 1}. ${row.name} - ${row.value}%`);
  });
  doc.moveDown();

  doc.fontSize(14).text("Alertas tecnicos");
  doc.moveDown(0.4);
  stats.riskList.forEach((risk) => {
    doc.fontSize(10).text(`- ${risk.name}: ${risk.reason}`);
  });
  doc.moveDown();

  doc.fontSize(14).text("Treinos recentes");
  doc.moveDown(0.4);
  trainings.slice(0, 5).forEach((training) => {
    const attendance = training.present === null ? "agendado" : `${training.present}/${training.invited}`;
    doc.fontSize(10).text(`${training.date} ${training.time} - ${training.title} (${attendance})`);
  });
  doc.moveDown();

  doc.fontSize(14).text("Recomendacao");
  doc.moveDown(0.4);
  doc
    .fontSize(10)
    .text(
      "Manter trabalho de finalizacao e ataque organizado. Dar prioridade ao acompanhamento de atletas com assiduidade baixa, fadiga elevada ou lesao activa."
    );

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
