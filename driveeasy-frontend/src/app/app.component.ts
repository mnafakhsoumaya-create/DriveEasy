import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GatewayStatusService } from './core/interceptors/api-error.interceptor';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="mobileNavOpen()">
        <a routerLink="/dashboard" class="brand" (click)="mobileNavOpen.set(false)">
          Drive<span>Easy</span>
          <small>GESTION DE FLOTTE</small>
        </a>

        <p class="nav-label">ESPACE AGENCE</p>
        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" (click)="mobileNavOpen.set(false)">
            <span class="nav-ico">◫</span> Tableau de bord
          </a>
          <a routerLink="/vehicules" routerLinkActive="active" (click)="mobileNavOpen.set(false)">
            <span class="nav-ico">▣</span> Véhicules
          </a>
          <a routerLink="/locations" routerLinkActive="active" (click)="mobileNavOpen.set(false)">
            <span class="nav-ico">↗</span> Locations
          </a>
          <a routerLink="/clients" routerLinkActive="active" (click)="mobileNavOpen.set(false)">
            <span class="nav-ico">♙</span> Clients
          </a>
        </nav>

        <div class="nav-quick">
          <a routerLink="/locations/new" class="quick-cta" (click)="mobileNavOpen.set(false)">
            + Nouvelle location
          </a>
        </div>

        <div class="sidebar-foot">
          <div class="gw-status">
            <span
              class="gw-dot"
              [class.online]="gatewayStatus.status() === 'online'"
              [class.offline]="gatewayStatus.status() === 'offline'"
            ></span>
            <span>API Gateway</span>
            <b>
              {{
                gatewayStatus.status() === 'online'
                  ? 'Connectée'
                  : gatewayStatus.status() === 'offline'
                  ? 'Hors ligne'
                  : 'Connexion…'
              }}
            </b>
          </div>
          <small class="gw-port">localhost:8080/api</small>
        </div>
      </aside>

      <!-- Main Workspace -->
      <div class="main-area">
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-toggle" (click)="mobileNavOpen.set(!mobileNavOpen())" aria-label="Menu">
              ☰
            </button>
            <span class="crumb">DRIVEEASY · PORTAIL AGENCE</span>
          </div>
          <div class="topbar-right">
            <span class="agent-name">Agent d’agence</span>
            <strong class="agent-avatar">AG</strong>
          </div>
        </header>

        @if (gatewayStatus.status() === 'offline') {
          <div class="gateway-banner">
            <strong>⚠ Passerelle API inaccessible :</strong>
            {{ gatewayStatus.lastError() }}
          </div>
        }

        <main class="page-content">
          <router-outlet />
        </main>

        <footer class="app-footer">
          DriveEasy <span>·</span> Plateforme microservices Spring Cloud &amp; Angular 22
        </footer>
      </div>

      <!-- Toasts -->
      <div class="toast-stack" aria-live="polite">
        @for (t of toastService.toasts(); track t.id) {
          <div class="toast" [ngClass]="'toast-' + t.type" (click)="toastService.dismiss(t.id)">
            <span>{{ t.text }}</span>
            <button type="button" aria-label="Fermer">×</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      background: #f4f7f9;
    }
    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      width: 252px;
      background: #102b3a;
      color: #d4e0e5;
      padding: 26px 16px;
      display: flex;
      flex-direction: column;
      z-index: 40;
      transition: transform 0.2s ease;
    }
    .brand {
      font-family: 'Manrope', sans-serif;
      font-size: 25px;
      font-weight: 800;
      color: #fff;
      text-decoration: none;
      padding: 4px 12px 28px;
    }
    .brand span { color: #34d399; }
    .brand small {
      display: block;
      font-family: 'DM Sans', sans-serif;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 2px;
      color: #8ea6b0;
      margin-top: 3px;
    }
    .nav-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #7d96a1;
      margin: 0 12px 10px;
    }
    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-links a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 9px;
      color: #c2d4da;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .nav-links a:hover, .nav-links a.active {
      background: #1c4456;
      color: #fff;
    }
    .nav-ico { width: 18px; text-align: center; }
    .nav-quick {
      margin-top: 20px;
      padding: 0 6px;
    }
    .quick-cta {
      display: block;
      text-align: center;
      background: #0f766e;
      color: #fff;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      padding: 11px 14px;
      border-radius: 8px;
    }
    .quick-cta:hover { background: #0d9488; }
    .sidebar-foot {
      margin-top: auto;
      border-top: 1px solid #264756;
      padding: 16px 10px 0;
    }
    .gw-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .gw-status b { margin-left: auto; font-weight: 600; color: #94a3b8; }
    .gw-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f59e0b;
    }
    .gw-dot.online { background: #34d399; }
    .gw-dot.offline { background: #ef4444; }
    .gw-port { display: block; font-size: 10px; color: #7e97a3; margin-top: 4px; }
    .main-area {
      flex: 1;
      margin-left: 252px;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      height: 64px;
      background: #fff;
      border-bottom: 1px solid #e5ecef;
      padding: 0 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .menu-toggle {
      display: none;
      border: 1px solid #dbe4e8;
      background: #fff;
      border-radius: 7px;
      padding: 6px 10px;
      cursor: pointer;
    }
    .crumb {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #7d9098;
    }
    .topbar-right { display: flex; align-items: center; gap: 10px; }
    .agent-name { font-size: 12px; color: #4b626b; }
    .agent-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #e6f6f0;
      color: #0f766e;
      display: grid;
      place-items: center;
      font-size: 11px;
      font-weight: 800;
    }
    .gateway-banner {
      margin: 18px 36px 0;
      padding: 12px 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #991b1b;
      font-size: 12px;
    }
    .page-content {
      flex: 1;
      width: 100%;
      max-width: 1420px;
      margin: 0 auto;
      padding: 30px 36px;
    }
    .app-footer {
      text-align: center;
      padding: 20px;
      font-size: 11px;
      color: #8899a0;
    }
    .app-footer span { color: #10b981; margin: 0 6px; }
    .toast-stack {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 60;
      max-width: 380px;
    }
    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      box-shadow: 0 10px 25px rgba(16, 43, 58, 0.2);
      cursor: pointer;
    }
    .toast-success { background: #0f766e; }
    .toast-error { background: #dc2626; }
    .toast-info { background: #1e293b; }
    .toast button {
      border: 0;
      background: none;
      color: inherit;
      font-size: 16px;
      cursor: pointer;
    }
    @media (max-width: 960px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .main-area { margin-left: 0; }
      .menu-toggle { display: inline-flex; }
      .topbar { padding: 0 18px; }
      .page-content { padding: 20px 18px; }
    }
    @media print {
      .sidebar, .topbar, .app-footer, .toast-stack, .gateway-banner { display: none !important; }
      .main-area { margin-left: 0 !important; }
      .page-content { padding: 0 !important; }
    }
  `],
})
export class AppComponent {
  readonly gatewayStatus = inject(GatewayStatusService);
  readonly toastService = inject(ToastService);
  readonly mobileNavOpen = signal(false);
}
