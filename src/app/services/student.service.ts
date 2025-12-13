// src/app/services/student.service.ts (New File)

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { firstValueFrom, Observable } from 'rxjs';
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

  /**
     * Updates the details of a single student.
     * Assumes the backend API expects a PUT/PATCH request with the student ID in the URL,
     * and the entire updated Student object in the body.
     * Returns an Observable<Student> because the component expects an Observable response for handling next/error.
     */
    updateStudent(student: Student): Observable<Student> {
        // Assuming your Student interface has a unique identifier like 'stud_id'
        const studentId = student.stud_id; 
        
        if (!studentId) {
            throw new Error("Cannot update student: Student ID is missing.");
        }
        
        const url = `${this.backendBaseUrl}/api/students/${studentId}`; 
        
        // Use http.put for full replacement or http.patch for partial update. 
        // We'll use PUT here as we are sending the full (updated) object.
        return this.http.put<Student>(url, student);
    }

// src/app/services/student.service.ts (Add this method)

// ... existing methods ...

    /**
     * Performs a bulk update on multiple students.
     * @param studentIds Array of stud_id (text keys).
     * @param updatePayload Object containing the field and the new value { fieldName: newValue }.
     * @returns Observable confirming the operation (the server response can vary).
     */
    bulkUpdateStudents(studentIds: string[], updatePayload: { [key: string]: any }): Observable<any> {
        const url = `${this.backendBaseUrl}/api/students/bulk-update`; 
        
        const body = { 
            ids: studentIds,
            updates: updatePayload
        };

        // Use PATCH for partial updates, as we are only sending one field/value
        return this.http.patch<any>(url, body); 
    }


}