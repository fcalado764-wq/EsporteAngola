import { coaches } from '../data/mockData.js';
import { hashPassword } from '../services/auth.js';

export function initializeData() {
  coaches.forEach((coach) => {
    if (!coach.password) {
      coach.password = hashPassword('password123');
    }
  });
}
