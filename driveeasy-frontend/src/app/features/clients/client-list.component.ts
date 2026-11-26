import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategorieClient, Client, ClientRequest } from '../../core/models/client.model';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">CLIENTÈLE</p>
        <h1>Liste des clients</h1>
        <p class="subtitle">{{ filtered().length }} client(s) enregistré(s)</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" (click)="openCreate()">+ Nouveau client</button>
        <button class="btn btn-outline" (click)="load()">↻ Actualiser</button>
      </div>
    </div>

    @if (showForm()) {
      <section class="panel form-panel">
        <div class="panel-head">
          <div>
            <h2>{{ editingId() ? 'Modifier le client' : 'Créer un client' }}</h2>
            <p>CIN, email et numéro de permis doivent être uniques.</p>
          </div>
          <button class="btn btn-outline" type="button" (click)="showForm.set(false)">Fermer</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="saveClient()" class="client-form-grid">
          <label>
            <span>CIN *</span>
            <input type="text" formControlName="cin" placeholder="Ex: 09876543" />
          </label>
          <label>
            <span>Nom *</span>
            <input type="text" formControlName="nom" />
          </label>
          <label>
            <span>Prénom *</span>
            <input type="text" formControlName="prenom" />
          </label>
          <label>
            <span>Date de naissance *</span>
            <input type="date" formControlName="dateNaissance" />
          </label>
          <label>
            <span>Email *</span>
            <input type="email" formControlName="email" />
          </label>
          <label>
            <span>Téléphone *</span>
            <input type="text" formControlName="telephone" />
          </label>
          <label>
            <span>Adresse *</span>
            <input type="text" formControlName="adresse" />
          </label>
          <label>
            <span>N° de permis *</span>
            <input type="text" formControlName="numeroPermis" />
          </label>
          <label>
            <span>Expiration du permis *</span>
            <input type="date" formControlName="dateExpirationPermis" />
          </label>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" (click)="showForm.set(false)">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </section>
    }

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Répertoire clients</h2>
          <p>Recherche par nom, prénom, CIN ou email</p>
        </div>
        <input
          class="search-input"
          type="text"
          placeholder="Rechercher un client…"
          [ngModel]="search()"
          (ngModelChange)="search.set($event); page.set(1)"
        />
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>CIN</th>
              <th>CONTACT</th>
              <th>PERMIS</th>
              <th>CATÉGORIE</th>
              <th>STATUT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @for (c of paged(); track c.id) {
              <tr [class.row-alert]="isLicenseExpired(c)">
                <td>
                  <a [routerLink]="['/clients', c.id]" class="client-link">
                    <strong>{{ c.prenom }} {{ c.nom }}</strong>
                  </a>
                </td>
                <td>{{ c.cin }}</td>
                <td>
                  <div class="contact-cell">
                    <span>{{ c.email }}</span>
                    <small>{{ c.telephone }}</small>
                  </div>
                </td>
                <td>
                  <div class="contact-cell">
                    <span>{{ c.numeroPermis }}</span>
                    <small [class.expired-text]="isLicenseExpired(c)">
                      Exp. {{ c.dateExpirationPermis }}
                    </small>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="categoryClass(c.categorieClient)">
                    {{ c.categorieClient }}
                  </span>
                </td>
                <td>
                  @if (isLicenseExpired(c)) {
                    <span class="badge badge-red">⚠ Permis expiré</span>
                  } @else if (!c.eligible) {
                    <span class="badge badge-amber">Non éligible</span>
                  } @else {
                    <span class="badge badge-green">Éligible</span>
                  }
                </td>
                <td>
                  <div class="row-actions">
                    <a [routerLink]="['/clients', c.id]" class="btn-xs">Fiche</a>
                    <button class="btn-xs" (click)="openEdit(c)">Modifier</button>
                    <button class="btn-xs danger" (click)="remove(c)">Supprimer</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty-cell">
                  {{ loading() ? 'Chargement des clients…' : 'Aucun client trouvé.' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="pagination-bar">
        <div class="page-info">
          Page {{ page() }} sur {{ totalPages() }} · {{ filtered().length }} client(s)
        </div>
        <div class="page-controls">
          <button class="btn btn-outline" [disabled]="page() <= 1" (click)="page.set(page() - 1)">← Précédent</button>
          <button class="btn btn-outline" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">Suivant →</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .form-panel { margin-bottom: 20px; }
    .client-form-grid {
      padding: 0 20px 20px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .client-form-grid label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #485e67;
    }
    .client-form-grid input {
      border: 1px solid #d5e0e5;
      border-radius: 7px;
      padding: 9px 11px;
      font-size: 13px;
    }
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
    }
    .search-input {
      border: 1px solid #d5e0e5;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
      min-width: 240px;
    }
    .client-link {
      color: #102b3a;
      text-decoration: none;
    }
    .client-link:hover { color: #0f766e; text-decoration: underline; }
    .contact-cell { display: flex; flex-direction: column; gap: 2px; }
    .contact-cell small { color: #758890; font-size: 11px; }
    .expired-text { color: #dc2626 !important; font-weight: 700; }
    .row-alert { background: #fff8f8; }
    .row-actions { display: flex; gap: 6px; }
    @media (max-width: 900px) {
      .client-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .client-form-grid { grid-template-columns: 1fr; }
      .search-input { width: 100%; min-width: 0; }
    }
  `],
})
export class ClientListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly clients = signal<Client[]>([]);
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = 8;

  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.group({
    cin: ['', Validators.required],
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    dateNaissance: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.required],
    adresse: ['', Validators.required],
    numeroPermis: ['', Validators.required],
    dateExpirationPermis: ['', Validators.required],
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter((c) =>
      `${c.prenom} ${c.nom} ${c.cin} ${c.email} ${c.numeroPermis}`.toLowerCase().includes(q)
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
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  openEdit(c: Client): void {
    this.editingId.set(c.id);
    this.form.patchValue(c);
    this.showForm.set(true);
  }

  saveClient(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.saving.set(true);
    const payload = this.form.getRawValue() as ClientRequest;
    const id = this.editingId();
    const req$ = id != null ? this.clientService.update(id, payload) : this.clientService.create(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.success(id != null ? 'Client mis à jour.' : 'Client créé avec succès.');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  remove(c: Client): void {
    if (!window.confirm(`Supprimer le client ${c.prenom} ${c.nom} ?`)) return;
    this.clientService.delete(c.id).subscribe({
      next: () => {
        this.toast.success('Client supprimé.');
        this.load();
      },
    });
  }

  isLicenseExpired(c: Client): boolean {
    if (!c.dateExpirationPermis) return false;
    return c.dateExpirationPermis < new Date().toISOString().slice(0, 10);
  }

  categoryClass(cat: CategorieClient): string {
    if (cat === 'VIP') return 'badge-green';
    if (cat === 'FIDELE') return 'badge-blue';
    return 'badge-slate';
  }
}
