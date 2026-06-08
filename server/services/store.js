import {
  attendanceRecords,
  athletes,
  buildDashboard,
  buildStats,
  coaches,
  team,
  teams,
  trainings
} from "../data/mockData.js";
import { randomUUID } from "node:crypto";
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
  if (!hasSupabaseConfig()) {
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
    return { ...buildDashboard(), source: "mock", warning: error.message };
  }
}

export async function listAthletes() {
  if (!hasSupabaseConfig()) {
    return getLocalAthletesWithAttendance();
  }

  try {
    const rows = await querySupabase("athletes");
    return rows.map(mapAthlete);
  } catch {
    return athletes;
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

export async function listTrainings() {
  if (!hasSupabaseConfig()) {
    return trainings;
  }

  try {
    const rows = await querySupabase("trainings");
    return rows.map(mapTraining);
  } catch {
    return trainings;
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

  const training = trainings.find((item) => item.id === trainingId);

  if (!training) {
    throw new Error("Treino nao encontrado");
  }

  const attendance = input.attendance || [];
  const present = attendance.filter((record) => record.status === "present").length;

  if (!hasSupabaseConfig()) {
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
  const { data, error } = await supabase
    .from("trainings")
    .update({
      status: "done",
      present,
      invited: attendance.length || training.invited,
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

  if (!hasSupabaseConfig()) {
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
  } catch {
    return attendanceRecords.filter((record) => record.trainingId === trainingId);
  }
}

export async function listTeams() {
  if (!hasSupabaseConfig()) {
    return teams;
  }

  try {
    const rows = await querySupabase("teams");
    return rows.map(mapTeam);
  } catch {
    return teams;
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
  const { data, error } = await supabase.from("teams").insert(newTeam).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTeam(data);
}

export async function listCoaches() {
  return coaches;
}

export async function registerCoach(input) {
  const newCoach = {
    id: randomUUID(),
    role: "trainer",
    status: "active",
    ...input
  };

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

export async function getStats() {
  if (!hasSupabaseConfig()) {
    updateLocalAttendanceRates();
    return buildStats();
  }

  try {
    const rows = await querySupabase("athletes");
    return buildStatsFromRows(rows.map(mapAthlete));
  } catch {
    return buildStats();
  }
}
