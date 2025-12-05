// src/app/services/student.service.ts (New File)

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Seminar } from '../interfaces/seminar'; // Import the interface

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
}