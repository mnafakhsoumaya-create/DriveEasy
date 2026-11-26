import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Location, Statistiques } from '../../core/models/location.model';
import { Vehicule } from '../../core/models/vehicule.model';
import { LocationService } from '../../core/services/location.service';
import { VehiculeService } from '../../core/services/vehicule.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">TABLEAU DE BORD</p>
        <h1>Vue d’ensemble de l’agence</h1>
        <p class="subtitle">Suivi en temps réel du parc automobile, des locations et du chiffre d’affaires.</p>
      </div>
      <div class="header-actions">
        <a routerLink="/locations/new" class="btn btn-primary">+ Nouvelle location</a>
        <button class="btn btn-outline" (click)="load()" [disabled]="loading()">
          {{ loading() ? 'Chargement…' : '↻ Actualiser' }}
        </button>
      </div>
    </div>

    <!-- KPI Grid -->
    <section class="kpi-grid">
      <article class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">CHIFFRE D’AFFAIRES · MOIS</span>
          <span class="kpi-icon teal">TND</span>
        </div>
        <strong class="kpi-value">
          {{ stats()?.chiffreAffairesMoisCourant ?? 0 | number:'1.2-2' }}
          <small>TND</small>
        </strong>
        <span class="kpi-foot">
          CA total cumulé : {{ stats()?.chiffreAffairesTotal ?? 0 | number:'1.2-2' }} TND
        </span>
      </article>

      <article class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">LOCATIONS EN COURS</span>
          <span class="kpi-icon blue">↗</span>
        </div>
        <strong class="kpi-value">{{ stats()?.locationsEnCours ?? 0 }}</strong>
        <span class="kpi-foot">
          {{ stats()?.locationsReservees ?? 0 }} réservée(s) · {{ stats()?.locationsTerminees ?? 0 }} terminée(s)
        </span>
      </article>

      <article class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">TAUX D’OCCUPATION</span>
          <span class="kpi-icon amber">%</span>
        </div>
        <strong class="kpi-value">{{ stats()?.tauxOccupationParc ?? 0 | number:'1.1-1' }}<small>%</small></strong>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="stats()?.tauxOccupationParc ?? 0"></div>
        </div>
      </article>

      <article class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">ÉTAT DU PARC</span>
          <span class="kpi-icon slate">▣</span>
        </div>
        <strong class="kpi-value">{{ totalVehicules() }} <small>véhicules</small></strong>
        <span class="kpi-foot">
          <span class="dot available"></span>{{ availableCount() }} dispo ·
          <span class="dot rented"></span>{{ rentedCount() }} loués ·
          <span class="dot maintenance"></span>{{ maintenanceCount() }} maint.
        </span>
      </article>
    </section>

    <!-- Charts Row -->
    <section class="charts-grid">
      <!-- Fleet Donut Chart -->
      <article class="panel">
        <div class="panel-head">
          <div>
            <h2>Répartition du parc automobile</h2>
            <p>Disponibilité actuelle des véhicules</p>
          </div>
          <a routerLink="/vehicules" class="link-btn">Catalogue →</a>
        </div>
        <div class="donut-layout">
          <svg viewBox="0 0 120 120" class="donut-svg" aria-label="Répartition du parc">
            <circle cx="60" cy="60" r="46" fill="none" stroke="#edf2f4" stroke-width="14" />
            @if (totalVehicules() > 0) {
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#10b981"
                stroke-width="14"
                [attr.stroke-dasharray]="availDash() + ' ' + circumference"
                stroke-dashoffset="0"
                transform="rotate(-90 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#f59e0b"
                stroke-width="14"
                [attr.stroke-dasharray]="rentedDash() + ' ' + circumference"
                [attr.stroke-dashoffset]="-availDash()"
                transform="rotate(-90 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#ef4444"
                stroke-width="14"
                [attr.stroke-dasharray]="maintDash() + ' ' + circumference"
                [attr.stroke-dashoffset]="-(availDash() + rentedDash())"
                transform="rotate(-90 60 60)"
              />
            }
            <text x="60" y="57" text-anchor="middle" class="donut-center-num">{{ totalVehicules() }}</text>
            <text x="60" y="72" text-anchor="middle" class="donut-center-sub">VÉHICULES</text>
          </svg>

          <div class="donut-legend">
            <div class="legend-item">
              <span><i class="dot available"></i>Disponibles</span>
              <b>{{ availableCount() }}</b>
            </div>
            <div class="legend-item">
              <span><i class="dot rented"></i>Loués</span>
              <b>{{ rentedCount() }}</b>
            </div>
            <div class="legend-item">
              <span><i class="dot maintenance"></i>En maintenance</span>
              <b>{{ maintenanceCount() }}</b>
            </div>
          </div>
        </div>
      </article>

      <!-- Rental Status Breakdown + Top Vehicles -->
      <article class="panel">
        <div class="panel-head">
          <div>
            <h2>Activité des locations</h2>
            <p>Répartition par statut ({{ stats()?.totalLocations ?? 0 }} au total)</p>
          </div>
          <a routerLink="/locations" class="link-btn">Gérer →</a>
        </div>
        <div class="bars-box">
          @for (bar of rentalBars(); track bar.label) {
            <div class="bar-row">
              <div class="bar-meta">
                <span>{{ bar.label }}</span>
                <b>{{ bar.count }}</b>
              </div>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="bar.pct" [style.background]="bar.color"></div>
              </div>
            </div>
          }
        </div>
      </article>
    </section>

    <!-- Bottom Row: Recent Locations & Top Vehicles -->
    <section class="bottom-grid">
      <article class="panel">
        <div class="panel-head">
          <div>
            <h2>Locations récentes</h2>
            <p>Dernières opérations enregistrées</p>
          </div>
          <a routerLink="/locations" class="link-btn">Tout voir →</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>RÉF.</th>
                <th>CLIENT</th>
                <th>VÉHICULE</th>
                <th>PÉRIODE</th>
                <th>MONTANT</th>
                <th>STATUT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of recentRentals(); track r.id) {
                <tr>
                  <td><b>#{{ r.id }}</b></td>
                  <td><a [routerLink]="['/clients', r.clientId]" class="inline-link">Client #{{ r.clientId }}</a></td>
                  <td>Véhicule #{{ r.vehiculeId }}</td>
                  <td>{{ r.dateDebut }} → {{ r.dateFinPrevue }}</td>
                  <td><b>{{ r.montantTotal | number:'1.2-2' }} TND</b></td>
                  <td>
                    <span class="badge" [ngClass]="statusClass(r.statut)">{{ r.statut }}</span>
                  </td>
                  <td>
                    @if (r.statut === 'EN_COURS') {
                      <a [routerLink]="['/locations', r.id, 'retour']" class="btn-xs">Retour</a>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-cell">Aucune location enregistrée pour le moment.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <h2>Véhicules les plus loués</h2>
            <p>Classement par nombre de locations</p>
          </div>
        </div>
        <div class="top-list">
          @for (item of stats()?.topVehicules ?? []; track item.vehiculeId; let i = $index) {
            <div class="top-item">
              <div class="top-rank">{{ i + 1 }}</div>
              <div class="top-info">
                <strong>{{ item.description }}</strong>
                <span>{{ item.nombreLocations }} location(s)</span>
              </div>
              <div class="top-rev">{{ item.chiffreGenere | number:'1.2-2' }} TND</div>
            </div>
          } @empty {
            <p class="empty-cell">Pas encore de données statistiques.</p>
          }
        </div>
      </article>
    </section>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #fff;
      border: 1px solid #e5ecef;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 1px 2px rgba(16, 43, 58, 0.03);
    }
    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #6b7d85;
    }
    .kpi-icon {
      font-size: 10px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .kpi-icon.teal { background: #e6f6f0; color: #0f766e; }
    .kpi-icon.blue { background: #e8f1fb; color: #2563eb; }
    .kpi-icon.amber { background: #fef3c7; color: #b45309; }
    .kpi-icon.slate { background: #edf2f4; color: #334155; }
    .kpi-value {
      font-family: 'Manrope', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #102b3a;
      line-height: 1.1;
    }
    .kpi-value small {
      font-size: 13px;
      font-weight: 600;
      color: #6b7d85;
      margin-left: 4px;
    }
    .kpi-foot {
      font-size: 11px;
      color: #71838b;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .progress-bar {
      height: 7px;
      background: #edf2f4;
      border-radius: 999px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #0d9488);
      border-radius: 999px;
      transition: width 0.35s ease;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .bottom-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr);
      gap: 16px;
    }
    .donut-layout {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .donut-svg {
      width: 140px;
      height: 140px;
      flex-shrink: 0;
    }
    .donut-center-num {
      font-family: 'Manrope', sans-serif;
      font-size: 22px;
      font-weight: 800;
      fill: #102b3a;
    }
    .donut-center-sub {
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 0.1em;
      fill: #7d8f97;
    }
    .donut-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .legend-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid #f0f4f5;
      font-size: 13px;
      color: #3c535d;
    }
    .legend-item:last-child { border-bottom: 0; padding-bottom: 0; }
    .bars-box {
      padding: 18px 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .bar-row { display: flex; flex-direction: column; gap: 6px; }
    .bar-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #415862;
    }
    .bar-track {
      height: 8px;
      background: #eff3f5;
      border-radius: 999px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.35s ease;
    }
    .top-list {
      padding: 12px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .top-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: #f8fafb;
      border-radius: 8px;
      border: 1px solid #edf2f4;
    }
    .top-rank {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #102b3a;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .top-info { flex: 1; min-width: 0; }
    .top-info strong { display: block; font-size: 12px; color: #102b3a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .top-info span { font-size: 11px; color: #6e8189; }
    .top-rev { font-size: 12px; font-weight: 700; color: #0f766e; white-space: nowrap; }
    .inline-link { color: #0f766e; font-weight: 600; text-decoration: none; }
    .inline-link:hover { text-decoration: underline; }
    @media (max-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .charts-grid, .bottom-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .donut-layout { flex-direction: column; align-items: stretch; }
      .donut-svg { margin: 0 auto; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly vehiculeService = inject(VehiculeService);
  private readonly locationService = inject(LocationService);

  readonly loading = signal(false);
  readonly vehicules = signal<Vehicule[]>([]);
  readonly rentals = signal<Location[]>([]);
  readonly stats = signal<Statistiques | null>(null);

  readonly circumference = 2 * Math.PI * 46;

  readonly totalVehicules = computed(() => this.vehicules().length);
  readonly availableCount = computed(() => this.vehicules().filter((v) => v.statut === 'DISPONIBLE').length);
  readonly rentedCount = computed(() => this.vehicules().filter((v) => v.statut === 'LOUE').length);
  readonly maintenanceCount = computed(() => this.vehicules().filter((v) => v.statut === 'MAINTENANCE').length);

  readonly availDash = computed(() =>
    this.totalVehicules() ? (this.availableCount() / this.totalVehicules()) * this.circumference : 0
  );
  readonly rentedDash = computed(() =>
    this.totalVehicules() ? (this.rentedCount() / this.totalVehicules()) * this.circumference : 0
  );
  readonly maintDash = computed(() =>
    this.totalVehicules() ? (this.maintenanceCount() / this.totalVehicules()) * this.circumference : 0
  );

  readonly recentRentals = computed(() => this.rentals().slice(0, 6));

  readonly rentalBars = computed(() => {
    const s = this.stats();
    const total = Math.max(s?.totalLocations ?? 0, 1);
    return [
      { label: 'Réservées', count: s?.locationsReservees ?? 0, pct: ((s?.locationsReservees ?? 0) / total) * 100, color: '#3b82f6' },
      { label: 'En cours', count: s?.locationsEnCours ?? 0, pct: ((s?.locationsEnCours ?? 0) / total) * 100, color: '#10b981' },
      { label: 'Terminées', count: s?.locationsTerminees ?? 0, pct: ((s?.locationsTerminees ?? 0) / total) * 100, color: '#64748b' },
      { label: 'Annulées', count: s?.locationsAnnulees ?? 0, pct: ((s?.locationsAnnulees ?? 0) / total) * 100, color: '#ef4444' },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      vehicules: this.vehiculeService.getAll(),
      rentals: this.locationService.getAll({ size: 50 }),
      stats: this.locationService.getStatistiques(),
    }).subscribe({
      next: ({ vehicules, rentals, stats }) => {
        this.vehicules.set(vehicules);
        this.rentals.set(rentals);
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusClass(statut: string): string {
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
