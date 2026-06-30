import Groq from "groq-sdk";
import {
  getDashboard,
  getMatchStatsSummary,
  getStats,
  listAthletes,
  listAttendance,
  listCoaches,
  listMatchStats,
  listTeams,
  listTrainings
} from "./store.js";

let groqClient;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findMentionedAthlete(question, athletes) {
  const normalizedQuestion = normalize(question);
  return athletes.find((athlete) =>
    normalize(athlete.name)
      .split(" ")
      .some((part) => part.length > 3 && normalizedQuestion.includes(part))
  );
}

function summarizeAttendanceForAthlete(athlete, attendance, trainings) {
  const records = attendance.filter((record) => record.athleteId === athlete.id);
  const present = records.filter((record) => record.status === "present").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const injured = records.filter((record) => record.status === "injured").length;
  const lastRecord = records.at(-1);
  const lastTraining = trainings.find((training) => training.id === lastRecord?.trainingId);

  return {
    present,
    absent,
    injured,
    last: lastRecord && lastTraining ? `${lastTraining.title} (${lastRecord.status})` : "sem chamada recente"
  };
}

function buildLocalAnswer(question, context) {
  const lowerQuestion = normalize(question);
  const { athletes, trainings, stats, teams, coaches, attendance, matchStatsSummary } = context;
  const mentionedAthlete = findMentionedAthlete(question, athletes);
  const completedTrainings = trainings.filter((training) => training.status === "done");
  const plannedTrainings = trainings.filter((training) => training.status === "planned");
  const worstAttendance = [...stats.attendanceByAthlete].sort((a, b) => a.value - b.value).slice(0, 3);
  const topScorer = stats.goalsByAthlete[0];
  const topGamePerformer = matchStatsSummary[0];
  const goalkeeperStats = matchStatsSummary.filter((row) => row.saves > 0).sort((a, b) => b.saves - a.saves);
  const riskNames = stats.riskList.map((risk) => `${risk.name} (${risk.reason})`);
  const activeCoaches = coaches.filter((coach) => coach.status === "active").map((coach) => coach.name);
  const asksCount =
    lowerQuestion.includes("quantos") ||
    lowerQuestion.includes("quantas") ||
    lowerQuestion.includes("total") ||
    lowerQuestion.includes("numero") ||
    lowerQuestion.includes("número");

  if (asksCount && (lowerQuestion.includes("atleta") || lowerQuestion.includes("jogador"))) {
    return `A equipa tem ${athletes.length} atletas registados.
Estado do grupo: ${athletes.filter((athlete) => athlete.status === "active").length} activos, ${athletes.filter((athlete) => athlete.status === "injured").length} lesionado(s) e ${athletes.filter((athlete) => athlete.status === "suspended").length} suspenso(s).
Assiduidade media actual: ${context.dashboard.metrics.attendanceAverage}%.`;
  }

  if (asksCount && lowerQuestion.includes("treino")) {
    return `Existem ${trainings.length} treinos registados: ${completedTrainings.length} realizados/validados e ${plannedTrainings.length} agendado(s).
Para melhorar os relatórios da IA, valida cada treino realizado e marca a presença dos atletas no fim da sessão.`;
  }

  if (asksCount && lowerQuestion.includes("equipa")) {
    return `Existem ${teams.length} equipas registadas: ${teams.map((item) => `${item.name} ${item.category}`).join(", ") || "sem equipas registadas"}.
Treinadores activos: ${activeCoaches.join(", ") || "ainda sem treinadores activos associados"}.`;
  }

  if (mentionedAthlete) {
    const athleteAttendance = summarizeAttendanceForAthlete(mentionedAthlete, attendance, trainings);
    const outputStat =
      mentionedAthlete.position === "Guarda-redes"
        ? `${mentionedAthlete.savesRate || 0}% de defesas`
        : `${mentionedAthlete.goals || 0} golos e ${mentionedAthlete.assists || 0} assistencias`;
    const gameStat = matchStatsSummary.find((row) => row.athleteId === mentionedAthlete.id);

    return `${mentionedAthlete.name}: joga como ${mentionedAthlete.position}, numero ${mentionedAthlete.number}, com ${mentionedAthlete.attendanceRate}% de assiduidade e ${outputStat}.
Na chamada dos treinos, tem ${athleteAttendance.present} presencas, ${athleteAttendance.absent} faltas e ${athleteAttendance.injured} registos por lesao. Ultimo registo: ${athleteAttendance.last}.
Estatisticas de jogo: ${
      gameStat
        ? `${gameStat.goals} golos, ${gameStat.assists} assistencias, ${gameStat.shotsOnTarget}/${gameStat.shots} remates a baliza/remates, ${gameStat.saves} defesas e ${gameStat.turnovers} perdas de bola. Eficacia de remate: ${gameStat.goalConversion}%.`
        : "ainda sem registos de jogo detalhados."
    }
Recomendacao: ${
      mentionedAthlete.status === "injured"
        ? "manter acompanhamento medico e reintegrar com carga controlada."
        : mentionedAthlete.attendanceRate < 75
          ? "fazer conversa individual e definir meta minima de presencas para as proximas duas semanas."
          : "manter plano actual e aumentar exigencia tecnica nos exercicios especificos da posicao."
    }`;
  }

  if (lowerQuestion.includes("assiduidade") || lowerQuestion.includes("presenca") || lowerQuestion.includes("falt")) {
    return `Assiduidade actual da equipa: ${context.dashboard.metrics.attendanceAverage}%.
Atletas que mais precisam de acompanhamento: ${worstAttendance.map((row) => `${row.name} (${row.value}%)`).join(", ")}.
Treinos validados: ${completedTrainings.length}. Para melhorar a fiabilidade da estatistica, o treinador deve validar cada treino e marcar presenca, falta, lesao ou falta justificada logo no fim da sessao.`;
  }

  if (lowerQuestion.includes("treino") || lowerQuestion.includes("exercicio") || lowerQuestion.includes("microciclo")) {
    const nextTraining = plannedTrainings[0];
    return `Plano sugerido para o proximo treino${nextTraining ? ` (${nextTraining.title})` : ""}: 12 min aquecimento com bola, 18 min tecnica por posicao, 25 min ataque organizado contra defesa 6:0, 20 min transicao defensiva apos perda e 12 min finalizacao sob fadiga.
Base da recomendacao: ${topScorer?.name || "a equipa"} lidera a producao ofensiva, mas a lista de risco indica ${riskNames.join(", ") || "sem alertas graves"}. Controla carga de atletas lesionados ou com assiduidade baixa.`;
  }

  if (
    lowerQuestion.includes("jogo") ||
    lowerQuestion.includes("golo") ||
    lowerQuestion.includes("remate") ||
    lowerQuestion.includes("baliza") ||
    lowerQuestion.includes("defesa") ||
    lowerQuestion.includes("perda")
  ) {
    return `Analise de jogo: ${
      topGamePerformer
        ? `${topGamePerformer.name} lidera com ${topGamePerformer.goals} golos, ${topGamePerformer.assists} assistencias e ${topGamePerformer.goalConversion}% de conversao.`
        : "ainda ha poucos dados de jogo registados."
    }
Remates e eficacia: ${matchStatsSummary
      .slice(0, 4)
      .map((row) => `${row.name}: ${row.shotsOnTarget}/${row.shots} no alvo, ${row.goalConversion}% conversao, ${row.turnovers} perdas`)
      .join("; ") || "sem estatisticas detalhadas"}.
Guarda-redes: ${goalkeeperStats.length ? goalkeeperStats.map((row) => `${row.name} com ${row.saves} defesas`).join("; ") : "sem defesas registadas"}.
Recomendacao: trabalhar selecao de remate, reduzir perdas em ataque organizado e cruzar minutos de treino com desempenho em jogo.`;
  }

  if (lowerQuestion.includes("relatorio") || lowerQuestion.includes("resumo") || lowerQuestion.includes("semana")) {
    return `Resumo tecnico: ${context.dashboard.team.name} ${context.dashboard.team.category} tem ${athletes.length} atletas, ${completedTrainings.length} treinos realizados, ${plannedTrainings.length} treino(s) agendado(s), ${context.dashboard.metrics.goals} golos e ${context.dashboard.metrics.attendanceAverage}% de assiduidade media.
Prioridades: ${riskNames.join(", ") || "manter consistencia do grupo"}. O relatorio PDF deve destacar top marcadores, atletas em risco e presencas por treino.`;
  }

  if (lowerQuestion.includes("equipa") || lowerQuestion.includes("escalao") || lowerQuestion.includes("admin") || lowerQuestion.includes("diretor")) {
    return `Painel do diretor desportivo: existem ${teams.length} equipas registadas (${teams.map((item) => `${item.name} ${item.category}`).join(", ")}).
Treinadores activos: ${activeCoaches.join(", ") || "ainda sem treinadores activos associados"}.
Boa pratica: cada equipa deve ter escalao, epoca, treinador responsavel e local principal de treino para que a IA consiga separar estatisticas por grupo.`;
  }

  return `Analise rapida a partir dos dados actuais: ${context.dashboard.team.name} ${context.dashboard.team.category} tem ${athletes.length} atletas, ${context.dashboard.metrics.attendanceAverage}% de assiduidade media, ${context.dashboard.metrics.goals} golos registados e ${completedTrainings.length} treinos validados.
Melhor marcador: ${topScorer ? `${topScorer.name} com ${topScorer.value} golos` : "sem dados"}.
Melhor rendimento em jogo: ${topGamePerformer ? `${topGamePerformer.name}, ${topGamePerformer.goals} golos, ${topGamePerformer.assists} assistencias e ${topGamePerformer.goalConversion}% de conversao` : "sem dados detalhados"}.
Riscos activos: ${riskNames.join(", ") || "sem riscos graves"}.
Pergunta recebida: "${question}". Posso detalhar por atleta, treino, presenca, equipa, jogo, remates, defesas, relatorio ou plano de treino.`;
}

export async function askCoachAssistant(question) {
  if (!question || typeof question !== "string" || question.trim().length < 3) {
    throw new Error("Pergunta deve ter pelo menos 3 caracteres");
  }

  const [dashboard, athletes, trainings, stats, teams, coaches, matchStats, matchStatsSummary] = await Promise.all([
    getDashboard(),
    listAthletes(),
    listTrainings(),
    getStats(),
    listTeams(),
    listCoaches(),
    listMatchStats(),
    getMatchStatsSummary()
  ]);
  const attendanceGroups = await Promise.all(trainings.map((training) => listAttendance(training.id)));
  const attendance = attendanceGroups.flat();
  const context = { dashboard, athletes, trainings, stats, teams, coaches, attendance, matchStats, matchStatsSummary };
  const client = getGroqClient();

  if (!client) {
    return {
      provider: "local-demo",
      answer: buildLocalAnswer(question, context)
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama3-70b-8192",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "Es um assistente tecnico e analista de desempenho para andebol. Responde em portugues de Angola, com analise pratica, curta e baseada nos dados fornecidos. Usa presencas, treinos, estatisticas de jogo, golos, remates, remates a baliza, defesas, assistencias e perdas de bola. Nao inventes dados."
        },
        {
          role: "user",
          content: `Pergunta do treinador: ${question}\n\nDados da equipa:\n${JSON.stringify(context, null, 2)}`
        }
      ]
    });

    return {
      provider: "groq",
      answer: completion.choices[0]?.message?.content?.trim() || "Nao foi possivel gerar uma resposta."
    };
  } catch (error) {
    console.error("Erro ao chamar Groq API:", error);
    return {
      provider: "local-fallback",
      answer: buildLocalAnswer(question, context)
    };
  }
}
