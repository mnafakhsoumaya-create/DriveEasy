import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

@Injectable({ providedIn: 'root' })
export class GatewayStatusService {
  readonly status = signal<'connecting' | 'online' | 'offline'>('connecting');
  readonly lastError = signal<string | null>(null);

  markOnline(): void {
    this.status.set('online');
    this.lastError.set(null);
  }

  markOffline(message: string): void {
    this.status.set('offline');
    this.lastError.set(message);
  }
}

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const gatewayStatus = inject(GatewayStatusService);
  const toast = inject(ToastService);

  return next(req).pipe(
    tap(() => {
      if (req.url.includes('localhost:8080')) {
        gatewayStatus.markOnline();
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        const msg =
          "Impossible de joindre l'API Gateway (localhost:8080). Vérifiez que les microservices sont démarrés.";
        gatewayStatus.markOffline(msg);
        toast.error(msg);
        return throwError(() => new Error(msg));
      }

      const backendMsg =
        error.error?.message ||
        error.error?.error ||
        (typeof error.error === 'string' ? error.error : null) ||
        `Erreur ${error.status} lors de la requête.`;

      toast.error(backendMsg);
      return throwError(() => new Error(backendMsg));
    })
  );
};
