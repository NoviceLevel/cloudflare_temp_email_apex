import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private snackBar = inject(MatSnackBar);

  success(message: string, duration = 3000) {
    this.snackBar.open(message, '关闭', {
      duration,
      panelClass: ['snackbar-success'],
      verticalPosition: 'top',
    });
  }

  error(message: string, duration = 5000) {
    this.snackBar.open(message, '关闭', {
      duration,
      panelClass: ['snackbar-error'],
      verticalPosition: 'top',
    });
  }

  info(message: string, duration = 3000) {
    this.snackBar.open(message, '关闭', {
      duration,
      panelClass: ['snackbar-info'],
      verticalPosition: 'top',
    });
  }
}
