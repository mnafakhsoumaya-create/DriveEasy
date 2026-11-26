import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Location,
  LocationDetail,
  LocationRequest,
  RetourLocationRequest,
  SimulationRequest,
  SimulationResponse,
  Statistiques,
  StatutLocation,
} from '../models/location.model';

export interface LocationFilters {
  statut?: StatutLocation | '';
  clientId?: number;
  vehiculeId?: number;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/locations';

  getAll(filters?: LocationFilters): Observable<Location[]> {
    let params = new HttpParams();
    if (filters?.statut) {
      params = params.set('statut', filters.statut);
    }
    if (filters?.clientId != null) {
      params = params.set('clientId', filters.clientId.toString());
    }
    if (filters?.vehiculeId != null) {
      params = params.set('vehiculeId', filters.vehiculeId.toString());
    }
    if (filters?.dateDebut) {
      params = params.set('dateDebut', filters.dateDebut);
    }
    if (filters?.dateFin) {
      params = params.set('dateFin', filters.dateFin);
    }
    params = params.set('page', (filters?.page ?? 0).toString());
    params = params.set('size', (filters?.size ?? 100).toString());

    return this.http.get<Location[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<LocationDetail> {
    return this.http.get<LocationDetail>(`${this.baseUrl}/${id}`);
  }

  create(dto: LocationRequest): Observable<Location> {
    return this.http.post<Location>(this.baseUrl, dto);
  }

  simulate(dto: SimulationRequest): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(`${this.baseUrl}/simulation`, dto);
  }

  depart(id: number): Observable<Location> {
    return this.http.patch<Location>(`${this.baseUrl}/${id}/depart`, {});
  }

  retour(id: number, dto: RetourLocationRequest): Observable<Location> {
    return this.http.patch<Location>(`${this.baseUrl}/${id}/retour`, dto);
  }

  annuler(id: number): Observable<Location> {
    return this.http.patch<Location>(`${this.baseUrl}/${id}/annulation`, {});
  }

  getStatistiques(): Observable<Statistiques> {
    return this.http.get<Statistiques>(`${this.baseUrl}/statistiques`);
  }
}
