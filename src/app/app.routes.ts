import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReceiptManagerComponent } from './components/receipt-manager/receipt-manager.component';
import { StudentsComponent } from './components/Students/students.component';
import { Component2Component } from './components/component2/component2.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'receipt-manager', component: ReceiptManagerComponent },
  { path: 'students', component: StudentsComponent },
  { path: 'component2', component: Component2Component },
];