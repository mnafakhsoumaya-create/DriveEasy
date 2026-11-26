import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (component?.hasUnsavedChanges && component.hasUnsavedChanges()) {
    return window.confirm(
      'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?'
    );
  }
  return true;
};
