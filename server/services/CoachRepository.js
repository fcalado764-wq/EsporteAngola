import { coaches as mockCoaches } from "../data/mockData.js";
import { getSupabase, hasSupabaseConfig } from "./supabase.js";

const TABLE = "trainer_profiles";

function mapCoach(row) {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at
  };
}

export async function findCoachByEmail(email) {
  if (!hasSupabaseConfig()) {
    return mockCoaches.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCoach(data) : null;
}

export async function findCoachById(id) {
  if (!hasSupabaseConfig()) {
    return mockCoaches.find((c) => c.id === id) || null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCoach(data) : null;
}

export async function listAllCoaches() {
  if (!hasSupabaseConfig()) {
    return mockCoaches.map((c) => ({ ...c }));
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data.map(mapCoach);
}

// Cria a conta de login no Supabase Auth (gere a senha real) e devolve o novo user id.
// So funciona com Supabase configurado - e' o que garante que o id "existe" para
// satisfazer a foreign key trainer_profiles_id_fkey.
export async function createAuthUser({ email, password }) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) throw new Error(error.message);
  return data.user.id;
}

export async function updateAuthUserPassword(id, newPassword) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.admin.updateUserById(id, { password: newPassword });
  if (error) throw new Error(error.message);
}

// Verifica email+senha atraves do Supabase Auth. Devolve o user id se as credenciais
// estiverem corretas, ou null caso contrario (nunca lanca erro por senha errada).
export async function verifyAuthCredentials(email, password) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  return data.user.id;
}

// coach: { id, teamId, name, email, role, status, mustChangePassword }
// "id" e' obrigatorio quando ha Supabase configurado (tem de ser o id devolvido
// por createAuthUser, por causa da foreign key para auth.users).
export async function insertCoach(coach) {
  if (!hasSupabaseConfig()) {
    const newCoach = {
      id: coach.id || `${coach.role}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...coach
    };
    mockCoaches.push(newCoach);
    return newCoach;
  }

  if (!coach.id) {
    throw new Error("insertCoach: id (do Supabase Auth) e obrigatorio quando Supabase esta configurado");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      id: coach.id,
      team_id: coach.teamId || null,
      name: coach.name,
      email: coach.email,
      role: coach.role,
      status: coach.status,
      must_change_password: coach.mustChangePassword
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCoach(data);
}

export async function markPasswordChanged(id) {
  if (!hasSupabaseConfig()) {
    const coach = mockCoaches.find((c) => c.id === id);
    if (coach) coach.mustChangePassword = false;
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).update({ must_change_password: false }).eq("id", id);
  if (error) throw new Error(error.message);
}

export function initializeMockPasswords(hashFn) {
  mockCoaches.forEach((coach) => {
    if (!coach.password) {
      coach.password = hashFn("password123");
    }
  });
}