import { StudentInput } from '@/types/student';

export interface StudentFormValues {
  name: string;
  email: string;
  phone: string;
  age: string;
  course: string;
  year: string;
}

export type StudentFormErrors = Partial<Record<keyof StudentFormValues, string>>;

// Mirrors the backend (app/schemas/student.py) so server and client agree.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}[0-9]$/;

export function validateStudent(
  values: StudentFormValues
): { errors: StudentFormErrors; data: StudentInput | null } {
  const errors: StudentFormErrors = {};
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();
  const phone = values.phone.trim();
  const course = values.course.trim();
  const ageText = values.age.trim();
  const yearText = values.year.trim();

  if (!name) errors.name = 'Name is required';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer';

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';

  if (!phone) errors.phone = 'Phone is required';
  else if (!PHONE_RE.test(phone)) errors.phone = 'Enter a valid phone number (8-20 digits)';

  const age = Number(ageText);
  if (!ageText) errors.age = 'Age is required';
  else if (!Number.isInteger(age) || age < 5 || age > 120) errors.age = 'Enter a valid age (5-120)';

  if (!course) errors.course = 'Course is required';

  const year = Number(yearText);
  if (!yearText) errors.year = 'Year is required';
  else if (!Number.isInteger(year) || year < 1 || year > 10) errors.year = 'Enter a valid year (1-10)';

  if (Object.keys(errors).length > 0) return { errors, data: null };
  return { errors, data: { name, email, phone, age, course, year } };
}
