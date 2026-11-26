import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Client, EligibiliteResponse } from '../../core/models/client.model';
import { SimulationResponse } from '../../core/models/location.model';
import { Vehicule } from '../../core/models/vehicule.model';
import { ClientService } from '../../core/services/client.service';
import { LocationService } from '../../core/services/location.service';
import { ToastService } from '../../core/services/toast.service';
import { VehiculeService } from '../../core/services/vehicule.service';

@Component({
  selector: 'app-location-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">NOUVELLE RÉSERVATION</p>
        <h1>Assistant de location</h1>
        <p class="subtitle">Client → Période → Véhicule disponible → Simulation → Confirmation</p>
      </div>
      <div class="header-actions">
        <a routerLink="/locations" class="btn btn-outline">← Retour aux locations</a>
      </div>
    </div>

    <!-- Stepper -->
    <nav class="stepper" aria-label="Étapes de réservation">
      @for (s of steps; track s.num) {
        <div class="step-item" [class.active]="step() === s.num" [class.done]="step() > s.num">
          <span class="step-num">{{ step() > s.num ? '✓' : s.num }}</span>
          <span class="step-label">{{ s.label }}</span>
        </div>
      }
    </nav>

    <section class="panel wizard-panel">
      <!-- STEP 1: CLIENT -->
      @if (step() === 1) {
        <div class="step-body">
          <h2>1. Sélectionner le client</h2>
          <p class="step-desc">L’éligibilité du client (âge ≥ 21 ans et permis valide) est vérifiée automatiquement.</p>

          <label class="wizard-field">
            <span>Client</span>
            <select [ngModel]="selectedClientId()" (ngModelChange)="onClientSelected($event)">
              <option [ngValue]="null">-- Choisir un client --</option>
              @for (c of clients(); track c.id) {
                <option [ngValue]="c.id">
                  {{ c.prenom }} {{ c.nom }} · CIN {{ c.cin }} ({{ c.categorieClient }})
                </option>
              }
            </select>
          </label>

          @if (checkingElig()) {
            <p class="muted">Vérification de l’éligibilité en cours…</p>
          } @else if (eligibilite(); as e) {
            <div class="elig-card" [class.ok]="e.eligible" [class.ko]="!e.eligible">
              <strong>{{ e.eligible ? '✓ Client éligible' : '✕ Client non éligible' }}</strong>
              <p>{{ e.motif }} (Âge : {{ e.age }} ans · Permis exp. : {{ e.dateExpirationPermis }})</p>
            </div>
          }

          <div class="wizard-actions">
            <button
              class="btn btn-primary"
              [disabled]="!selectedClientId() || !eligibilite()?.eligible"
              (click)="step.set(2)"
            >
              Continuer →
            </button>
          </div>
        </div>
      }

      <!-- STEP 2: PERIODE -->
      @if (step() === 2) {
        <div class="step-body">
          <h2>2. Définir la période de location</h2>
          <p class="step-desc">Choisissez les dates de départ et de retour prévu pour consulter les véhicules disponibles.</p>

          <div class="date-grid">
            <label class="wizard-field">
              <span>Date de début</span>
              <input type="date" [ngModel]="dateDebut()" (ngModelChange)="dateDebut.set($event)" />
            </label>
            <label class="wizard-field">
              <span>Date de fin prévue</span>
              <input type="date" [ngModel]="dateFinPrevue()" (ngModelChange)="dateFinPrevue.set($event)" />
            </label>
          </div>

          @if (!datesValid()) {
            <p class="err-msg">La date de fin prévue doit être postérieure ou égale à la date de début.</p>
          }

          <div class="wizard-actions">
            <button class="btn btn-outline" (click)="step.set(1)">← Précédent</button>
            <button class="btn btn-primary" [disabled]="!datesValid()" (click)="loadAvailableVehicles()">
              Rechercher les véhicules disponibles →
            </button>
          </div>
        </div>
      }

      <!-- STEP 3: VEHICULE DISPONIBLE -->
      @if (step() === 3) {
        <div class="step-body">
          <h2>3. Choisir un véhicule disponible</h2>
          <p class="step-desc">Véhicules libres du {{ dateDebut() }} au {{ dateFinPrevue() }}</p>

          @if (loadingVehicles()) {
            <p class="muted">Recherche des véhicules disponibles…</p>
          } @else if (availableVehicles().length === 0) {
            <div class="elig-card ko">
              <strong>Aucun véhicule disponible sur cette période.</strong>
              <p>Modifiez les dates ou vérifiez le statut du parc.</p>
            </div>
          } @else {
            <div class="pick-grid">
              @for (v of availableVehicles(); track v.id) {
                <article
                  class="pick-card"
                  [class.selected]="selectedVehicleId() === v.id"
                  (click)="selectVehicle(v)"
                >
                  <div class="pick-top">
                    <strong>{{ v.marque }} {{ v.modele }}</strong>
                    <span class="badge badge-slate">{{ v.categorie }}</span>
                  </div>
                  <p>{{ v.immatriculation }} · {{ v.carburant }} · {{ v.boite }}</p>
                  <div class="pick-price">{{ v.prixJournalier | number:'1.2-2' }} TND / jour</div>
                </article>
              }
            </div>
          }

          <div class="wizard-actions">
            <button class="btn btn-outline" (click)="step.set(2)">← Précédent</button>
            <button class="btn btn-primary" [disabled]="!selectedVehicleId()" (click)="runSimulation()">
              Simuler le tarif →
            </button>
          </div>
        </div>
      }

      <!-- STEP 4: SIMULATION -->
      @if (step() === 4) {
        <div class="step-body">
          <h2>4. Simulation du tarif &amp; kilométrage</h2>
          <p class="step-desc">Détail du calcul automatique (tarif journalier, coefficient catégorie, remise fidélité).</p>

          @if (simulating()) {
            <p class="muted">Calcul de la simulation en cours…</p>
          } @else if (simulation(); as sim) {
            <div class="sim-box">
              <div class="sim-row"><span>Durée de location</span><b>{{ sim.nombreJours }} jour(s)</b></div>
              <div class="sim-row"><span>Tarif journalier de base</span><b>{{ sim.prixJournalier | number:'1.2-2' }} TND</b></div>
              <div class="sim-row"><span>Coefficient catégorie ({{ sim.categorieVehicule }})</span><b>× {{ sim.coefficientCategorie }}</b></div>
              <div class="sim-row"><span>Montant brut</span><b>{{ sim.montantBrut | number:'1.2-2' }} TND</b></div>
              <div class="sim-row">
                <span>Remise fidélité ({{ sim.categorieClient }} · {{ (sim.tauxRemiseFidelite * 100) | number:'1.0-0' }}%)</span>
                <b class="discount">- {{ sim.montantRemise | number:'1.2-2' }} TND</b>
              </div>
              <div class="sim-total">
                <span>Total estimé</span>
                <strong>{{ sim.montantTotalEstime | number:'1.2-2' }} TND</strong>
              </div>
            </div>

            <label class="wizard-field km-field">
              <span>Kilométrage au départ (km)</span>
              <input type="number" min="0" [ngModel]="kmDepart()" (ngModelChange)="kmDepart.set(+$event)" />
            </label>
          }

          <div class="wizard-actions">
            <button class="btn btn-outline" (click)="step.set(3)">← Précédent</button>
            <button class="btn btn-primary" [disabled]="!simulation()" (click)="step.set(5)">
              Passer à la confirmation →
            </button>
          </div>
        </div>
      }

      <!-- STEP 5: CONFIRMATION -->
      @if (step() === 5) {
        <div class="step-body">
          <h2>5. Confirmer la réservation</h2>
          <p class="step-desc">Vérifiez le récapitulatif avant de valider la création de la location.</p>

          <div class="summary-grid">
            <div><span>Client</span><strong>{{ selectedClient()?.prenom }} {{ selectedClient()?.nom }}</strong></div>
            <div><span>Véhicule</span><strong>{{ selectedVehicle()?.marque }} {{ selectedVehicle()?.modele }} ({{ selectedVehicle()?.immatriculation }})</strong></div>
            <div><span>Période</span><strong>{{ dateDebut() }} → {{ dateFinPrevue() }}</strong></div>
            <div><span>Kilométrage départ</span><strong>{{ kmDepart() | number }} km</strong></div>
            <div><span>Montant estimé</span><strong class="total-hl">{{ simulation()?.montantTotalEstime | number:'1.2-2' }} TND</strong></div>
          </div>

          <div class="wizard-actions">
            <button class="btn btn-outline" (click)="step.set(4)">← Précédent</button>
            <button class="btn btn-primary" [disabled]="submitting()" (click)="confirm()">
              {{ submitting() ? 'Création en cours…' : '✓ Confirmer la réservation' }}
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .stepper {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 20px;
    }
    .step-item {
      background: #fff;
      border: 1px solid #e5ecef;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7d85;
    }
    .step-item.active {
      border-color: #0f766e;
      background: #f0fdfa;
      color: #0f766e;
    }
    .step-item.done {
      border-color: #a7f3d0;
      color: #059669;
    }
    .step-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e2e8f0;
      display: grid;
      place-items: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .step-item.active .step-num { background: #0f766e; color: #fff; }
    .step-item.done .step-num { background: #10b981; color: #fff; }
    .wizard-panel { padding: 26px; }
    .step-body h2 { margin: 0 0 6px; font-family: 'Manrope', sans-serif; font-size: 18px; color: #102b3a; }
    .step-desc { margin: 0 0 20px; font-size: 13px; color: #6b7d85; }
    .wizard-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #415862;
      max-width: 480px;
    }
    .wizard-field select, .wizard-field input {
      border: 1px solid #d5e0e5;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      background: #fff;
    }
    .date-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 240px));
      gap: 16px;
    }
    .elig-card {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 10px;
      max-width: 560px;
    }
    .elig-card.ok { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
    .elig-card.ko { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .elig-card strong { display: block; margin-bottom: 4px; font-size: 13px; }
    .elig-card p { margin: 0; font-size: 12px; }
    .pick-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .pick-card {
      border: 1px solid #dce5e9;
      border-radius: 10px;
      padding: 16px;
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .pick-card:hover { border-color: #0f766e; }
    .pick-card.selected {
      border-color: #0f766e;
      background: #f0fdfa;
      box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.15);
    }
    .pick-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
    .pick-card p { margin: 0 0 10px; font-size: 12px; color: #6b7d85; }
    .pick-price { font-family: 'Manrope', sans-serif; font-size: 16px; font-weight: 800; color: #0f766e; }
    .sim-box {
      background: #f8fafb;
      border: 1px solid #e5ecef;
      border-radius: 10px;
      padding: 18px 20px;
      max-width: 520px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sim-row { display: flex; justify-content: space-between; font-size: 13px; color: #415862; }
    .discount { color: #059669; }
    .sim-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #dbe4e8;
      font-size: 15px;
      color: #102b3a;
    }
    .sim-total strong { font-family: 'Manrope', sans-serif; font-size: 22px; color: #0f766e; }
    .km-field { margin-top: 16px; max-width: 240px; }
    .summary-grid {
      background: #f8fafb;
      border: 1px solid #e5ecef;
      border-radius: 10px;
      padding: 18px 20px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      max-width: 680px;
    }
    .summary-grid span { display: block; font-size: 11px; color: #6b7d85; margin-bottom: 3px; }
    .summary-grid strong { font-size: 14px; color: #102b3a; }
    .total-hl { color: #0f766e !important; font-size: 18px !important; }
    .wizard-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 26px;
      padding-top: 18px;
      border-top: 1px solid #edf2f4;
    }
    .err-msg { color: #dc2626; font-size: 12px; margin-top: 10px; }
    .muted { color: #6b7d85; font-size: 13px; }
    @media (max-width: 900px) {
      .stepper { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .pick-grid { grid-template-columns: 1fr; }
      .summary-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class LocationWizardComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly vehiculeService = inject(VehiculeService);
  private readonly locationService = inject(LocationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly steps = [
    { num: 1, label: 'Client' },
    { num: 2, label: 'Période' },
    { num: 3, label: 'Véhicule' },
    { num: 4, label: 'Simulation' },
    { num: 5, label: 'Confirmation' },
  ];

  readonly step = signal(1);
  readonly clients = signal<Client[]>([]);
  readonly selectedClientId = signal<number | null>(null);
  readonly checkingElig = signal(false);
  readonly eligibilite = signal<EligibiliteResponse | null>(null);

  private readonly today = new Date().toISOString().slice(0, 10);
  readonly dateDebut = signal(this.today);
  readonly dateFinPrevue = signal(this.today);

  readonly loadingVehicles = signal(false);
  readonly availableVehicles = signal<Vehicule[]>([]);
  readonly selectedVehicleId = signal<number | null>(null);

  readonly simulating = signal(false);
  readonly simulation = signal<SimulationResponse | null>(null);
  readonly kmDepart = signal(0);
  readonly submitting = signal(false);

  readonly selectedClient = computed(() =>
    this.clients().find((c) => c.id === this.selectedClientId()) ?? null
  );
  readonly selectedVehicle = computed(() =>
    this.availableVehicles().find((v) => v.id === this.selectedVehicleId()) ?? null
  );
  readonly datesValid = computed(
    () => !!this.dateDebut() && !!this.dateFinPrevue() && this.dateFinPrevue() >= this.dateDebut()
  );

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (data) => this.clients.set(data),
    });
  }

  onClientSelected(id: number | null): void {
    this.selectedClientId.set(id);
    this.eligibilite.set(null);
    if (!id) return;

    this.checkingElig.set(true);
    this.clientService.checkEligibilite(id).subscribe({
      next: (res) => {
        this.eligibilite.set(res);
        this.checkingElig.set(false);
      },
      error: () => this.checkingElig.set(false),
    });
  }

  loadAvailableVehicles(): void {
    this.step.set(3);
    this.loadingVehicles.set(true);
    this.selectedVehicleId.set(null);
    this.vehiculeService.getDisponibles(this.dateDebut(), this.dateFinPrevue()).subscribe({
      next: (list) => {
        this.availableVehicles.set(list);
        this.loadingVehicles.set(false);
      },
      error: () => this.loadingVehicles.set(false),
    });
  }

  selectVehicle(v: Vehicule): void {
    this.selectedVehicleId.set(v.id);
    this.kmDepart.set(v.kilometrage);
  }

  runSimulation(): void {
    const clientId = this.selectedClientId();
    const vehiculeId = this.selectedVehicleId();
    if (!clientId || !vehiculeId) return;

    this.step.set(4);
    this.simulating.set(true);
    this.simulation.set(null);
    this.locationService
      .simulate({
        clientId,
        vehiculeId,
        dateDebut: this.dateDebut(),
        dateFinPrevue: this.dateFinPrevue(),
      })
      .subscribe({
        next: (res) => {
          this.simulation.set(res);
          this.simulating.set(false);
        },
        error: () => this.simulating.set(false),
      });
  }

  confirm(): void {
    const clientId = this.selectedClientId();
    const vehiculeId = this.selectedVehicleId();
    if (!clientId || !vehiculeId) return;

    this.submitting.set(true);
    this.locationService
      .create({
        clientId,
        vehiculeId,
        dateDebut: this.dateDebut(),
        dateFinPrevue: this.dateFinPrevue(),
        kmDepart: this.kmDepart(),
      })
      .subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.toast.success(`Réservation #${created.id} créée avec succès.`);
          this.router.navigate(['/locations']);
        },
        error: () => this.submitting.set(false),
      });
  }
}
