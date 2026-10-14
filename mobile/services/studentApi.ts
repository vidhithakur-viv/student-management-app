import { api } from '@/services/api';
import { Student, StudentInput } from '@/types/student';

export const studentApi = {
  async list(): Promise<Student[]> {
    const { data } = await api.get<Student[]>('/students');
    return data;
  },
  async search(query: string): Promise<Student[]> {
    const { data } = await api.get<Student[]>('/students/search', { params: { query } });
    return data;
  },
  async get(id: string): Promise<Student> {
    const { data } = await api.get<Student>(`/students/${id}`);
    return data;
  },
  async create(input: StudentInput): Promise<Student> {
    const { data } = await api.post<Student>('/students', input);
    return data;
  },
  async update(id: string, input: StudentInput): Promise<Student> {
    const { data } = await api.put<Student>(`/students/${id}`, input);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },
};
