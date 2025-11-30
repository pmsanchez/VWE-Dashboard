// src/app/services/receipt-manager.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReceiptManagerService {

  // This goes to your Angular proxy instead of Veryfi directly
  private veryfiUrl = '/veryfi-api/documents';

  constructor(private http: HttpClient) {}

  processImage(imageBase64: string): Promise<any> {
    const payload = {
      file_name: 'receipt.jpg',
      file_data: imageBase64,     // VERYFI EXPECTS `file_data` not file_base64
    };

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Angular-Receipt-App',
      'Client-Id': 'vrfo3Nbx3uZ3BkzTv9lN3MDfZm93GlJY7gU1DWb',
      'Authorization': 'apikey pedro.sanchezxp:700054940342f99bccf33809f6071e3f'
    });

    return firstValueFrom(
      this.http.post(this.veryfiUrl, payload, { headers })
    );
  }
}
