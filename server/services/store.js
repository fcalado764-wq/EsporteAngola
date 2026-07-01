import {
  attendanceRecords,
  athletes,
  buildDashboard,
  buildStats,
  coaches,
  matchStats,
  team,
  teams,
  trainings
} from "../data/mockData.js";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./auth.js";
import { getSupabase, hasSupabaseConfig } from "./supabase.js";

function mapAthlete(row) {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    number: row.number,
    position: row.position,
    age: row.age,
    goals: row.goals,
    assists: row.assists,
    savesRate: row.saves_rate,
    attendanceRate: row.attendance_rate,
    status: row.status,
    injury: row.injury,
    fatigue: row.fatigue
  };
}

function mapTraining(row) {
  return {
    id: row.id,
    teamId: row.team_id,
    date: row.training_date,
    time: row.training_time?.slice(0, 5),
    title: row.title,
    focus: row.focus,
    venue: row.venue,
    status: row.status,
    invited: row.invited,
    present: row.present,
    completedAt: row.completed_at,
    notes: row.notes
  };
}

function mapTeam(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    season: row.season,
    coach: row.coach,
    venue: row.venue
  };
}

function mapMatchStat(row, athleteById = new Map()) {
  const athleteId = row.athlete_id || row.athleteId;
  const athlete = athleteById.get(athleteId);

  return {
    id: row.id,
    athleteId,
    athleteName: athlete?.name || row.athleteName || "Atleta",
    match: row.match_name || row.match,
    goals: row.goals || 0,
    assists: row.assists || 0,
    shots: row.shots || 0,
    shotsOnTarget: row.shots_on_target || row.shotsOnTarget || 0,
    saves: row.saves || 0,
    turnovers: row.turnovers || 0
  };
}

function teamIdentity(teamItem) {
  return [teamItem.name, teamItem.category, teamItem.season]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");
}

function uniqueTeams(rows) {
  const seen = new Set();

  return rows.filter((row) => {
    const key = teamIdentity(row);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function shouldUseMockFallback() {
  return !hasSupabaseConfig();
}

function getLocalAthletesWithAttendance() {
  const completedTrainingIds = new Set(trainings.filter((training) => training.status === "done").map((training) => training.id));

  return athletes.map((athlete) => {
    const records = attendanceRecords.filter(
      (record) => record.athleteId === athlete.id && completedTrainingIds.has(record.trainingId)
    );
    const counted = records.filter((record) => record.status !== "excused");
    const present = counted.filter((record) => record.status === "present").length;
    const attendanceRate = counted.length ? Math.round((present / counted.length) * 100) : athlete.attendanceRate;

    return { ...athlete, attendanceRate };
  });
}

function updateLocalAttendanceRates() {
  getLocalAthletesWithAttendance().forEach((computedAthlete) => {
    const athlete = athletes.find((item) => item.id === computedAthlete.id);
    if (athlete) {
      athlete.attendanceRate = computedAthlete.attendanceRate;
    }
  });
}

async function querySupabase(table, select = "*") {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(table).select(select);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getDashboard() {
  if (shouldUseMockFallback()) {
    updateLocalAttendanceRates();
    return buildDashboard();
  }

  try {
    const [teamRows, athleteRows, trainingRows] = await Promise.all([
      querySupabase("teams"),
      querySupabase("athletes"),
      querySupabase("trainings")
    ]);

    const loadedAthletes = athleteRows.map(mapAthlete);
    const loadedTrainings = trainingRows.map(mapTraining);
    const activeAthletes = loadedAthletes.filter((athlete) => athlete.status !== "archived");
    const attendanceAverage = activeAthletes.length
      ? Math.round(activeAthletes.reduce((total, athlete) => total + athlete.attendanceRate, 0) / activeAthletes.length)
      : 0;

    return {
      team: teamRows[0] || team,
      metrics: {
        athletes: activeAthletes.length,
        injured: activeAthletes.filter((athlete) => athlete.status === "injured").length,
        trainingsThisMonth: loadedTrainings.length,
        plannedTrainings: loadedTrainings.filter((training) => training.status === "planned").length,
        attendanceAverage,
        attendanceDelta: 0,
        goals: activeAthletes.reduce((total, athlete) => total + (athlete.goals || 0), 0)
      },
      nextTraining: loadedTrainings.find((training) => training.status === "planned"),
      alerts: buildStatsFromRows(loadedAthletes).riskList.map((risk) => ({
        type: risk.severity,
        title: risk.reason,
        message: risk.name,
        severity: risk.severity
      }))
    };
  } catch (error) {
    throw new Error(`Erro ao carregar dashboard no Supabase: ${error.message}`);
  }
}

export async function listAthletes() {
  if (shouldUseMockFallback()) {
    return getLocalAthletesWithAttendance();
  }

  try {
    const rows = await querySupabase("athletes");
    return rows.map(mapAthlete);
  } catch (error) {
    throw new Error(`Erro ao carregar atletas no Supabase: ${error.message}`);
  }
}

export async function createAthlete(input) {
  const newAthlete = {
    id: randomUUID(),
    initials: input.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    goals: 0,
    assists: 0,
    attendanceRate: 100,
    status: "active",
    injury: null,
    fatigue: "normal",
    ...input
  };

  if (!hasSupabaseConfig()) {
    athletes.unshift(newAthlete);
    return newAthlete;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("athletes")
    .insert({
      id: newAthlete.id,
      name: newAthlete.name,
      initials: newAthlete.initials,
      number: newAthlete.number,
      position: newAthlete.position,
      age: newAthlete.age,
      goals: newAthlete.goals,
      assists: newAthlete.assists,
      attendance_rate: newAthlete.attendanceRate,
      status: newAthlete.status,
      fatigue: newAthlete.fatigue
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapAthlete(data);
}

export async function updateAthlete(id, input) {
  const initials = input.name
    ? input.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : undefined;

  if (!hasSupabaseConfig()) {
    const index = athletes.findIndex((athlete) => athlete.id === id);
    if (index === -1) {
      throw new Error("Atleta nao encontrado");
    }

    athletes[index] = {
      ...athletes[index],
      ...input,
      ...(initials ? { initials } : {})
    };
    return athletes[index];
  }

  const updatePayload = {};
  if (input.name !== undefined) updatePayload.name = input.name;
  if (initials !== undefined) updatePayload.initials = initials;
  if (input.number !== undefined) updatePayload.number = input.number;
  if (input.position !== undefined) updatePayload.position = input.position;
  if (input.age !== undefined) updatePayload.age = input.age;
  if (input.status !== undefined) updatePayload.status = input.status;

  const supabase = getSupabase();
  const { data, error } = await supabase.from("athletes").update(updatePayload).eq("id", id).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return mapAthlete(data);
}

export async function listTrainings() {
  if (shouldUseMockFallback()) {
    return trainings;
  }

  try {
    const rows = await querySupabase("trainings");
    return rows.map(mapTraining);
  } catch (error) {
    throw new Error(`Erro ao carregar treinos no Supabase: ${error.message}`);
  }
}

export async function createTraining(input) {
  const newTraining = {
    id: randomUUID(),
    teamId: team.id,
    venue: team.venue,
    status: "planned",
    invited: 0,
    present: null,
    ...input
  };

  if (!hasSupabaseConfig()) {
    trainings.unshift(newTraining);
    return newTraining;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("trainings")
    .insert({
      id: newTraining.id,
      training_date: newTraining.date,
      training_time: newTraining.time,
      title: newTraining.title,
      focus: newTraining.focus,
      venue: newTraining.venue,
      status: newTraining.status,
      invited: newTraining.invited,
      present: newTraining.present
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTraining(data);
}

export async function completeTraining(trainingId, input) {
  if (!trainingId || typeof trainingId !== "string") {
    throw new Error("ID do treino invalido");
  }

  const attendance = input.attendance || [];
  const present = attendance.filter((record) => record.status === "present").length;

  if (!hasSupabaseConfig()) {
    const training = trainings.find((item) => item.id === trainingId);

    if (!training) {
      throw new Error("Treino nao encontrado");
    }

    training.status = "done";
    training.present = present;
    training.invited = attendance.length || training.invited;
    training.completedAt = new Date().toISOString();
    training.notes = input.notes || training.notes || "";

    for (const record of attendance) {
      const existingIndex = attendanceRecords.findIndex(
        (item) => item.trainingId === trainingId && item.athleteId === record.athleteId
      );
      const nextRecord = {
        trainingId,
        athleteId: record.athleteId,
        status: record.status,
        notes: record.notes || ""
      };

      if (existingIndex >= 0) {
        attendanceRecords[existingIndex] = nextRecord;
      } else {
        attendanceRecords.push(nextRecord);
      }
    }

    updateLocalAttendanceRates();
    return training;
  }

  const supabase = getSupabase();
  const { data: existingTraining, error: trainingError } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", trainingId)
    .single();

  if (trainingError || !existingTraining) {
    throw new Error(trainingError?.message || "Treino nao encontrado");
  }

  const { data, error } = await supabase
    .from("trainings")
    .update({
      status: "done",
      present,
      invited: attendance.length || existingTraining.invited,
      completed_at: new Date().toISOString(),
      notes: input.notes || ""
    })
    .eq("id", trainingId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (attendance.length) {
    const { error: attendanceError } = await supabase.from("attendance").upsert(
      attendance.map((record) => ({
        training_id: trainingId,
        athlete_id: record.athleteId,
        status: record.status,
        notes: record.notes || ""
      })),
      { onConflict: "training_id,athlete_id" }
    );

    if (attendanceError) {
      throw new Error(attendanceError.message);
    }
  }

  return mapTraining(data);
}

export async function listAttendance(trainingId) {
  if (!trainingId || typeof trainingId !== "string") {
    throw new Error("ID do treino invalido");
  }

  if (shouldUseMockFallback()) {
    return attendanceRecords.filter((record) => record.trainingId === trainingId);
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("attendance").select("*").eq("training_id", trainingId);

    if (error) {
      throw new Error(error.message);
    }

    return data.map((record) => ({
      trainingId: record.training_id,
      athleteId: record.athlete_id,
      status: record.status,
      notes: record.notes
    }));
  } catch (error) {
    throw new Error(`Erro ao carregar presencas no Supabase: ${error.message}`);
  }
}

export async function listTeams() {
  if (shouldUseMockFallback()) {
    return teams;
  }

  try {
    const rows = await querySupabase("teams");
    return uniqueTeams(rows.map(mapTeam));
  } catch (error) {
    throw new Error(`Erro ao carregar equipas no Supabase: ${error.message}`);
  }
}

export async function createTeam(input) {
  const newTeam = {
    id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || randomUUID(),
    ...input
  };

  if (!hasSupabaseConfig()) {
    teams.unshift(newTeam);
    return newTeam;
  }

  const supabase = getSupabase();
  const { data: existingRows, error: existingError } = await supabase
    .from("teams")
    .select("*")
    .eq("name", input.name)
    .eq("category", input.category)
    .eq("season", input.season)
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingRows.length) {
    const { data, error } = await supabase
      .from("teams")
      .update({
        coach: input.coach,
        venue: input.venue
      })
      .eq("id", existingRows[0].id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapTeam(data);
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: input.name,
      category: input.category,
      season: input.season,
      coach: input.coach,
      venue: input.venue
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTeam(data);
}

export async function listCoaches() {
  if (hasSupabaseConfig()) {
    try {
      const rows = await querySupabase("trainer_profiles");
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        teamId: row.team_id,
        status: row.status
      }));
    } catch (error) {
      throw new Error(`Erro ao carregar treinadores no Supabase: ${error.message}`);
    }
  }

  return coaches.map((coach) => ({ ...coach, password: undefined }));
}

export async function registerCoach(input) {
  const newCoach = {
    id: randomUUID(),
    role: "trainer",
    status: "active",
    ...input,
    password: hashPassword(input.password)
  };

  if (hasSupabaseConfig()) {
    const supabase = getSupabase();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name,
        role: "trainer"
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const { data, error } = await supabase
      .from("trainer_profiles")
      .insert({
        id: authData.user.id,
        name: input.name,
        email: input.email,
        role: "trainer",
        team_id: input.teamId || null,
        status: "active"
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      teamId: data.team_id,
      status: data.status
    };
  }

  coaches.unshift(newCoach);
  return { ...newCoach, password: undefined };
}

function buildStatsFromRows(rows) {
  return {
    goalsByAthlete: rows
      .filter((athlete) => athlete.position !== "Guarda-redes")
      .map((athlete) => ({ name: athlete.name, value: athlete.goals || 0 }))
      .sort((a, b) => b.value - a.value),
    attendanceByAthlete: rows
      .map((athlete) => ({ name: athlete.name, value: athlete.attendanceRate }))
      .sort((a, b) => b.value - a.value),
    assistsByAthlete: rows
      .map((athlete) => ({ name: athlete.name, value: athlete.assists || 0 }))
      .sort((a, b) => b.value - a.value),
    riskList: rows
      .filter((athlete) => athlete.status === "injured" || athlete.attendanceRate < 75 || athlete.fatigue === "high")
      .map((athlete) => ({
        name: athlete.name,
        reason: athlete.injury || (athlete.attendanceRate < 75 ? "Assiduidade baixa" : "Fadiga elevada"),
        severity: athlete.status === "injured" ? "danger" : "warning"
      }))
  };
}

function summarizeMatchStats(rows) {
  const byAthlete = new Map();

  for (const row of rows) {
    const current = byAthlete.get(row.athleteId) || {
      athleteId: row.athleteId,
      name: row.athleteName,
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      saves: 0,
      turnovers: 0,
      matches: 0
    };

    current.goals += row.goals;
    current.assists += row.assists;
    current.shots += row.shots;
    current.shotsOnTarget += row.shotsOnTarget;
    current.saves += row.saves;
    current.turnovers += row.turnovers;
    current.matches += 1;
    current.shootingAccuracy = current.shots ? Math.round((current.shotsOnTarget / current.shots) * 100) : 0;
    current.goalConversion = current.shots ? Math.round((current.goals / current.shots) * 100) : 0;

    byAthlete.set(row.athleteId, current);
  }

  return [...byAthlete.values()].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}

export async function listMatchStats() {
  if (shouldUseMockFallback()) {
    const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
    return matchStats.map((row) => mapMatchStat(row, athleteById));
  }

  try {
    const [statRows, athleteRows] = await Promise.all([
      querySupabase("match_stats"),
      querySupabase("athletes")
    ]);
    const athleteById = new Map(athleteRows.map((row) => [row.id, mapAthlete(row)]));
    return statRows.map((row) => mapMatchStat(row, athleteById));
  } catch (error) {
    throw new Error(`Erro ao carregar estatisticas de jogo no Supabase: ${error.message}`);
  }
}

export async function createMatchStat(input) {
  const newMatchStat = {
    id: randomUUID(),
    goals: 0,
    assists: 0,
    shots: 0,
    shotsOnTarget: 0,
    saves: 0,
    turnovers: 0,
    ...input
  };

  if (shouldUseMockFallback()) {
    matchStats.unshift(newMatchStat);
    const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
    return mapMatchStat(newMatchStat, athleteById);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("match_stats")
    .insert({
      athlete_id: newMatchStat.athleteId,
      match_name: newMatchStat.match,
      goals: newMatchStat.goals,
      assists: newMatchStat.assists,
      shots: newMatchStat.shots,
      shots_on_target: newMatchStat.shotsOnTarget,
      saves: newMatchStat.saves,
      turnovers: newMatchStat.turnovers
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const athletesList = await listAthletes();
  const athleteById = new Map(athletesList.map((athlete) => [athlete.id, athlete]));
  return mapMatchStat(data, athleteById);
}

export async function getMatchStatsSummary() {
  return summarizeMatchStats(await listMatchStats());
}

export async function getStats() {
  if (shouldUseMockFallback()) {
    updateLocalAttendanceRates();
    return {
      ...buildStats(),
      matchStatsByAthlete: summarizeMatchStats(await listMatchStats())
    };
  }

  try {
    const rows = await querySupabase("athletes");
    return {
      ...buildStatsFromRows(rows.map(mapAthlete)),
      matchStatsByAthlete: await getMatchStatsSummary()
    };
  } catch (error) {
    throw new Error(`Erro ao carregar estatisticas no Supabase: ${error.message}`);
  }
}
