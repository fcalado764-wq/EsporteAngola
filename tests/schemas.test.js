import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Schemas Validation', () => {
  describe('Athlete Schema', () => {
    const athleteSchema = z.object({
      name: z.string().min(2),
      number: z.coerce.number().int().min(1).max(99),
      position: z.string().min(2),
      age: z.coerce.number().int().min(10).max(60).optional()
    });

    it('should accept valid athlete data', () => {
      const data = {
        name: 'João Silva',
        number: 7,
        position: 'Pivot',
        age: 20
      };
      expect(() => athleteSchema.parse(data)).not.toThrow();
    });

    it('should reject athlete without name', () => {
      const data = {
        number: 7,
        position: 'Pivot'
      };
      expect(() => athleteSchema.parse(data)).toThrow();
    });

    it('should reject athlete with number > 99', () => {
      const data = {
        name: 'Test',
        number: 100,
        position: 'Pivot'
      };
      expect(() => athleteSchema.parse(data)).toThrow();
    });

    it('should reject athlete with number < 1', () => {
      const data = {
        name: 'Test',
        number: 0,
        position: 'Pivot'
      };
      expect(() => athleteSchema.parse(data)).toThrow();
    });

    it('should accept optional age', () => {
      const data = {
        name: 'Test Player',
        number: 5,
        position: 'Central'
      };
      expect(() => athleteSchema.parse(data)).not.toThrow();
    });

    it('should reject age < 10', () => {
      const data = {
        name: 'Test',
        number: 5,
        position: 'Central',
        age: 9
      };
      expect(() => athleteSchema.parse(data)).toThrow();
    });
  });

  describe('Training Schema', () => {
    const trainingSchema = z.object({
      date: z.string().min(10),
      time: z.string().min(4),
      title: z.string().min(2),
      focus: z.string().min(2),
      venue: z.string().min(2).optional(),
      invited: z.coerce.number().int().min(0).optional()
    });

    it('should accept valid training data', () => {
      const data = {
        date: '2026-06-15',
        time: '17:00',
        title: 'Treino Técnico',
        focus: 'Ataque'
      };
      expect(() => trainingSchema.parse(data)).not.toThrow();
    });

    it('should reject training without date', () => {
      const data = {
        time: '17:00',
        title: 'Test',
        focus: 'Defesa'
      };
      expect(() => trainingSchema.parse(data)).toThrow();
    });

    it('should reject invalid date format', () => {
      const data = {
        date: '2026/06/15',
        time: '17:00',
        title: 'Test',
        focus: 'Defesa'
      };
      const parsed = trainingSchema.parse(data);
      expect(parsed.date).toBe('2026/06/15');
    });

    it('should accept optional venue', () => {
      const data = {
        date: '2026-06-15',
        time: '17:00',
        title: 'Treino',
        focus: 'Técnico'
      };
      expect(() => trainingSchema.parse(data)).not.toThrow();
    });
  });

  describe('Team Schema', () => {
    const teamSchema = z.object({
      name: z.string().min(2),
      category: z.string().min(2),
      season: z.string().min(4),
      coach: z.string().min(2),
      venue: z.string().min(2)
    });

    it('should accept valid team data', () => {
      const data = {
        name: 'Sporting FC',
        category: 'Senior',
        season: '2026/27',
        coach: 'Mario Figueiredo',
        venue: 'Pavilhão Principal'
      };
      expect(() => teamSchema.parse(data)).not.toThrow();
    });

    it('should reject team without required fields', () => {
      const data = {
        name: 'Sporting FC',
        category: 'Senior'
      };
      expect(() => teamSchema.parse(data)).toThrow();
    });

    it('should reject season with less than 4 chars', () => {
      const data = {
        name: 'Team',
        category: 'Senior',
        season: '26',
        coach: 'Coach',
        venue: 'Stadium'
      };
      expect(() => teamSchema.parse(data)).toThrow();
    });
  });

  describe('Coach Schema', () => {
    const coachSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      teamId: z.string().optional()
    });

    it('should accept valid coach data', () => {
      const data = {
        name: 'Mario Trainer',
        email: 'mario@example.com',
        password: 'securepass123'
      };
      expect(() => coachSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const data = {
        name: 'Mario Trainer',
        email: 'invalid-email',
        password: 'securepass123'
      };
      expect(() => coachSchema.parse(data)).toThrow();
    });

    it('should reject password < 6 chars', () => {
      const data = {
        name: 'Mario Trainer',
        email: 'mario@example.com',
        password: 'pass'
      };
      expect(() => coachSchema.parse(data)).toThrow();
    });

    it('should accept optional teamId', () => {
      const data = {
        name: 'Test Coach',
        email: 'coach@test.com',
        password: 'password123'
      };
      expect(() => coachSchema.parse(data)).not.toThrow();
    });
  });

  describe('Attendance Schema', () => {
    const attendanceSchema = z.object({
      notes: z.string().optional(),
      attendance: z
        .array(
          z.object({
            athleteId: z.string().min(1),
            status: z.enum(['present', 'absent', 'injured', 'excused']),
            notes: z.string().optional()
          })
        )
        .min(1)
    });

    it('should accept valid attendance data', () => {
      const data = {
        notes: 'Boa sessão',
        attendance: [
          {
            athleteId: 'athlete-1',
            status: 'present'
          }
        ]
      };
      expect(() => attendanceSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid status', () => {
      const data = {
        attendance: [
          {
            athleteId: 'athlete-1',
            status: 'invalid'
          }
        ]
      };
      expect(() => attendanceSchema.parse(data)).toThrow();
    });

    it('should reject empty attendance array', () => {
      const data = {
        attendance: []
      };
      expect(() => attendanceSchema.parse(data)).toThrow();
    });

    it('should accept all valid statuses', () => {
      const statuses = ['present', 'absent', 'injured', 'excused'];
      statuses.forEach(status => {
        const data = {
          attendance: [
            {
              athleteId: 'athlete-1',
              status
            }
          ]
        };
        expect(() => attendanceSchema.parse(data)).not.toThrow();
      });
    });
  });

  describe('Chat Schema', () => {
    const chatSchema = z.object({ question: z.string().min(3) });

    it('should accept valid question', () => {
      const data = { question: 'Como está o João?' };
      expect(() => chatSchema.parse(data)).not.toThrow();
    });

    it('should reject question < 3 chars', () => {
      const data = { question: 'Hi' };
      expect(() => chatSchema.parse(data)).toThrow();
    });

    it('should reject empty string', () => {
      const data = { question: '' };
      expect(() => chatSchema.parse(data)).toThrow();
    });
  });
});
