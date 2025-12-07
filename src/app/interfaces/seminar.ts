export interface Seminar {
  id: number;
  name: string; 
  start_date: string | null; // <--- ADDED: ISO Date string from DB
}