// src/app/services/student.service.ts (New File)

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Seminar } from '../interfaces/seminar'; // Import the interface
import { Student } from '../interfaces/student'; // Import the Student interface

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  
  // Assumes environment.backendUrl is correctly set (e.g., http://localhost:3000)
  private backendBaseUrl = environment.backendUrl; 

  constructor(private http: HttpClient) { }

  /**
   * Fetches the list of seminar names by calling the backend proxy.
   */
  getSeminars(): Promise<Seminar[]> {
    const url = `${this.backendBaseUrl}/api/seminars`;
    
    return firstValueFrom(
      this.http.get<Seminar[]>(url)
    );
  }

    // Method to fetch students for a specific seminar ID
  getStudents(seminarId: string): Promise<Student[]> { // 💡 seminarId must be string/char
    // Note: The backend will handle routing with the seminar ID
    const url = `${this.backendBaseUrl}/api/students/${seminarId}`; 
    
    return firstValueFrom(
      this.http.get<Student[]>(url) // Uses the new Student interface type
    );
  }

}