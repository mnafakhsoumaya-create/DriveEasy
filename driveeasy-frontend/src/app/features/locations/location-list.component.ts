import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Location, StatutLocation } from '../../core/models/location.model';
import { LocationService } from '../../core/services/location.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">OPÉRATIONS</p>
        <h1>Liste des locations</h1>
        <p class="subtitle">{{ filtered().length }} location(s) trouvée(s)</p>
      </div>
      <div class="header-actions">
        <a routerLink="/locations/new" class="btn btn-primary">+ Nouvelle location</a>
        <button class="btn btn-outline" (click)="load()">↻ Actualiser</button>
      </div>
    </div>

    <!-- Filters -->
    <section class="panel filter-panel">
      <div class="filter-grid">
        <label>
          <span>Recherche (Réf., Client, Véhicule)</span>
          <input
            type="text"
            placeholder="Ex: #12…"
            [ngModel]="search()"
            (ngModelChange)="search.set($event); page.set(1)"
          />
        </label>

        <label>
          <span>Statut</span>
          <select [ngModel]="statut()" (ngModelChange)="statut.set($event); page.set(1); load()">
            <option value="">Tous</option>
            <option value="RESERVEE">Réservée</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </label>

        <label>
          <span>Période · Début</span>
          <input type="date" [ngModel]="dateDebut()" (ngModelChange)="dateDebut.set($event); page.set(1); load()" />
        </label>

        <label>
          <span>Période · Fin</span>
          <input type="date" [ngModel]="dateFin()" (ngModelChange)="dateFin.set($event); page.set(1); load()" />
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>RÉF.</th>
              <th>CLIENT</th>
              <th>VÉHICULE</th>
              <th>PÉRIODE</th>
              <th>TARIF / J</th>
              <th>MONTANT TOTAL</th>
              <th>PÉNALITÉ</th>
              <th>STATUT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @for (r of paged(); track r.id) {
              <tr>
                <td><b>#{{ r.id }}</b></td>
                <td><a [routerLink]="['/clients', r.clientId]" class="inline-link">Client #{{ r.clientId }}</a></td>
                <td>Véhicule #{{ r.vehiculeId }}</td>
                <td>
                  {{ r.dateDebut }} → {{ r.dateFinPrevue }}
                  @if (r.dateRetourEffectif) {
                    <small class="ret-date">(retour {{ r.dateRetourEffectif }})</small>
                  }
                </td>
                <td>{{ r.prixJournalierApplique | number:'1.2-2' }} TND</td>
                <td><b>{{ r.montantTotal | number:'1.2-2' }} TND</b></td>
                <td>{{ r.penalite | number:'1.2-2' }} TND</td>
                <td>
                  <span class="badge" [ngClass]="statusClass(r.statut)">{{ r.statut }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    @if (r.statut === 'RESERVEE') {
                      <button class="btn-xs primary" (click)="depart(r)">Départ</button>
                      <button class="btn-xs danger" (click)="annuler(r)">Annuler</button>
                    }
                    @if (r.statut === 'EN_COURS') {
                      <a [routerLink]="['/locations', r.id, 'retour']" class="btn-xs primary">Retour</a>
                    }
                    @if (r.statut === 'TERMINEE') {
                      <a [routerLink]="['/locations', r.id, 'retour']" class="btn-xs">Reçu</a>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="empty-cell">
                  {{ loading() ? 'Chargement des locations…' : 'Aucune location ne correspond aux filtres.' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="pagination-bar">
        <div class="page-info">
          Page {{ page() }} sur {{ totalPages() }} · {{ filtered().length }} location(s)
        </div>
        <div class="page-controls">
          <button class="btn btn-outline" [disabled]="page() <= 1" (click)="page.set(page() - 1)">← Précédent</button>
          <button class="btn btn-outline" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">Suivant →</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .filter-panel { padding: 16px 20px; margin-bottom: 20px; }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .filter-grid label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #556972;
    }
    .filter-grid input, .filter-grid select {
      border: 1px solid #dbe4e8;
      border-radius: 7px;
      padding: 9px 10px;
      font-size: 12px;
      background: #fff;
    }
    .ret-date { display: block; font-size: 10px; color: #6b7d85; }
    .inline-link { color: #0f766e; font-weight: 600; text-decoration: none; }
    .inline-link:hover { text-decoration: underline; }
    .row-actions { display: flex; gap: 6px; }
    @media (max-width: 900px) {
      .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 550px) {
      .filter-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class LocationListComponent implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly rentals = signal<Location[]>([]);
  readonly search = signal('');
  readonly statut = signal<StatutLocation | ''>('');
  readonly dateDebut = signal('');
  readonly dateFin = signal('');
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.rentals();
    return this.rentals().filter((r) =>
      `#${r.id} client #${r.clientId} vehicule #${r.vehiculeId} ${r.statut}`.toLowerCase().includes(q)
    );
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.locationService
      .getAll({
        statut: this.statut() || undefined,
        dateDebut: this.dateDebut() || undefined,
        dateFin: this.dateFin() || undefined,
        size: 100,
      })
      .subscribe({
        next: (data) => {
          this.rentals.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  depart(r: Location): void {
    this.locationService.depart(r.id).subscribe({
      next: () => {
        this.toast.success(`Départ enregistré pour la location #${r.id}.`);
        this.load();
      },
    });
  }

  annuler(r: Location): void {
    if (!window.confirm(`Annuler la réservation #${r.id} ?`)) return;
    this.locationService.annuler(r.id).subscribe({
      next: () => {
        this.toast.success(`Réservation #${r.id} annulée.`);
        this.load();
      },
    });
  }

  statusClass(statut: StatutLocation): string {
    switch (statut) {
      case 'EN_COURS':
        return 'badge-green';
      case 'RESERVEE':
        return 'badge-blue';
      case 'ANNULEE':
        return 'badge-red';
      default:
        return 'badge-slate';
    }
  }
}
