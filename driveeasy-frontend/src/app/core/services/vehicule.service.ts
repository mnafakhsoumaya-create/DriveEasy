import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  StatutVehicule,
  Vehicule,
  VehiculeFilters,
  VehiculeRequest,
} from '../models/vehicule.model';

@Injectable({ providedIn: 'root' })
export class VehiculeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/vehicules';

  getAll(filters?: VehiculeFilters): Observable<Vehicule[]> {
    let params = new HttpParams();
    if (filters?.categorie) {
      params = params.set('categorie', filters.categorie);
    }
    if (filters?.carburant) {
      params = params.set('carburant', filters.carburant);
    }
    if (filters?.statut) {
      params = params.set('statut', filters.statut);
    }
    if (filters?.prixMax != null && filters.prixMax > 0) {
      params = params.set('prixMax', filters.prixMax.toString());
    }
    return this.http.get<Vehicule[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.baseUrl}/${id}`);
  }

  getDisponibles(dateDebut?: string, dateFin?: string): Observable<Vehicule[]> {
    let params = new HttpParams();
    if (dateDebut) {
      params = params.set('dateDebut', dateDebut);
    }
    if (dateFin) {
      params = params.set('dateFin', dateFin);
    }
    return this.http.get<Vehicule[]>(`${this.baseUrl}/disponibles`, { params });
  }

  create(dto: VehiculeRequest): Observable<Vehicule> {
    return this.http.post<Vehicule>(this.baseUrl, dto);
  }

  update(id: number, dto: VehiculeRequest): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${this.baseUrl}/${id}`, dto);
  }

  updateStatut(id: number, statut: StatutVehicule): Observable<Vehicule> {
    return this.http.patch<Vehicule>(`${this.baseUrl}/${id}/statut`, { statut });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
