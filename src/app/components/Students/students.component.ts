// src\app\components\students\students.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; // 💡 Required for [(ngModel)]
import { StudentService } from '../../services/student.service';
import { Seminar } from '../../interfaces/seminar'; 

@Component({
  selector: 'app-students',
  standalone: true,
  // 💡 IMPORTS: Include FormsModule for two-way binding
  imports: [CommonModule, FormsModule], 
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  
  // State variables for seminar selection
  seminars: Seminar[] = [];
  selectedSeminarId: number | null = null; // Binds to the dropdown value
  isLoadingSeminars: boolean = true;
  seminarErrorMessage: string | null = null;

  constructor(private studentService: StudentService) { }

  ngOnInit(): void {
    this.fetchSeminars();
  }

  // --- Seminar Data Fetching ---
  async fetchSeminars(): Promise<void> {
    this.isLoadingSeminars = true;
    this.seminarErrorMessage = null;

    try {
      this.seminars = await this.studentService.getSeminars();
      
      // Select the first seminar by default if found
      if (this.seminars.length > 0 && this.selectedSeminarId === null) {
        this.selectedSeminarId = this.seminars[0].id; 
      }
      this.onSeminarChange(); 
      
    } catch (error: any) {
      console.error('Failed to load seminars:', error);
      // Provides user-friendly error message
      this.seminarErrorMessage = 'Failed to load seminar list. Check backend proxy for /api/seminars.';
    } finally {
      this.isLoadingSeminars = false;
    }
  }
  
  onSeminarChange(): void {
    if (this.selectedSeminarId !== null) {
        console.log(`Selected Seminar ID: ${this.selectedSeminarId}.`);
        // The logic to load students based on this ID will go here next.
    }
  }
}