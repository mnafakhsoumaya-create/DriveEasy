import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Client, EligibiliteResponse } from '../../core/models/client.model';
import { Location } from '../../core/models/location.model';
import { ClientService } from '../../core/services/client.service';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">FICHE CLIENT</p>
        <h1>{{ client() ? client()!.prenom + ' ' + client()!.nom : 'Chargement…' }}</h1>
        <p class="subtitle">Informations d’identité, éligibilité et historique des locations.</p>
      </div>
      <div class="header-actions">
        <a routerLink="/locations/new" class="btn btn-primary">+ Nouvelle location</a>
        <a routerLink="/clients" class="btn btn-outline">← Retour aux clients</a>
      </div>
    </div>

    @if (client(); as c) {
      @if (eligibilite() && !eligibilite()!.eligible) {
        <div class="alert-banner">
          <strong>⚠ Client non éligible à la location :</strong> {{ eligibilite()!.motif }}
        </div>
      }

      <div class="detail-grid">
        <article class="panel info-panel">
          <div class="panel-head">
            <div>
              <h2>Informations personnelles</h2>
              <p>Client #{{ c.id }} · inscrit le {{ c.dateInscription || '—' }}</p>
            </div>
            <span class="badge" [ngClass]="c.categorieClient === 'VIP' ? 'badge-green' : c.categorieClient === 'FIDELE' ? 'badge-blue' : 'badge-slate'">
              {{ c.categorieClient }}
            </span>
          </div>

          <dl class="info-list">
            <div><dt>CIN</dt><dd>{{ c.cin }}</dd></div>
            <div><dt>Date de naissance</dt><dd>{{ c.dateNaissance }}</dd></div>
            <div><dt>Email</dt><dd>{{ c.email }}</dd></div>
            <div><dt>Téléphone</dt><dd>{{ c.telephone }}</dd></div>
            <div><dt>Adresse</dt><dd>{{ c.adresse }}</dd></div>
            <div><dt>N° de permis</dt><dd>{{ c.numeroPermis }}</dd></div>
            <div><dt>Expiration permis</dt><dd>{{ c.dateExpirationPermis }}</dd></div>
          </dl>
        </article>

        <article class="panel elig-panel">
          <div class="panel-head">
            <div>
              <h2>Contrôle d’éligibilité</h2>
              <p>Vérification en temps réel via client-service</p>
            </div>
          </div>

          @if (eligibilite(); as e) {
            <div class="elig-body">
              <div class="elig-status" [class.ok]="e.eligible" [class.ko]="!e.eligible">
                <strong>{{ e.eligible ? '✓ Client éligible' : '✕ Non éligible' }}</strong>
                <p>{{ e.motif }}</p>
              </div>
              <div class="check-row">
                <span>Âge du conducteur ({{ e.age }} ans, min. 21)</span>
                <span class="badge" [ngClass]="e.ageValide ? 'badge-green' : 'badge-red'">
                  {{ e.ageValide ? 'Valide' : 'Insuffisant' }}
                </span>
              </div>
              <div class="check-row">
                <span>Validité du permis (exp. {{ e.dateExpirationPermis }})</span>
                <span class="badge" [ngClass]="e.permisValide ? 'badge-green' : 'badge-red'">
                  {{ e.permisValide ? 'Valide' : 'Expiré' }}
                </span>
              </div>
            </div>
          }
        </article>
      </div>

      <section class="panel history-panel">
        <div class="panel-head">
          <div>
            <h2>Historique des locations ({{ rentals().length }})</h2>
            <p>Toutes les réservations et locations associées à ce client</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>RÉF.</th>
                <th>VÉHICULE</th>
                <th>PÉRIODE</th>
                <th>KM DÉPART / RETOUR</th>
                <th>MONTANT</th>
                <th>PÉNALITÉ</th>
                <th>STATUT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of rentals(); track r.id) {
                <tr>
                  <td><b>#{{ r.id }}</b></td>
                  <td>Véhicule #{{ r.vehiculeId }}</td>
                  <td>{{ r.dateDebut }} → {{ r.dateFinPrevue }}</td>
                  <td>{{ r.kmDepart }} / {{ r.kmRetour ?? '—' }}</td>
                  <td><b>{{ r.montantTotal | number:'1.2-2' }} TND</b></td>
                  <td>{{ r.penalite | number:'1.2-2' }} TND</td>
                  <td>
                    <span class="badge" [ngClass]="r.statut === 'EN_COURS' ? 'badge-green' : r.statut === 'RESERVEE' ? 'badge-blue' : r.statut === 'ANNULEE' ? 'badge-red' : 'badge-slate'">
                      {{ r.statut }}
                    </span>
                  </td>
                  <td>
                    @if (r.statut === 'EN_COURS') {
                      <a [routerLink]="['/locations', r.id, 'retour']" class="btn-xs">Retour</a>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-cell">Aucune location pour ce client.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
  styles: [`
    .alert-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 14px 18px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 18px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 18px;
      margin-bottom: 20px;
    }
    .info-list {
      margin: 0;
      padding: 8px 20px 20px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .info-list dt {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #7c8d95;
      margin-bottom: 3px;
    }
    .info-list dd {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #102b3a;
    }
    .elig-body {
      padding: 8px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .elig-status {
      padding: 14px 16px;
      border-radius: 10px;
    }
    .elig-status.ok { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
    .elig-status.ko { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .elig-status strong { display: block; font-size: 14px; margin-bottom: 4px; }
    .elig-status p { margin: 0; font-size: 12px; }
    .check-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #3f555f;
      padding-top: 10px;
      border-top: 1px solid #f0f4f5;
    }
    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: 1fr; }
      .info-list { grid-template-columns: 1fr; }
    }
  `],
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientService = inject(ClientService);
  private readonly locationService = inject(LocationService);

  readonly client = signal<Client | null>(null);
  readonly eligibilite = signal<EligibiliteResponse | null>(null);
  readonly rentals = signal<Location[]>([]);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    forkJoin({
      client: this.clientService.getById(id),
      eligibilite: this.clientService.checkEligibilite(id),
      rentals: this.locationService.getAll({ clientId: id, size: 100 }),
    }).subscribe({
      next: ({ client, eligibilite, rentals }) => {
        this.client.set(client);
        this.eligibilite.set(eligibilite);
        this.rentals.set(rentals);
      },
    });
  }
}
