import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GlobalStateService } from '../../../services/global-state.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="about-container">
      <mat-card appearance="outlined">
        <mat-card-content>
          <div [innerHTML]="state.announcement()"></div>
          <div class="loading-section">
            <mat-spinner diameter="40"></mat-spinner>
            <mat-chip color="primary" highlighted>M3 Expressive</mat-chip>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .about-container {
      display: flex;
      justify-content: center;
    }
    mat-card {
      max-width: 800px;
      width: 100%;
    }
    .loading-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 24px;
      gap: 16px;
    }
  `]
})
export class AboutComponent {
  state = inject(GlobalStateService);
}
