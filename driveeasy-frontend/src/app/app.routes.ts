import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { ClientDetailComponent } from './features/clients/client-detail.component';
import { ClientListComponent } from './features/clients/client-list.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LocationListComponent } from './features/locations/location-list.component';
import { LocationReturnComponent } from './features/locations/location-return.component';
import { LocationWizardComponent } from './features/locations/location-wizard.component';
import { VehiculeFormComponent } from './features/vehicules/vehicule-form.component';
import { VehiculeListComponent } from './features/vehicules/vehicule-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Tableau de bord | DriveEasy' },
  { path: 'vehicules', component: VehiculeListComponent, title: 'Catalogue des véhicules | DriveEasy' },
  {
    path: 'vehicules/new',
    component: VehiculeFormComponent,
    canDeactivate: [unsavedChangesGuard],
    title: 'Nouveau véhicule | DriveEasy',
  },
  {
    path: 'vehicules/:id/edit',
    component: VehiculeFormComponent,
    canDeactivate: [unsavedChangesGuard],
    title: 'Modifier véhicule | DriveEasy',
  },
  { path: 'clients', component: ClientListComponent, title: 'Clients | DriveEasy' },
  { path: 'clients/:id', component: ClientDetailComponent, title: 'Fiche client | DriveEasy' },
  { path: 'locations', component: LocationListComponent, title: 'Locations | DriveEasy' },
  { path: 'locations/new', component: LocationWizardComponent, title: 'Nouvelle location | DriveEasy' },
  { path: 'locations/:id/retour', component: LocationReturnComponent, title: 'Retour de véhicule | DriveEasy' },
  { path: '**', redirectTo: 'dashboard' },
];
