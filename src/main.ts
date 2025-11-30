// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
// ❌ DELETE these two unused imports:
// import { provideRouter } from '@angular/router';
// import { routes } from './app/app.routes'; 

// 👇 IMPORT the complete appConfig object
import { appConfig } from './app/app.config'; 

// 👇 Pass the complete appConfig object here
bootstrapApplication(AppComponent, appConfig) 
  .catch(err => console.error(err));