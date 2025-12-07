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

  // --- Student List State (for the Table) ---
  students: Student[] = [];
  isLoadingStudents: boolean = false;
  studentsErrorMessage: string | null = null;
  
  constructor(private studentService: StudentService) { }

  ngOnInit(): void {
    this.fetchSeminars();
  }

  // --- 1. Seminar Data Fetching (Dropdown Population) ---
  async fetchSeminars(): Promise<void> {
    this.isLoadingSeminars = true;
    this.seminarErrorMessage = null;

    try {
      this.seminars = await this.studentService.getSeminars();
      
      // Select the first seminar by default if found
      if (this.seminars.length > 0 && this.selectedSeminarId === null) {
        // We use String() to ensure the ID is handled as the correct type (string)
        this.selectedSeminarId = String(this.seminars[0].id); 
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
  
  // --- 2. Dropdown Change Handler ---
  onSeminarChange(): void {
    // This method is triggered by the (change) event on the <select> element.
    if (this.selectedSeminarId !== null) {
        console.log(`Selected Seminar ID: ${this.selectedSeminarId}. Fetching students...`);
        this.fetchStudents(this.selectedSeminarId);
    } else {
      // Clear the list if the selection is somehow reset
      this.students = [];
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
}