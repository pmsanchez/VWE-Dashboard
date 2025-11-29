import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReceiptManagerComponent } from './components/receipt-manager/receipt-manager.component';
import { Component1Component } from './components/component1/component1.component';
import { Component2Component } from './components/component2/component2.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'receipt-manager', component: ReceiptManagerComponent },
  { path: 'component1', component: Component1Component },
  { path: 'component2', component: Component2Component },
];