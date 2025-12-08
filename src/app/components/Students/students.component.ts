// src\app\components\students\students.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { StudentService } from '../../services/student.service';
import { Seminar } from '../../interfaces/seminar'; 
import { Student } from '../../interfaces/student'; // Required for student list

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  
  // --- Seminar State (for the Dropdown) ---
  seminars: Seminar[] = [];
  // seminar_id is char varying(10) in the DB, so it must be a string.
  selectedSeminarId: string | null = null; 
  isLoadingSeminars: boolean = true;
  seminarErrorMessage: string | null = null;
  selectedSeminarDetails: Seminar | null = null; // <--- NEW PROPERTY

  // --- Student List State (for the Table) ---
  students: Student[] = [];
  isLoadingStudents: boolean = false;
  studentsErrorMessage: string | null = null;
  
  constructor(private studentService: StudentService) { }

  ngOnInit(): void {
    this.fetchSeminars();
  }

  // --- 1. Seminar Data Fetching (Dropdown Population) ---
// --- 1. Seminar Data Fetching (Dropdown Population) ---
  async fetchSeminars(): Promise<void> {
    this.isLoadingSeminars = true;
    this.seminarErrorMessage = null;

    try {
      this.seminars = await this.studentService.getSeminars();
      
      // If seminars are loaded, determine the best default selection
      if (this.seminars.length > 0 && this.selectedSeminarId === null) {
        
        // Find the closest upcoming seminar
        const closestSeminar = this.findClosestUpcomingSeminar(this.seminars);
        
        if (closestSeminar) {
          console.log('Selected Default Seminar:', closestSeminar.name, 'ID:', closestSeminar.id);
          this.selectedSeminarId = String(closestSeminar.id);
        } else {
          // Fallback to the first seminar if no upcoming one is found
          this.selectedSeminarId = String(this.seminars[0].id);
        }
      }
      // Trigger the student fetch immediately after loading seminars and setting a default selection
      this.onSeminarChange(); 
      
    } catch (error: any) {
      console.error('Failed to load seminars:', error);
      this.seminarErrorMessage = 'Failed to load seminar list. Check backend proxy for /api/seminars.';
    } finally {
      this.isLoadingSeminars = false;
    }
  }

  /**
   * Finds the seminar with a start_date that is the closest date to today (today or future).
   * @param seminars The list of all seminars.
   * @returns The closest upcoming seminar object or the first seminar if none are in the future.
   */
  private findClosestUpcomingSeminar(seminars: Seminar[]): Seminar | null {
    if (seminars.length === 0) {
      return null;
    }

    const today = new Date();
    // Normalize today to midnight for fair date comparison
    today.setHours(0, 0, 0, 0); 
    
    let closestSeminar: Seminar | null = null;
    let closestTimeDifference: number = Infinity;

    for (const seminar of seminars) {
      if (!seminar.start_date) continue;

      // Parse the ISO date string into a Date object
      const startDate = new Date(seminar.start_date);
      startDate.setHours(0, 0, 0, 0);

      // Only consider seminars that are today or in the future
      if (startDate >= today) {
        // Calculate the difference in milliseconds (smaller difference is closer)
        const timeDifference = startDate.getTime() - today.getTime();
        
        if (timeDifference < closestTimeDifference) {
          closestTimeDifference = timeDifference;
          closestSeminar = seminar;
        }
      }
    }
    
    // If we found an upcoming seminar, return it.
    if (closestSeminar) {
      return closestSeminar;
    }
    
    // Fallback: If no upcoming seminar is found, return the first one in the list.
    return seminars[0];
  }
  
  // --- 2. Dropdown Change Handler ---
onSeminarChange(): void {
    // This method is triggered by the (change) event on the <select> element.
    if (this.selectedSeminarId !== null) {
        console.log(`Selected Seminar ID: ${this.selectedSeminarId}. Fetching students...`);
        
        // 💡 UPDATE: Find the full details of the selected seminar
        const seminarIdNum = parseInt(this.selectedSeminarId, 10);
        this.selectedSeminarDetails = this.seminars.find(s => s.id === seminarIdNum) || null;
        
        this.fetchStudents(this.selectedSeminarId);
    } else {
      // Clear the list if the selection is somehow reset
      this.students = [];
      this.selectedSeminarDetails = null; // <--- Clear details
    }
  }

  // --- 3. Student Data Fetching (Table Population) ---
  async fetchStudents(seminarId: string): Promise<void> { 
    this.isLoadingStudents = true;
    this.studentsErrorMessage = null;
    this.students = []; 

    try {
      this.students = await this.studentService.getStudents(seminarId);
      
    } catch (error: any) {
      console.error(`Failed to load students for seminar ${seminarId}:`, error);
      this.studentsErrorMessage = 'Could not load student list. Please check network connection and backend logs.';
    } finally {
      this.isLoadingStudents = false;
    }
  }

  // src\app\components\Students\students.component.ts (Add this method)

// ... inside export class StudentsComponent implements OnInit {

  /**
   * Helper method to convert a number to a string for use in the template [ngValue] binding.
   * Angular templates do not natively recognize the global 'String' constructor.
   */
  public convertToString(value: number | null | undefined): string {
    return String(value);
  }

// ... rest of the component
}