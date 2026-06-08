import { describe, it, expect, beforeEach } from 'vitest';
import {
  listAthletes,
  createAthlete,
  listTrainings,
  createTraining,
  listTeams,
  createTeam,
  listCoaches,
  registerCoach,
  getDashboard,
  getStats
} from '../server/services/store.js';

describe('Store Service', () => {
  describe('Athletes', () => {
    it('should list athletes', async () => {
      const athletes = await listAthletes();
      expect(Array.isArray(athletes)).toBe(true);
      expect(athletes.length).toBeGreaterThan(0);
    });

    it('should create athlete with valid data', async () => {
      const newAthlete = {
        name: 'Test Athlete',
        number: 42,
        position: 'Pivot',
        age: 20
      };
      const athlete = await createAthlete(newAthlete);
      expect(athlete.id).toBeDefined();
      expect(athlete.name).toBe('Test Athlete');
      expect(athlete.number).toBe(42);
      expect(athlete.position).toBe('Pivot');
      expect(athlete.goals).toBe(0);
      expect(athlete.attendanceRate).toBe(100);
      expect(athlete.status).toBe('active');
    });

    it('should calculate athlete initials correctly', async () => {
      const athlete = await createAthlete({
        name: 'João Silva',
        number: 5,
        position: 'Central'
      });
      expect(athlete.initials).toBe('JS');
    });

    it('should handle single word names for initials', async () => {
      const athlete = await createAthlete({
        name: 'Kimbongo',
        number: 15,
        position: 'Extremo'
      });
      expect(athlete.initials).toBe('K');
    });
  });

  describe('Trainings', () => {
    it('should list trainings', async () => {
      const trainings = await listTrainings();
      expect(Array.isArray(trainings)).toBe(true);
      expect(trainings.length).toBeGreaterThan(0);
    });

    it('should create training with valid data', async () => {
      const newTraining = {
        date: '2026-06-15',
        time: '17:00',
        title: 'Treino Defensivo',
        focus: 'Defesa 6:0',
        venue: 'Pavilhão Principal'
      };
      const training = await createTraining(newTraining);
      expect(training.id).toBeDefined();
      expect(training.date).toBe('2026-06-15');
      expect(training.time).toBe('17:00');
      expect(training.status).toBe('planned');
      expect(training.present).toBeNull();
    });

    it('should set default status to planned', async () => {
      const training = await createTraining({
        date: '2026-06-20',
        time: '18:00',
        title: 'Test Training',
        focus: 'General'
      });
      expect(training.status).toBe('planned');
    });
  });

  describe('Teams', () => {
    it('should list teams', async () => {
      const teams = await listTeams();
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeGreaterThan(0);
    });

    it('should create team with valid data', async () => {
      const newTeam = {
        name: 'Nova Equipa',
        category: 'Senior',
        season: '2026/27',
        coach: 'Trainer Test',
        venue: 'Arena Nova'
      };
      const team = await createTeam(newTeam);
      expect(team.id).toBeDefined();
      expect(team.name).toBe('Nova Equipa');
      expect(team.category).toBe('Senior');
    });

    it('should generate slug-like id from team name', async () => {
      const team = await createTeam({
        name: 'Sporting FC',
        category: 'Junior',
        season: '2026/27',
        coach: 'Coach',
        venue: 'Stadium'
      });
      expect(team.id).toBe('sporting-fc');
    });
  });

  describe('Coaches', () => {
    it('should list coaches', async () => {
      const coaches = await listCoaches();
      expect(Array.isArray(coaches)).toBe(true);
      expect(coaches.length).toBeGreaterThan(0);
    });

    it('should register coach with valid data', async () => {
      const newCoach = {
        name: 'New Trainer',
        email: 'trainer@example.com',
        password: 'securepass123'
      };
      const coach = await registerCoach(newCoach);
      expect(coach.id).toBeDefined();
      expect(coach.name).toBe('New Trainer');
      expect(coach.role).toBe('trainer');
      expect(coach.status).toBe('active');
      expect(coach.password).toBeUndefined();
    });

    it('should not return password in response', async () => {
      const coach = await registerCoach({
        name: 'Secret Trainer',
        email: 'secret@example.com',
        password: 'mypassword'
      });
      expect(coach.password).toBeUndefined();
    });
  });

  describe('Dashboard', () => {
    it('should get dashboard data', async () => {
      const dashboard = await getDashboard();
      expect(dashboard).toBeDefined();
      expect(dashboard.team).toBeDefined();
      expect(dashboard.metrics).toBeDefined();
      expect(dashboard.alerts).toBeDefined();
    });

    it('should include team metrics', async () => {
      const dashboard = await getDashboard();
      const metrics = dashboard.metrics;
      expect(metrics.athletes).toBeGreaterThan(0);
      expect(metrics.trainingsThisMonth).toBeGreaterThanOrEqual(0);
      expect(metrics.attendanceAverage).toBeGreaterThanOrEqual(0);
      expect(metrics.attendanceAverage).toBeLessThanOrEqual(100);
    });

    it('should include alerts', async () => {
      const dashboard = await getDashboard();
      expect(Array.isArray(dashboard.alerts)).toBe(true);
    });
  });

  describe('Stats', () => {
    it('should get stats', async () => {
      const stats = await getStats();
      expect(stats).toBeDefined();
      expect(stats.goalsByAthlete).toBeDefined();
      expect(stats.attendanceByAthlete).toBeDefined();
      expect(stats.assistsByAthlete).toBeDefined();
      expect(stats.riskList).toBeDefined();
    });

    it('should sort goalsByAthlete descending', async () => {
      const stats = await getStats();
      for (let i = 1; i < stats.goalsByAthlete.length; i++) {
        expect(stats.goalsByAthlete[i - 1].value).toBeGreaterThanOrEqual(
          stats.goalsByAthlete[i].value
        );
      }
    });

    it('should exclude goalkeepers from goals stats', async () => {
      const stats = await getStats();
      const hasGoalkeepers = stats.goalsByAthlete.some(
        entry => entry.position === 'Guarda-redes'
      );
      expect(hasGoalkeepers).toBe(false);
    });
  });
});
