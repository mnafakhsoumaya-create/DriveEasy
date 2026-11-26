import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import {
  BoiteVitesse,
  Carburant,
  CategorieVehicule,
  StatutVehicule,
  VehiculeRequest,
} from '../../core/models/vehicule.model';
import { ToastService } from '../../core/services/toast.service';
import { VehiculeService } from '../../core/services/vehicule.service';

@Component({
  selector: 'app-vehicule-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">PARC AUTOMOBILE</p>
        <h1>{{ isEdit() ? 'Modifier le véhicule' : 'Nouveau véhicule' }}</h1>
        <p class="subtitle">Formulaire réactif avec validation des règles métier.</p>
      </div>
      <div class="header-actions">
        <a routerLink="/vehicules" class="btn btn-outline">← Retour au catalogue</a>
      </div>
    </div>

    <section class="panel form-card">
      <form [formGroup]="form" (ngSubmit)="submit()" class="form-layout">
        <div class="fields-grid">
          <label class="field">
            <span>Immatriculation *</span>
            <input type="text" formControlName="immatriculation" placeholder="Ex: 215 TUN 4821" />
            @if (invalid('immatriculation')) {
              <small class="err">L’immatriculation est obligatoire.</small>
            }
          </label>

          <label class="field">
            <span>Marque *</span>
            <input type="text" formControlName="marque" placeholder="Ex: Peugeot" />
            @if (invalid('marque')) {
              <small class="err">La marque est obligatoire.</small>
            }
          </label>

          <label class="field">
            <span>Modèle *</span>
            <input type="text" formControlName="modele" placeholder="Ex: 208" />
            @if (invalid('modele')) {
              <small class="err">Le modèle est obligatoire.</small>
            }
          </label>

          <label class="field">
            <span>Année *</span>
            <input type="number" formControlName="annee" />
            @if (invalid('annee')) {
              <small class="err">Année valide requise (1990 à {{ currentYear }}).</small>
            }
          </label>

          <label class="field">
            <span>Couleur *</span>
            <input type="text" formControlName="couleur" placeholder="Ex: Blanc" />
            @if (invalid('couleur')) {
              <small class="err">La couleur est obligatoire.</small>
            }
          </label>

          <label class="field">
            <span>Catégorie *</span>
            <select formControlName="categorie">
              <option value="ECONOMIQUE">Économique</option>
              <option value="BERLINE">Berline</option>
              <option value="SUV">SUV</option>
              <option value="LUXE">Luxe</option>
              <option value="UTILITAIRE">Utilitaire</option>
            </select>
          </label>

          <label class="field">
            <span>Carburant *</span>
            <select formControlName="carburant">
              <option value="ESSENCE">Essence</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRIDE">Hybride</option>
              <option value="ELECTRIQUE">Électrique</option>
            </select>
          </label>

          <label class="field">
            <span>Boîte de vitesses *</span>
            <select formControlName="boite">
              <option value="MANUELLE">Manuelle</option>
              <option value="AUTOMATIQUE">Automatique</option>
            </select>
          </label>

          <label class="field">
            <span>Nombre de places *</span>
            <input type="number" formControlName="nbPlaces" />
            @if (invalid('nbPlaces')) {
              <small class="err">Minimum 1 place.</small>
            }
          </label>

          <label class="field">
            <span>Kilométrage (km) *</span>
            <input type="number" formControlName="kilometrage" />
            @if (invalid('kilometrage')) {
              <small class="err">Le kilométrage doit être ≥ 0.</small>
            }
          </label>

          <label class="field">
            <span>Prix journalier (TND) *</span>
            <input type="number" step="0.01" formControlName="prixJournalier" />
            @if (invalid('prixJournalier')) {
              <small class="err">Le tarif journalier doit être strictement positif.</small>
            }
          </label>

          @if (isEdit()) {
            <label class="field">
              <span>Statut du véhicule</span>
              <select formControlName="statut">
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="LOUE">LOUE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </label>
          }

          <label class="field full-span">
            <span>Image (URL)</span>
            <input type="url" formControlName="imageUrl" placeholder="https://..." />
          </label>
        </div>

        @if (form.value.imageUrl) {
          <div class="preview-box">
            <span>Aperçu de l’image</span>
            <img [src]="form.value.imageUrl" alt="Aperçu du véhicule" />
          </div>
        }

        <div class="form-footer">
          <a routerLink="/vehicules" class="btn btn-outline">Annuler</a>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Enregistrement…' : isEdit() ? 'Mettre à jour' : 'Créer le véhicule' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .form-card { padding: 24px; }
    .form-layout { display: flex; flex-direction: column; gap: 20px; }
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #3f555f;
    }
    .field.full-span { grid-column: 1 / -1; }
    .field input, .field select {
      border: 1px solid #d5e0e5;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      color: #102b3a;
      background: #fff;
    }
    .field input.ng-invalid.ng-touched {
      border-color: #ef4444;
      background: #fffafa;
    }
    .err { color: #dc2626; font-size: 11px; font-weight: 500; }
    .preview-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
      color: #6b7d85;
    }
    .preview-box img {
      max-width: 320px;
      max-height: 180px;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid #e5ecef;
    }
    .form-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 12px;
      border-top: 1px solid #edf2f4;
    }
    @media (max-width: 900px) {
      .fields-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .fields-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class VehiculeFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vehiculeService = inject(VehiculeService);
  private readonly toast = inject(ToastService);

  readonly currentYear = new Date().getFullYear();
  readonly isEdit = signal(false);
  readonly saving = signal(false);
  private vehicleId: number | null = null;
  private submitted = false;

  readonly form = this.fb.group({
    immatriculation: ['', [Validators.required]],
    marque: ['', [Validators.required]],
    modele: ['', [Validators.required]],
    annee: [this.currentYear, [Validators.required, Validators.min(1990), Validators.max(this.currentYear)]],
    couleur: ['', [Validators.required]],
    categorie: ['ECONOMIQUE' as CategorieVehicule, [Validators.required]],
    carburant: ['ESSENCE' as Carburant, [Validators.required]],
    boite: ['MANUELLE' as BoiteVitesse, [Validators.required]],
    nbPlaces: [5, [Validators.required, Validators.min(1)]],
    kilometrage: [0, [Validators.required, Validators.min(0)]],
    prixJournalier: [120, [Validators.required, Validators.min(0.01)]],
    statut: ['DISPONIBLE' as StatutVehicule],
    imageUrl: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.vehicleId = Number(idParam);
      this.isEdit.set(true);
      this.vehiculeService.getById(this.vehicleId).subscribe({
        next: (v) => {
          this.form.patchValue(v);
          this.form.markAsPristine();
        },
      });
    }
  }

  invalid(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitted;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: VehiculeRequest = {
      immatriculation: raw.immatriculation!.trim(),
      marque: raw.marque!.trim(),
      modele: raw.modele!.trim(),
      annee: Number(raw.annee),
      couleur: raw.couleur!.trim(),
      categorie: raw.categorie as CategorieVehicule,
      carburant: raw.carburant as Carburant,
      boite: raw.boite as BoiteVitesse,
      nbPlaces: Number(raw.nbPlaces),
      kilometrage: Number(raw.kilometrage),
      prixJournalier: Number(raw.prixJournalier),
      statut: raw.statut as StatutVehicule,
      imageUrl: raw.imageUrl?.trim() || undefined,
    };

    const req$ =
      this.isEdit() && this.vehicleId != null
        ? this.vehiculeService.update(this.vehicleId, payload)
        : this.vehiculeService.create(payload);

    req$.subscribe({
      next: () => {
        this.submitted = true;
        this.saving.set(false);
        this.toast.success(this.isEdit() ? 'Véhicule mis à jour.' : 'Véhicule ajouté au parc.');
        this.router.navigate(['/vehicules']);
      },
      error: () => this.saving.set(false),
    });
  }
}
