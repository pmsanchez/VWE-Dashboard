export interface Seminar {
  id: number;
  sem_id: string; 
  name: string; 
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  location_id: number; 
  location_name: string; 
  location_country_code: string; // <--- NEW: To hold the country code
}