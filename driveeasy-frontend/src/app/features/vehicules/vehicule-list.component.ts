import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Carburant,
  CategorieVehicule,
  StatutVehicule,
  Vehicule,
} from '../../core/models/vehicule.model';
import { ToastService } from '../../core/services/toast.service';
import { VehiculeService } from '../../core/services/vehicule.service';

@Component({
  selector: 'app-vehicule-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">PARC AUTOMOBILE</p>
        <h1>Catalogue des véhicules</h1>
        <p class="subtitle">{{ filtered().length }} véhicule(s) correspondant aux critères</p>
      </div>
      <div class="header-actions">
        <a routerLink="/vehicules/new" class="btn btn-primary">+ Ajouter un véhicule</a>
        <button class="btn btn-outline" (click)="load()">↻ Actualiser</button>
      </div>
    </div>

    <!-- Filters Bar -->
    <section class="panel filter-panel">
      <div class="filter-grid">
        <label>
          <span>Recherche</span>
          <input
            type="text"
            placeholder="Marque, modèle, immatriculation…"
            [ngModel]="search()"
            (ngModelChange)="onFilterChange('search', $event)"
          />
        </label>

        <label>
          <span>Catégorie</span>
          <select [ngModel]="categorie()" (ngModelChange)="onFilterChange('categorie', $event)">
            <option value="">Toutes</option>
            <option value="ECONOMIQUE">Économique</option>
            <option value="BERLINE">Berline</option>
            <option value="SUV">SUV</option>
            <option value="LUXE">Luxe</option>
            <option value="UTILITAIRE">Utilitaire</option>
          </select>
        </label>

        <label>
          <span>Carburant</span>
          <select [ngModel]="carburant()" (ngModelChange)="onFilterChange('carburant', $event)">
            <option value="">Tous</option>
            <option value="ESSENCE">Essence</option>
            <option value="DIESEL">Diesel</option>
            <option value="HYBRIDE">Hybride</option>
            <option value="ELECTRIQUE">Électrique</option>
          </select>
        </label>

        <label>
          <span>Statut</span>
          <select [ngModel]="statut()" (ngModelChange)="onFilterChange('statut', $event)">
            <option value="">Tous</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="LOUE">Loué</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </label>

        <label>
          <span>Prix max / jour (TND)</span>
          <input
            type="number"
            min="0"
            placeholder="Ex: 250"
            [ngModel]="prixMax()"
            (ngModelChange)="onFilterChange('prixMax', $event)"
          />
        </label>

        <label>
          <span>Trier par</span>
          <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event); page.set(1)">
            <option value="prixAsc">Prix croissant</option>
            <option value="prixDesc">Prix décroissant</option>
            <option value="anneeDesc">Année (récent → ancien)</option>
            <option value="kmAsc">Kilométrage croissant</option>
            <option value="marqueAsc">Marque (A → Z)</option>
          </select>
        </label>
      </div>
    </section>

    <!-- Vehicle Card Grid -->
    @if (loading()) {
      <div class="empty-state panel">Chargement du catalogue…</div>
    } @else if (paged().length === 0) {
      <div class="empty-state panel">
        <p>Aucun véhicule ne correspond à votre recherche.</p>
        <button class="btn btn-outline" (click)="resetFilters()">Réinitialiser les filtres</button>
      </div>
    } @else {
      <section class="vehicle-grid">
        @for (v of paged(); track v.id) {
          <article class="vehicle-card">
            <div class="card-media">
              @if (v.imageUrl && !brokenImages().has(v.id)) {
                <img [src]="v.imageUrl" [alt]="v.marque + ' ' + v.modele" (error)="markBroken(v.id)" />
              } @else {
                <div class="media-placeholder">
                  <svg viewBox="0 0 64 36" fill="none" aria-hidden="true">
                    <path d="M8 24h48v4H8z" fill="#cbd5e1" />
                    <path d="M12 22l6-11h24l8 11H12z" stroke="#64748b" stroke-width="2.2" fill="#e2e8f0" />
                    <circle cx="20" cy="26" r="4.5" fill="#1e293b" />
                    <circle cx="44" cy="26" r="4.5" fill="#1e293b" />
                  </svg>
                  <span>{{ v.categorie }}</span>
                </div>
              }
              <span class="badge card-status" [ngClass]="statusClass(v.statut)">{{ v.statut }}</span>
              <span class="card-plate">{{ v.immatriculation }}</span>
            </div>

            <div class="card-body">
              <div class="card-title-row">
                <div>
                  <h3>{{ v.marque }} {{ v.modele }}</h3>
                  <p class="card-sub">{{ v.annee }} · {{ v.couleur }} · {{ v.categorie }}</p>
                </div>
                <div class="card-price">
                  <strong>{{ v.prixJournalier | number:'1.2-2' }}</strong>
                  <span>TND / jour</span>
                </div>
              </div>

              <div class="specs-row">
                <span>⛽ {{ v.carburant }}</span>
                <span>⚙ {{ v.boite }}</span>
                <span>👤 {{ v.nbPlaces }} pl.</span>
                <span>🛣 {{ v.kilometrage | number }} km</span>
              </div>

              <div class="card-actions">
                <a [routerLink]="['/vehicules', v.id, 'edit']" class="btn-xs">Modifier</a>
                @if (v.statut !== 'LOUE') {
                  <button
                    class="btn-xs"
                    (click)="toggleMaintenance(v)"
                    [title]="v.statut === 'DISPONIBLE' ? 'Passer en maintenance' : 'Remettre disponible'"
                  >
                    {{ v.statut === 'DISPONIBLE' ? 'Maintenance' : 'Disponible' }}
                  </button>
                }
                <button class="btn-xs danger" (click)="remove(v)">Supprimer</button>
              </div>
            </div>
          </article>
        }
      </section>

      <!-- Pagination -->
      <div class="pagination-bar">
        <div class="page-info">
          Page {{ page() }} sur {{ totalPages() }} · {{ filtered().length }} véhicule(s)
        </div>
        <div class="page-controls">
          <select [ngModel]="pageSize()" (ngModelChange)="pageSize.set(+$event); page.set(1)">
            <option [value]="6">6 / page</option>
            <option [value]="9">9 / page</option>
            <option [value]="12">12 / page</option>
          </select>
          <button class="btn btn-outline" [disabled]="page() <= 1" (click)="page.set(page() - 1)">← Précédent</button>
          <button class="btn btn-outline" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">Suivant →</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .filter-panel { padding: 16px 20px; margin-bottom: 20px; }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
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
      color: #102b3a;
      background: #fff;
    }
    .vehicle-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }
    .vehicle-card {
      background: #fff;
      border: 1px solid #e5ecef;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .vehicle-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(16, 43, 58, 0.06);
    }
    .card-media {
      position: relative;
      height: 170px;
      background: #f1f5f9;
      overflow: hidden;
    }
    .card-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .media-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
    }
    .media-placeholder svg { width: 84px; height: 48px; }
    .card-status {
      position: absolute;
      top: 12px;
      right: 12px;
    }
    .card-plate {
      position: absolute;
      bottom: 10px;
      left: 12px;
      background: rgba(16, 43, 58, 0.85);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 4px 8px;
      border-radius: 5px;
    }
    .card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }
    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }
    .card-title-row h3 {
      margin: 0;
      font-family: 'Manrope', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #102b3a;
    }
    .card-sub {
      margin: 3px 0 0;
      font-size: 11px;
      color: #70828a;
    }
    .card-price {
      text-align: right;
      flex-shrink: 0;
    }
    .card-price strong {
      display: block;
      font-family: 'Manrope', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #0f766e;
    }
    .card-price span {
      font-size: 10px;
      color: #70828a;
    }
    .specs-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 0;
      border-top: 1px solid #f0f4f5;
      border-bottom: 1px solid #f0f4f5;
      font-size: 11px;
      color: #4f646d;
    }
    .specs-row span {
      background: #f8fafb;
      padding: 4px 8px;
      border-radius: 5px;
    }
    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }
    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #6b7d85;
      font-size: 13px;
    }
    @media (max-width: 1150px) {
      .filter-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .vehicle-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 700px) {
      .filter-grid { grid-template-columns: 1fr; }
      .vehicle-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class VehiculeListComponent implements OnInit {
  private readonly vehiculeService = inject(VehiculeService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly vehicules = signal<Vehicule[]>([]);
  readonly brokenImages = signal<Set<number>>(new Set());

  readonly search = signal('');
  readonly categorie = signal<CategorieVehicule | ''>('');
  readonly carburant = signal<Carburant | ''>('');
  readonly statut = signal<StatutVehicule | ''>('');
  readonly prixMax = signal<number | null>(null);
  readonly sortBy = signal<'prixAsc' | 'prixDesc' | 'anneeDesc' | 'kmAsc' | 'marqueAsc'>('prixAsc');
  readonly page = signal(1);
  readonly pageSize = signal(6);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.categorie();
    const carb = this.carburant();
    const st = this.statut();
    const max = this.prixMax();

    const list = this.vehicules().filter((v) => {
      if (cat && v.categorie !== cat) return false;
      if (carb && v.carburant !== carb) return false;
      if (st && v.statut !== st) return false;
      if (max != null && max > 0 && v.prixJournalier > max) return false;
      if (q) {
        const hay = `${v.marque} ${v.modele} ${v.immatriculation} ${v.couleur}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sort = this.sortBy();
    return [...list].sort((a, b) => {
      if (sort === 'prixAsc') return a.prixJournalier - b.prixJournalier;
      if (sort === 'prixDesc') return b.prixJournalier - a.prixJournalier;
      if (sort === 'anneeDesc') return b.annee - a.annee;
      if (sort === 'kmAsc') return a.kilometrage - b.kilometrage;
      return `${a.marque} ${a.modele}`.localeCompare(`${b.marque} ${b.modele}`);
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.vehiculeService.getAll().subscribe({
      next: (data) => {
        this.vehicules.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(field: string, value: unknown): void {
    if (field === 'search') this.search.set(String(value ?? ''));
    if (field === 'categorie') this.categorie.set((value as CategorieVehicule) || '');
    if (field === 'carburant') this.carburant.set((value as Carburant) || '');
    if (field === 'statut') this.statut.set((value as StatutVehicule) || '');
    if (field === 'prixMax') this.prixMax.set(value === '' || value == null ? null : Number(value));
    this.page.set(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.categorie.set('');
    this.carburant.set('');
    this.statut.set('');
    this.prixMax.set(null);
    this.page.set(1);
  }

  markBroken(id: number): void {
    this.brokenImages.update((set) => new Set(set).add(id));
  }

  toggleMaintenance(v: Vehicule): void {
    const next: StatutVehicule = v.statut === 'DISPONIBLE' ? 'MAINTENANCE' : 'DISPONIBLE';
    this.vehiculeService.updateStatut(v.id, next).subscribe({
      next: () => {
        this.toast.success(`Statut de ${v.marque} ${v.modele} mis à jour (${next}).`);
        this.load();
      },
    });
  }

  remove(v: Vehicule): void {
    if (!window.confirm(`Supprimer le véhicule ${v.marque} ${v.modele} (${v.immatriculation}) ?`)) {
      return;
    }
    this.vehiculeService.delete(v.id).subscribe({
      next: () => {
        this.toast.success('Véhicule supprimé.');
        this.load();
      },
    });
  }

  statusClass(statut: StatutVehicule): string {
    if (statut === 'DISPONIBLE') return 'badge-green';
    if (statut === 'LOUE') return 'badge-amber';
    return 'badge-red';
  }
}
