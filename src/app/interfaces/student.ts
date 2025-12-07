// src/app/interfaces/student.ts (Updated File)

export interface Student {
  id: number; // serial not null
  stud_id: string | null; // character varying(10) null
  name: string; // text not null (Student's Full Name)
  street_city: string; // text not null (Address part 1)
  city: string; // text not null (City)
  province: string; // text not null (Province/State)
  country_code: string; // character(3) not null
  email: string | null; // text null
  phone: string; // text not null
  type_size: string; // character(1) not null (e.g., S for small, M for medium, etc., if applicable)
  tshirt_size: string; // public.size_enum not null (Enum type, mapped to string)
  hoodie_size: string; // public.size_enum not null (Enum type, mapped to string)
  food_allergies: boolean; // boolean not null
  allergy_details: string | null; // text null
  comments: string | null; // text null
  observations: string | null; // text null
  insertion_date: string | null; // date null (use string for ISO date format)
  insertion_time: string | null; // time without time zone null (use string for time format)
  seminar_attendances: number | null; // integer null
}