/** Fields the user edits (matches backend StudentCreate / StudentUpdate). */
export interface StudentInput {
  name: string;
  email: string;
  phone: string;
  age: number;
  course: string;
  year: number;
}

/** Matches backend StudentResponse. */
export interface Student extends StudentInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
