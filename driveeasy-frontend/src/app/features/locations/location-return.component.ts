import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location, LocationDetail } from '../../core/models/location.model';
import { LocationService } from '../../core/services/location.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-location-return',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header no-print">
      <div>
        <p class="eyebrow">RETOUR DE VÉHICULE</p>
        <h1>Location #{{ detail()?.id ?? '…' }}</h1>
        <p class="subtitle">Saisie du kilométrage, calcul des pénalités et récapitulatif imprimable.</p>
      </div>
      <div class="header-actions">
        <a routerLink="/locations" class="btn btn-outline">← Retour aux locations</a>
      </div>
    </div>

    @if (detail(); as d) {
      @if (!completed() && d.statut === 'EN_COURS') {
        <section class="panel return-panel no-print">
          <div class="panel-head">
            <div>
              <h2>Enregistrer le retour du véhicule</h2>
              <p>
                {{ d.vehicule ? d.vehicule.marque + ' ' + d.vehicule.modele + ' (' + d.vehicule.immatriculation + ')' : 'Véhicule #' + d.vehiculeId }}
                · Client : {{ d.client ? d.client.prenom + ' ' + d.client.nom : '#' + d.clientId }}
              </p>
            </div>
          </div>

          <div class="return-grid">
            <div class="info-tile">
              <span>Kilométrage départ</span>
              <strong>{{ d.kmDepart | number }} km</strong>
            </div>
            <div class="info-tile">
              <span>Date fin prévue</span>
              <strong>{{ d.dateFinPrevue }}</strong>
            </div>
            <div class="info-tile">
              <span>Tarif journalier appliqué</span>
              <strong>{{ d.prixJournalierApplique | number:'1.2-2' }} TND</strong>
            </div>
          </div>

          <div class="form-row">
            <label>
              <span>Kilométrage au retour (km) *</span>
              <input type="number" [min]="d.kmDepart" [ngModel]="kmRetour()" (ngModelChange)="kmRetour.set(+$event)" />
            </label>
            <label>
              <span>Date de retour effectif *</span>
              <input type="date" [ngModel]="dateRetourEffectif()" (ngModelChange)="dateRetourEffectif.set($event)" />
            </label>
          </div>

          <div class="preview-penalty" [class.late]="estimatedLateDays() > 0">
            @if (estimatedLateDays() > 0) {
              <strong>⚠ Retard estimé : {{ estimatedLateDays() }} jour(s)</strong>
              <span>Pénalité estimée (1,5 × tarif/j) : {{ estimatedPenalty() | number:'1.2-2' }} TND</span>
            } @else {
              <strong>✓ Retour dans les délais</strong>
              <span>Aucune pénalité de retard prévue.</span>
            }
          </div>

          <div class="return-actions">
            <button
              class="btn btn-primary"
              [disabled]="saving() || kmRetour() < d.kmDepart"
              (click)="submitReturn()"
            >
              {{ saving() ? 'Validation…' : 'Confirmer le retour & calculer la facture' }}
            </button>
          </div>
        </section>
      }

      @if (completed() || d.statut === 'TERMINEE') {
        <section class="panel receipt-sheet">
          <div class="receipt-header">
            <div>
              <h2>DriveEasy — Récapitulatif de location</h2>
              <p>Location #{{ finalRecord()?.id ?? d.id }} · Statut : {{ finalRecord()?.statut ?? d.statut }}</p>
            </div>
            <button class="btn btn-outline no-print" (click)="print()">🖨 Imprimer le reçu</button>
          </div>

          <div class="receipt-grid">
            <div>
              <span>Client</span>
              <strong>{{ d.client ? d.client.prenom + ' ' + d.client.nom : 'Client #' + d.clientId }}</strong>
              @if (d.client) {
                <small>{{ d.client.cin }} · {{ d.client.email }}</small>
              }
            </div>
            <div>
              <span>Véhicule</span>
              <strong>{{ d.vehicule ? d.vehicule.marque + ' ' + d.vehicule.modele : 'Véhicule #' + d.vehiculeId }}</strong>
              @if (d.vehicule) {
                <small>{{ d.vehicule.immatriculation }} · {{ d.vehicule.categorie }}</small>
              }
            </div>
            <div>
              <span>Période prévue</span>
              <strong>{{ d.dateDebut }} → {{ d.dateFinPrevue }}</strong>
            </div>
            <div>
              <span>Retour effectif</span>
              <strong>{{ finalRecord()?.dateRetourEffectif ?? d.dateRetourEffectif ?? '—' }}</strong>
            </div>
            <div>
              <span>Kilométrage</span>
              <strong>
                {{ d.kmDepart | number }} km → {{ (finalRecord()?.kmRetour ?? d.kmRetour ?? 0) | number }} km
                ({{ ((finalRecord()?.kmRetour ?? d.kmRetour ?? d.kmDepart) - d.kmDepart) | number }} km parcourus)
              </strong>
            </div>
            <div>
              <span>Pénalité de retard</span>
              <strong>{{ (finalRecord()?.penalite ?? d.penalite) | number:'1.2-2' }} TND</strong>
            </div>
          </div>

          <div class="receipt-total">
            <span>Montant final facturé</span>
            <strong>{{ (finalRecord()?.montantTotal ?? d.montantTotal) | number:'1.2-2' }} TND</strong>
          </div>
        </section>
      }
    }
  `,
  styles: [`
    .return-panel { padding-bottom: 24px; }
    .return-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      padding: 0 20px 20px;
    }
    .info-tile {
      background: #f8fafb;
      border: 1px solid #e5ecef;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .info-tile span { display: block; font-size: 11px; color: #6b7d85; margin-bottom: 4px; }
    .info-tile strong { font-size: 15px; color: #102b3a; }
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 260px));
      gap: 16px;
      padding: 0 20px 18px;
    }
    .form-row label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #415862;
    }
    .form-row input {
      border: 1px solid #d5e0e5;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
    }
    .preview-penalty {
      margin: 0 20px 20px;
      padding: 12px 16px;
      border-radius: 8px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .preview-penalty.late {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }
    .return-actions { padding: 0 20px; display: flex; justify-content: flex-end; }
    .receipt-sheet { padding: 28px; }
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 18px;
      border-bottom: 2px solid #102b3a;
      margin-bottom: 20px;
    }
    .receipt-header h2 { margin: 0 0 4px; font-family: 'Manrope', sans-serif; font-size: 20px; color: #102b3a; }
    .receipt-header p { margin: 0; font-size: 12px; color: #6b7d85; }
    .receipt-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      margin-bottom: 24px;
    }
    .receipt-grid span { display: block; font-size: 11px; color: #6b7d85; text-transform: uppercase; letter-spacing: 0.05em; }
    .receipt-grid strong { display: block; font-size: 14px; color: #102b3a; margin-top: 3px; }
    .receipt-grid small { display: block; font-size: 12px; color: #6b7d85; margin-top: 2px; }
    .receipt-total {
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .receipt-total span { font-size: 14px; font-weight: 700; color: #102b3a; }
    .receipt-total strong { font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 800; color: #0f766e; }
    @media (max-width: 750px) {
      .return-grid, .form-row, .receipt-grid { grid-template-columns: 1fr; }
    }
    @media print {
      .no-print { display: none !important; }
      .receipt-sheet { border: 0 !important; box-shadow: none !important; padding: 0; }
    }
  `],
})
export class LocationReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly locationService = inject(LocationService);
  private readonly toast = inject(ToastService);

  readonly detail = signal<LocationDetail | null>(null);
  readonly kmRetour = signal(0);
  readonly dateRetourEffectif = signal(new Date().toISOString().slice(0, 10));
  readonly saving = signal(false);
  readonly completed = signal(false);
  readonly finalRecord = signal<Location | null>(null);

  readonly estimatedLateDays = computed(() => {
    const d = this.detail();
    if (!d || !this.dateRetourEffectif()) return 0;
    const due = new Date(d.dateFinPrevue).getTime();
    const actual = new Date(this.dateRetourEffectif()).getTime();
    const diffDays = Math.floor((actual - due) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  });

  readonly estimatedPenalty = computed(() => {
    const d = this.detail();
    if (!d) return 0;
    return this.estimatedLateDays() * 1.5 * d.prixJournalierApplique;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.locationService.getById(id).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.kmRetour.set(d.kmRetour ?? d.kmDepart);
      },
    });
  }

  submitReturn(): void {
    const d = this.detail();
    if (!d) return;

    this.saving.set(true);
    this.locationService
      .retour(d.id, {
        kmRetour: this.kmRetour(),
        dateRetourEffectif: this.dateRetourEffectif(),
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.finalRecord.set(res);
          this.completed.set(true);
          this.toast.success(`Retour de la location #${d.id} enregistré.`);
        },
        error: () => this.saving.set(false),
      });
  }

  print(): void {
    window.print();
  }
}
