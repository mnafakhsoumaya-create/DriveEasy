import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CategorieClient,
  Client,
  ClientRequest,
  EligibiliteResponse,
} from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/clients';

  getAll(query?: string): Observable<Client[]> {
    let params = new HttpParams();
    if (query && query.trim()) {
      params = params.set('q', query.trim());
    }
    return this.http.get<Client[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/${id}`);
  }

  create(dto: ClientRequest): Observable<Client> {
    return this.http.post<Client>(this.baseUrl, dto);
  }

  update(id: number, dto: ClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  checkEligibilite(id: number): Observable<EligibiliteResponse> {
    return this.http.get<EligibiliteResponse>(`${this.baseUrl}/${id}/eligibilite`);
  }

  updateCategorie(id: number, categorieClient: CategorieClient): Observable<Client> {
    return this.http.patch<Client>(`${this.baseUrl}/${id}/categorie`, { categorieClient });
  }
}
