// src/app/services/receipt-manager.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // No need for HttpHeaders anymore
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReceiptManagerService {

  // This is the URL of your new backend proxy route
  private backendUrl = environment.backendUrl; 

  constructor(private http: HttpClient) {}

  processImage(imageBase64: string): Promise<any> {
    const payload = {
      file_name: 'receipt.jpg',
      file_data: imageBase64,
    };

    // The headers with credentials are now set in the backend!
    // We only need basic headers for the request to our own server.
    // NOTE: HttpClient often handles basic headers (Content-Type) automatically.

    return firstValueFrom(
      // Send the payload to your secure backend
      this.http.post(this.backendUrl, payload) 
    );
  }
}