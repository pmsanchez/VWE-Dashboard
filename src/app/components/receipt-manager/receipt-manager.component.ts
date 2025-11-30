// src\app\components\receipt-manager\receipt-manager.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router'; // Ensure RouterLink is here if needed for tabs
import { FormsModule } from '@angular/forms'; // Needed for editable input fields
import { CommonModule } from '@angular/common'; // Needed for *ngIf
import { ReceiptManagerService } from '../../services/receipt-manager.service';
// Define the interface for the extracted data structure we want
export interface LineItem {
  description: string;
  quantity: number;
  total: number;
}

export interface ExtractedData {
  date: string;
  time: string;
  invoice_number: string;
  payment_display_name: string;
  currency_code: string;
  subtotal: number;
  tax: number;
  total: number;
  vendor_name: string;
  line_items: LineItem[];
  seminar_name: string;
}


@Component({
  selector: 'app-receipt-manager',
  standalone: true,
  // Added FormsModule and CommonModule
  imports: [RouterLink, FormsModule, CommonModule], 
  templateUrl: './receipt-manager.component.html',
  styleUrl: './receipt-manager.component.css'
})
export class ReceiptManagerComponent implements OnInit {
  
  // State variables for view management and data
  currentView: 'capture' | 'list' = 'capture';
  selectedFile: File | null = null;
  extractedData: ExtractedData | null = null;
  
  // Property to hold the camera input element reference (for triggering clicks)
  cameraInput: HTMLInputElement | null = null; 

  constructor(private receiptService: ReceiptManagerService) { }

  ngOnInit(): void {
    // Initialize the camera input element for later use
    this.cameraInput = document.createElement('input');
    this.cameraInput.type = 'file';
    // Capture both standard files and camera input
    this.cameraInput.accept = 'image/*'; 
    this.cameraInput.setAttribute('capture', 'environment'); // Suggest back camera
    this.cameraInput.style.display = 'none'; // Keep it hidden
    this.cameraInput.addEventListener('change', (event: any) => this.onFileSelected(event));
  }

  // --- View Switching ---
  switchView(view: 'capture' | 'list'): void {
    this.currentView = view;
  }
  
  // --- File/Camera Handlers ---
  
  // Logic for the "Take Picture" button
  onTakePicture(): void {
    // Programmatically click the hidden camera input element
    if (this.cameraInput) {
      this.cameraInput.click();
    }
  }

  // Logic for the "Upload Receipt" button
  onUploadReceipt(): void {
    // Create a standard file input on the fly
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (event: any) => this.onFileSelected(event));
    fileInput.click();
  }

  // Common handler for both file selection and camera capture
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.processReceipt();
    }
  }

  // --- Integration Logic ---
  async processReceipt(): Promise<void> {
    if (!this.selectedFile) return;

    // Convert file to Base64 string for the API call
    const base64Image = await this.readFileAsBase64(this.selectedFile);

    try {
      // Call the service to send the image to Veryfi
      const rawData = await this.receiptService.processImage(base64Image);
      
      // Map the required fields from the Veryfi response
      this.mapExtractedData(rawData);
      
    } catch (error) {
      console.error('Veryfi API processing failed:', error);
      alert('Error processing receipt. Check the console for details.');
      this.extractedData = null;
    }
  }

  // Helper function to convert File object to Base64
  readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]); // Only the Base64 part
      reader.onerror = error => reject(error);
    });
  }
  
  // Maps the verbose Veryfi response to our required ExtractedData interface
mapExtractedData(rawData: any): void {
  
  // rawData.date may contain "YYYY-MM-DD HH:mm:ss"
  let fullDate = rawData.date || "";
  let dateOnly = "";
  let timeOnly = "";

  if (fullDate.includes(" ")) {
    const parts = fullDate.split(" ");
    dateOnly = parts[0];
    timeOnly = parts[1];
  } else {
    // fallback if Veryfi returns only date
    dateOnly = fullDate;
    timeOnly = "00:00:00";
  }

  this.extractedData = {
    seminar_name: '',  
    date: dateOnly,
    time: timeOnly,
    invoice_number: rawData.invoice_number || '',
    payment_display_name: rawData.payment?.display_name || '',
    currency_code: rawData.currency_code || '',
    subtotal: rawData.subtotal || 0,
    tax: rawData.tax || 0,
    total: rawData.total || 0,
    vendor_name: rawData.vendor?.name || '',
    line_items: rawData.line_items?.map((item: any) => ({
      description: item.description || '',
      quantity: item.quantity || 0,
      total: item.total || 0,
    })) || []
  };
}

}