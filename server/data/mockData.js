export const team = {
  id: "sporting-luanda-sub20",
  name: "Sporting Luanda",
  category: "Sub-20",
  season: "2025/26",
  coach: "Mario Figueiredo",
  venue: "Pavilhao Cazenga"
};

export const teams = [
  team,
  {
    id: "academia-cazenga-sub17",
    name: "Academia Cazenga",
    category: "Sub-17",
    season: "2025/26",
    coach: "Helder Mateus",
    venue: "Campo Multiusos do Cazenga"
  }
];

export const coaches = [
  {
    id: "coach-mario",
    name: "Mario Figueiredo",
    email: "mario@sportingluanda.ao",
    role: "trainer",
    teamId: "sporting-luanda-sub20",
    status: "active"
  },
  {
    id: "admin-1",
    name: "Diretor Desportivo",
    email: "direcao@sportingluanda.ao",
    role: "admin",
    teamId: null,
    status: "active"
  }
];

export const athletes = [
  {
    id: "ak-7",
    name: "Andre Kinzungu",
    initials: "AK",
    number: 7,
    position: "Pivot",
    age: 19,
    goals: 23,
    assists: 15,
    attendanceRate: 94,
    status: "active",
    injury: null,
    fatigue: "normal"
  },
  {
    id: "jm-11",
    name: "Joao Mbuinga",
    initials: "JM",
    number: 11,
    position: "Ponta esquerdo",
    age: 18,
    goals: 19,
    assists: 12,
    attendanceRate: 91,
    status: "active",
    injury: null,
    fatigue: "normal"
  },
  {
    id: "dl-5",
    name: "Domingos Lopes",
    initials: "DL",
    number: 5,
    position: "Central",
    age: 19,
    goals: 11,
    assists: 21,
    attendanceRate: 68,
    status: "attention",
    injury: null,
    fatigue: "high"
  },
  {
    id: "fn-1",
    name: "Filipe Nzamba",
    initials: "FN",
    number: 1,
    position: "Guarda-redes",
    age: 20,
    goals: 0,
    assists: 2,
    savesRate: 87,
    attendanceRate: 100,
    status: "active",
    injury: null,
    fatigue: "normal"
  },
  {
    id: "cn-9",
    name: "Carlos Neto",
    initials: "CN",
    number: 9,
    position: "Extremo direito",
    age: 18,
    goals: 8,
    assists: 6,
    attendanceRate: 76,
    status: "injured",
    injury: "Joelho direito - 3 semanas",
    fatigue: "recovery"
  },
  {
    id: "rc-14",
    name: "Rui Cassule",
    initials: "RC",
    number: 14,
    position: "Lateral esquerdo",
    age: 20,
    goals: 18,
    assists: 10,
    attendanceRate: 88,
    status: "active",
    injury: null,
    fatigue: "normal"
  }
];

export const trainings = [
  {
    id: "tr-2026-06-02",
    teamId: "sporting-luanda-sub20",
    date: "2026-06-02",
    time: "17:00",
    title: "Forca e resistencia",
    focus: "Fisico",
    venue: "Pavilhao Cazenga",
    status: "done",
    invited: 16,
    present: 5,
    completedAt: "2026-06-02T18:40:00Z",
    notes: "Boa resposta fisica, com controlo de carga para laterais."
  },
  {
    id: "tr-2026-06-04",
    teamId: "sporting-luanda-sub20",
    date: "2026-06-04",
    time: "17:00",
    title: "Tactica defensiva",
    focus: "Defesa 6:0 e transicao",
    venue: "Pavilhao Cazenga",
    status: "done",
    invited: 16,
    present: 5,
    completedAt: "2026-06-04T18:35:00Z",
    notes: "Defesa mais compacta, mas ainda ha perdas no contra-ataque."
  },
  {
    id: "tr-2026-06-06",
    teamId: "sporting-luanda-sub20",
    date: "2026-06-06",
    time: "17:00",
    title: "Jogo reduzido",
    focus: "Tomada de decisao",
    venue: "Pavilhao Cazenga",
    status: "cancelled",
    invited: 16,
    present: 0,
    completedAt: null,
    notes: "Cancelado por chuva."
  },
  {
    id: "tr-2026-06-08",
    teamId: "sporting-luanda-sub20",
    date: "2026-06-08",
    time: "17:00",
    title: "Finalizacao",
    focus: "Remate em apoio e suspensao",
    venue: "Pavilhao Cazenga",
    status: "done",
    invited: 16,
    present: 4,
    completedAt: "2026-06-08T18:45:00Z",
    notes: "Finalizacao melhorou no pivot, mas extremos precisam mais volume."
  },
  {
    id: "tr-2026-06-10",
    teamId: "sporting-luanda-sub20",
    date: "2026-06-10",
    time: "17:00",
    title: "Treino tactico + finalizacao",
    focus: "Ataque organizado",
    venue: "Pavilhao Cazenga",
    status: "planned",
    invited: 14,
    present: null,
    completedAt: null,
    notes: ""
  }
];

export const attendanceRecords = [
  { trainingId: "tr-2026-06-02", athleteId: "ak-7", status: "present", notes: "Boa intensidade." },
  { trainingId: "tr-2026-06-02", athleteId: "jm-11", status: "present", notes: "" },
  { trainingId: "tr-2026-06-02", athleteId: "dl-5", status: "absent", notes: "Falta sem aviso." },
  { trainingId: "tr-2026-06-02", athleteId: "fn-1", status: "present", notes: "" },
  { trainingId: "tr-2026-06-02", athleteId: "cn-9", status: "injured", notes: "Recuperacao do joelho." },
  { trainingId: "tr-2026-06-02", athleteId: "rc-14", status: "present", notes: "" },
  { trainingId: "tr-2026-06-04", athleteId: "ak-7", status: "present", notes: "" },
  { trainingId: "tr-2026-06-04", athleteId: "jm-11", status: "present", notes: "" },
  { trainingId: "tr-2026-06-04", athleteId: "dl-5", status: "present", notes: "Cansaco no fim." },
  { trainingId: "tr-2026-06-04", athleteId: "fn-1", status: "present", notes: "" },
  { trainingId: "tr-2026-06-04", athleteId: "cn-9", status: "injured", notes: "" },
  { trainingId: "tr-2026-06-04", athleteId: "rc-14", status: "present", notes: "" },
  { trainingId: "tr-2026-06-08", athleteId: "ak-7", status: "present", notes: "Eficaz no pivot." },
  { trainingId: "tr-2026-06-08", athleteId: "jm-11", status: "present", notes: "Boa aceleracao." },
  { trainingId: "tr-2026-06-08", athleteId: "dl-5", status: "absent", notes: "Chegou tarde e nao treinou." },
  { trainingId: "tr-2026-06-08", athleteId: "fn-1", status: "present", notes: "" },
  { trainingId: "tr-2026-06-08", athleteId: "cn-9", status: "injured", notes: "Fisioterapia." },
  { trainingId: "tr-2026-06-08", athleteId: "rc-14", status: "present", notes: "" }
];

export const matchStats = [
  {
    athleteId: "ak-7",
    match: "Sporting Luanda x Progresso",
    goals: 8,
    assists: 4,
    shots: 12,
    shotsOnTarget: 10,
    saves: 0,
    turnovers: 2
  },
  {
    athleteId: "jm-11",
    match: "Sporting Luanda x Petro B",
    goals: 6,
    assists: 3,
    shots: 10,
    shotsOnTarget: 8,
    saves: 0,
    turnovers: 1
  },
  {
    athleteId: "dl-5",
    match: "Sporting Luanda x Primeiro de Agosto B",
    goals: 2,
    assists: 7,
    shots: 7,
    shotsOnTarget: 4,
    saves: 0,
    turnovers: 5
  },
  {
    athleteId: "fn-1",
    match: "Sporting Luanda x Petro B",
    goals: 0,
    assists: 1,
    shots: 0,
    shotsOnTarget: 0,
    saves: 14,
    turnovers: 1
  },
  {
    athleteId: "rc-14",
    match: "Sporting Luanda x Interclube B",
    goals: 7,
    assists: 2,
    shots: 11,
    shotsOnTarget: 8,
    saves: 0,
    turnovers: 3
  }
];

export function buildDashboard() {
  const activeAthletes = athletes.filter((athlete) => athlete.status !== "archived");
  const injured = activeAthletes.filter((athlete) => athlete.status === "injured");
  const doneTrainings = trainings.filter((training) => training.status === "done");
  const plannedTrainings = trainings.filter((training) => training.status === "planned");
  const goals = activeAthletes.reduce((total, athlete) => total + (athlete.goals || 0), 0);
  const attendanceAverage = Math.round(
    activeAthletes.reduce((total, athlete) => total + athlete.attendanceRate, 0) / activeAthletes.length
  );

  return {
    team,
    metrics: {
      athletes: activeAthletes.length,
      injured: injured.length,
      trainingsThisMonth: trainings.length,
      completedTrainings: doneTrainings.length,
      plannedTrainings: plannedTrainings.length,
      attendanceAverage,
      attendanceDelta: 3,
      goals
    },
    nextTraining: trainings.find((training) => training.status === "planned"),
    alerts: [
      {
        type: "attendance",
        title: "Assiduidade baixa",
        message: "Domingos Lopes esta abaixo de 70% de presencas.",
        severity: "warning"
      },
      {
        type: "injury",
        title: "Atleta lesionado",
        message: "Carlos Neto esta em recuperacao do joelho direito.",
        severity: "danger"
      },
      {
        type: "load",
        title: "Carga fisica",
        message: `${doneTrainings.length} treinos realizados em Junho; controlar fadiga dos centrais.`,
        severity: "info"
      }
    ]
  };
}

export function buildStats() {
  return {
    goalsByAthlete: athletes
      .filter((athlete) => athlete.position !== "Guarda-redes")
      .map((athlete) => ({ name: athlete.name, value: athlete.goals }))
      .sort((a, b) => b.value - a.value),
    attendanceByAthlete: athletes
      .map((athlete) => ({ name: athlete.name, value: athlete.attendanceRate }))
      .sort((a, b) => b.value - a.value),
    assistsByAthlete: athletes
      .map((athlete) => ({ name: athlete.name, value: athlete.assists || 0 }))
      .sort((a, b) => b.value - a.value),
    riskList: athletes
      .filter((athlete) => athlete.status === "injured" || athlete.attendanceRate < 75 || athlete.fatigue === "high")
      .map((athlete) => ({
        name: athlete.name,
        reason: athlete.injury || (athlete.attendanceRate < 75 ? "Assiduidade baixa" : "Fadiga elevada"),
        severity: athlete.status === "injured" ? "danger" : "warning"
      }))
  };
}
