const state = {
  dashboard: null,
  athletes: [],
  trainings: [],
  stats: null,
  teams: [],
  coaches: []
};

const colors = ["green", "blue", "amber", "violet", "red"];

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(error.error || "Pedido falhou");
  }

  return response.json();
}

function showToast(message) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${dateString}T12:00:00`));
}

function statusLabel(status) {
  const labels = {
    done: "Realizado",
    planned: "Agendado",
    cancelled: "Cancelado",
    active: "Activo",
    injured: "Lesionado",
    attention: "Acompanhar"
  };

  return labels[status] || status;
}

async function loadData() {
  const [dashboard, athletes, trainings, stats, teams, coaches] = await Promise.all([
    api("/dashboard"),
    api("/athletes"),
    api("/trainings"),
    api("/stats"),
    api("/teams"),
    api("/coaches")
  ]);

  state.dashboard = dashboard;
  state.athletes = athletes;
  state.trainings = trainings;
  state.stats = stats;
  state.teams = teams;
  state.coaches = coaches;

  renderAll();
}

function renderAll() {
  renderMetrics();
  renderNextTraining();
  renderAlerts();
  renderAthletes();
  renderTrainings();
  renderStats();
  renderTeams();
  renderCoaches();
}

function renderMetrics() {
  const { metrics } = state.dashboard;
  const items = [
    ["Atletas", metrics.athletes, `${metrics.injured} lesionados`],
    ["Treinos este mes", metrics.trainingsThisMonth, `${metrics.plannedTrainings} agendados`],
    ["Assiduidade media", `${metrics.attendanceAverage}%`, `+${metrics.attendanceDelta}% vs mes anterior`],
    ["Golos marcados", metrics.goals, "Epoca 2025/26"]
  ];

  qs("#metricsGrid").innerHTML = items
    .map(
      ([label, value, sub]) => `
        <article class="metric-card">
          <div>
            <div class="metric-label">${label}</div>
            <div class="metric-value">${value}</div>
          </div>
          <div class="metric-sub">${sub}</div>
        </article>
      `
    )
    .join("");
}

function renderNextTraining() {
  const training = state.dashboard.nextTraining;

  if (!training) {
    qs("#nextTraining").innerHTML = "<h3>Sem treino agendado</h3><p class='muted'>Cria um novo treino no separador Treinos.</p>";
    return;
  }

  const [day, month] = formatDate(training.date).replace(".", "").split(" ");

  qs("#nextTraining").innerHTML = `
    <p class="eyebrow">Proximo treino</p>
    <div class="next-training-body">
      <div class="training-date">
        <span><strong>${day}</strong>${month}</span>
      </div>
      <div>
        <h3>${training.title}</h3>
        <p class="muted">${training.time} | ${training.venue}</p>
        <p class="muted">${training.focus} | ${training.invited} convocados</p>
      </div>
    </div>
  `;
}

function renderAlerts() {
  qs("#alertList").innerHTML = state.dashboard.alerts
    .map(
      (alert) => `
        <div class="alert-item ${alert.severity}">
          <strong>${alert.title}</strong>
          <span>${alert.message}</span>
        </div>
      `
    )
    .join("");
}

function renderAthletes() {
  qs("#athleteGrid").innerHTML = state.athletes
    .map((athlete, index) => {
      const statusClass = athlete.status === "injured" ? "danger" : athlete.attendanceRate < 75 ? "warn" : "good";
      const extraStat = athlete.position === "Guarda-redes" ? `${athlete.savesRate || 0}% defesas` : `${athlete.goals || 0} golos`;

      return `
        <article class="athlete-card">
          <div class="athlete-top">
            <div class="avatar ${colors[index % colors.length]}">${athlete.initials}</div>
            <div>
              <h3>${athlete.name}</h3>
              <p class="muted">${athlete.position} | #${athlete.number}</p>
            </div>
          </div>
          <div class="stat-pills">
            <span class="pill ${statusClass}">${statusLabel(athlete.status)}</span>
            <span class="pill ${athlete.attendanceRate >= 85 ? "good" : "warn"}">${athlete.attendanceRate}% assiduidade</span>
            <span class="pill">${extraStat}</span>
          </div>
          <p class="muted">${athlete.injury || "Disponivel para treino e jogo."}</p>
        </article>
      `;
    })
    .join("");
}

function renderTrainings() {
  qs("#trainingTable").innerHTML = state.trainings
    .map((training) => {
      const attendance = training.present === null ? "-" : `${training.present}/${training.invited}`;
      return `
        <tr>
          <td>${formatDate(training.date)} | ${training.time}</td>
          <td><strong>${training.title}</strong><br><span class="muted">${training.venue}</span></td>
          <td>${training.focus}</td>
          <td><span class="status-badge ${training.status}">${statusLabel(training.status)}</span></td>
          <td>${attendance}</td>
          <td>
            <button class="secondary-button table-action" data-attendance-training="${training.id}" type="button">
              ${training.status === "done" ? "Editar chamada" : "Marcar chamada"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderTeams() {
  qs("#teamList").innerHTML = state.teams
    .map(
      (team) => `
        <div class="list-card">
          <strong>${escapeHtml(team.name)} - ${escapeHtml(team.category)}</strong>
          <span>${escapeHtml(team.season)} | Treinador: ${escapeHtml(team.coach)}</span>
          <span>${escapeHtml(team.venue)}</span>
        </div>
      `
    )
    .join("");

  qs("#trainerTeamSelect").innerHTML = state.teams
    .map((team) => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)} - ${escapeHtml(team.category)}</option>`)
    .join("");
}

function renderCoaches() {
  qs("#coachList").innerHTML = state.coaches
    .map((coach) => {
      const team = state.teams.find((item) => item.id === coach.teamId);
      return `
        <div class="list-card">
          <strong>${escapeHtml(coach.name)}</strong>
          <span>${escapeHtml(coach.email)} | ${coach.role === "admin" ? "Admin" : "Treinador"}</span>
          <span>${team ? `${escapeHtml(team.name)} - ${escapeHtml(team.category)}` : "Todas as equipas"}</span>
        </div>
      `;
    })
    .join("");
}

function renderBarChart(selector, rows, color = "green", suffix = "") {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  qs(selector).innerHTML = rows
    .slice(0, 6)
    .map((row) => {
      const width = Math.max(6, Math.round((row.value / maxValue) * 100));
      return `
        <div class="bar-row">
          <div class="bar-label">
            <span>${row.name}</span>
            <span>${row.value}${suffix}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%; background: var(--${color});"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderStats() {
  renderBarChart("#goalsChart", state.stats.goalsByAthlete, "green");
  renderBarChart("#attendanceChart", state.stats.attendanceByAthlete, "blue", "%");
  renderBarChart("#assistsChart", state.stats.assistsByAthlete, "violet");

  qs("#riskList").innerHTML =
    state.stats.riskList
      .map(
        (risk) => `
          <div class="risk-item ${risk.severity}">
            <strong>${risk.name}</strong>
            <span>${risk.reason}</span>
          </div>
        `
      )
      .join("") || "<p class='muted'>Sem riscos relevantes neste momento.</p>";
}

function switchTab(tabId) {
  qsa(".nav-tabs button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
  qsa(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function submitAthlete(event) {
  event.preventDefault();
  await api("/athletes", {
    method: "POST",
    body: JSON.stringify(formToObject(event.currentTarget))
  });
  event.currentTarget.reset();
  event.currentTarget.classList.add("hidden");
  await loadData();
  showToast("Atleta registado com sucesso.");
}

async function submitTraining(event) {
  event.preventDefault();
  await api("/trainings", {
    method: "POST",
    body: JSON.stringify(formToObject(event.currentTarget))
  });
  event.currentTarget.reset();
  event.currentTarget.classList.add("hidden");
  await loadData();
  showToast("Treino agendado com sucesso.");
}

async function openAttendancePanel(trainingId) {
  const training = state.trainings.find((item) => item.id === trainingId);
  const records = await api(`/trainings/${trainingId}/attendance`);
  const recordByAthlete = new Map(records.map((record) => [record.athleteId, record]));
  const panel = qs("#attendancePanel");

  qs("#attendanceTitle").textContent = `${training.title} - ${formatDate(training.date)}`;
  qs("#attendanceForm").elements.trainingId.value = trainingId;
  qs("#attendanceForm").elements.notes.value = training.notes || "";
  qs("#attendanceList").innerHTML = state.athletes
    .map((athlete) => {
      const record = recordByAthlete.get(athlete.id);
      const status = record?.status || (athlete.status === "injured" ? "injured" : "present");
      return `
        <div class="attendance-row" data-athlete-id="${escapeHtml(athlete.id)}">
          <div>
            <strong>${escapeHtml(athlete.name)}</strong>
            <span>${escapeHtml(athlete.position)} | #${athlete.number}</span>
          </div>
          <select name="status-${escapeHtml(athlete.id)}">
            <option value="present" ${status === "present" ? "selected" : ""}>Presente</option>
            <option value="absent" ${status === "absent" ? "selected" : ""}>Falta</option>
            <option value="injured" ${status === "injured" ? "selected" : ""}>Lesao</option>
            <option value="excused" ${status === "excused" ? "selected" : ""}>Justificada</option>
          </select>
          <input name="notes-${escapeHtml(athlete.id)}" placeholder="Nota opcional" value="${escapeHtml(record?.notes || "")}" />
        </div>
      `;
    })
    .join("");

  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function submitAttendance(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const trainingId = form.elements.trainingId.value;
  const attendance = state.athletes.map((athlete) => ({
    athleteId: athlete.id,
    status: form.elements[`status-${athlete.id}`].value,
    notes: form.elements[`notes-${athlete.id}`].value
  }));

  await api(`/trainings/${trainingId}/complete`, {
    method: "POST",
    body: JSON.stringify({ notes: form.elements.notes.value, attendance })
  });

  qs("#attendancePanel").classList.add("hidden");
  await loadData();
  showToast("Treino validado e chamada guardada.");
}

async function submitTrainerAccount(event) {
  event.preventDefault();
  await api("/auth/register-trainer", {
    method: "POST",
    body: JSON.stringify(formToObject(event.currentTarget))
  });
  event.currentTarget.reset();
  await loadData();
  showToast("Conta de treinador criada em modo demo.");
}

async function submitTeam(event) {
  event.preventDefault();
  await api("/teams", {
    method: "POST",
    body: JSON.stringify(formToObject(event.currentTarget))
  });
  event.currentTarget.reset();
  await loadData();
  showToast("Equipa adicionada pelo administrador.");
}

function addMessage(role, text, provider) {
  const node = document.createElement("div");
  node.className = `message ${role === "user" ? "user" : ""}`;
  node.innerHTML = `<small>${escapeHtml(role === "user" ? "Treinador" : provider || "Assistente")}</small>${escapeHtml(text)}`;
  qs("#chatLog").appendChild(node);
  node.scrollIntoView({ block: "end" });
}

async function askAssistant(question) {
  addMessage("user", question);
  addMessage("assistant", "A analisar dados da equipa...", "IA");

  try {
    const result = await api("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ question })
    });
    qs("#chatLog").lastElementChild.remove();
    addMessage("assistant", result.answer, result.provider === "groq" ? "Groq" : "Demo local");
  } catch (error) {
    qs("#chatLog").lastElementChild.remove();
    addMessage("assistant", `Nao consegui consultar a IA: ${error.message}`, "Sistema");
  }
}

async function downloadReport() {
  const response = await fetch("/api/reports/performance", { method: "POST" });

  if (!response.ok) {
    showToast("Nao foi possivel gerar o PDF.");
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio-desempenho-andebol.pdf";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Relatorio PDF gerado.");
}

function bindEvents() {
  qs("#navTabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (button) {
      switchTab(button.dataset.tab);
    }
  });

  qsa("[data-open-form]").forEach((button) => {
    button.addEventListener("click", () => qs(`#${button.dataset.openForm}`).classList.toggle("hidden"));
  });

  qs("#athleteForm").addEventListener("submit", submitAthlete);
  qs("#trainingForm").addEventListener("submit", submitTraining);
  qs("#attendanceForm").addEventListener("submit", submitAttendance);
  qs("#trainerAccountForm").addEventListener("submit", submitTrainerAccount);
  qs("#teamForm").addEventListener("submit", submitTeam);
  qs("#closeAttendanceButton").addEventListener("click", () => qs("#attendancePanel").classList.add("hidden"));
  qs("#refreshButton").addEventListener("click", () => loadData().then(() => showToast("Dados atualizados.")));
  qs("#downloadReportButton").addEventListener("click", downloadReport);
  qs("#quickReportButton").addEventListener("click", downloadReport);

  qsa("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => askAssistant(button.dataset.prompt));
  });

  qs("#trainingTable").addEventListener("click", (event) => {
    const button = event.target.closest("[data-attendance-training]");
    if (button) {
      openAttendancePanel(button.dataset.attendanceTraining);
    }
  });

  qs("#chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.question;
    const question = input.value.trim();
    if (question) {
      input.value = "";
      askAssistant(question);
    }
  });
}

bindEvents();
loadData()
  .then(() => {
    addMessage(
      "assistant",
      "Pronto. Posso analisar desempenho, sugerir treinos, gerar resumo tecnico e explicar alertas da equipa.",
      "Assistente"
    );
  })
  .catch((error) => {
    showToast(`Erro a carregar dados: ${error.message}`);
  });
