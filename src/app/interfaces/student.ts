// src/app/interfaces/student.ts (Add or confirm these fields)

export interface Student {
  id: number;
  stud_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  
  // Address fields (currently combined into 'City')
  street_city: string; // <-- Add for completeness
  city: string;
  province: string; // <-- Add for completeness
  country_code: string;
  
  tshirt_size: string;
  hoodie_size: string;
  
  food_allergies: boolean;
  allergy_details: string | null;
  
  seminar_attendances: number | null;
  
  // Additional fields for completeness
  comments: string | null;
  observations: string | null;
  position: string; // public.position_enum
  diet_type: string; // public.diet_type_enum
  status: string; // public.student_status_enum
}