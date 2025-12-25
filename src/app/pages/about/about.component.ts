import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { I18nService } from '../../services/i18n.service';
import { StateService } from '../../services/state.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="about-container">
      <mat-card>
        <mat-card-content>
          <!-- Announcement -->
          @if (announcement()) {
            <div class="announcement" [innerHTML]="announcement()"></div>
          } @else {
            <div class="default-content">
              <p>Cloudflare Temp Email - A temporary email service powered by Cloudflare Workers.</p>
              <p>Built with Angular + Angular Material (M3)</p>
            </div>
          }

          <!-- Loading Indicators Demo -->
          <div class="loading-demo">
            <div class="loading-row">
              <div class="loading-item">
                <div class="morph-loader basic"></div>
                <div class="loading-label">Basic</div>
              </div>
              <div class="loading-item">
                <div class="morph-loader star"></div>
                <div class="loading-label">Star</div>
              </div>
              <div class="loading-item">
                <div class="morph-loader flower"></div>
                <div class="loading-label">Flower</div>
              </div>
              <div class="loading-item">
                <div class="morph-loader heart"></div>
                <div class="loading-label">Heart</div>
              </div>
            </div>
            <div class="loading-row">
              <div class="loading-item">
                <div class="morph-loader diamond"></div>
                <div class="loading-label">Diamond</div>
              </div>
              <div class="loading-item">
                <div class="morph-loader blob"></div>
                <div class="loading-label">Blob</div>
              </div>
              <div class="loading-item">
                <div class="morph-loader squircle"></div>
                <div class="loading-label">Squircle</div>
              </div>
              <div class="loading-item">
                <div class="morph-loader cross"></div>
                <div class="loading-label">Cross</div>
              </div>
            </div>
            <mat-chip-set>
              <mat-chip color="primary" highlighted>M3 Morph Variants</mat-chip>
            </mat-chip-set>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .about-container { max-width: 800px; margin: 0 auto; padding: 16px; }
    .announcement { margin-bottom: 24px; }
    .default-content { margin-bottom: 24px; }
    .default-content p { margin: 8px 0; color: var(--mat-sys-on-surface-variant); }
    .loading-demo { display: flex; flex-direction: column; align-items: center; gap: 24px; margin-top: 24px; }
    .loading-row { display: flex; gap: 32px; flex-wrap: wrap; justify-content: center; }
    .loading-item { text-align: center; }
    .loading-label { font-size: 12px; color: var(--mat-sys-on-surface-variant); margin-top: 8px; }
    
    .morph-loader {
      width: 48px;
      height: 48px;
      background: var(--mat-sys-primary);
      animation: morph 2s ease-in-out infinite;
    }
    
    .morph-loader.basic { border-radius: 50%; animation-name: morph-basic; }
    .morph-loader.star { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); animation-name: morph-star; }
    .morph-loader.flower { border-radius: 50%; animation-name: morph-flower; }
    .morph-loader.heart { clip-path: polygon(50% 100%, 0% 35%, 25% 0%, 50% 20%, 75% 0%, 100% 35%); animation-name: morph-heart; }
    .morph-loader.diamond { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); animation-name: morph-diamond; }
    .morph-loader.blob { border-radius: 50%; animation-name: morph-blob; }
    .morph-loader.squircle { border-radius: 25%; animation-name: morph-squircle; }
    .morph-loader.cross { clip-path: polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%); animation-name: morph-cross; }
    
    @keyframes morph-basic {
      0%, 100% { border-radius: 50%; transform: scale(1); }
      50% { border-radius: 25%; transform: scale(1.1); }
    }
    @keyframes morph-star {
      0%, 100% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
    }
    @keyframes morph-flower {
      0%, 100% { border-radius: 50% 0 50% 0; transform: rotate(0deg); }
      50% { border-radius: 0 50% 0 50%; transform: rotate(180deg); }
    }
    @keyframes morph-heart {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
    @keyframes morph-diamond {
      0%, 100% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(45deg) scale(1.1); }
    }
    @keyframes morph-blob {
      0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    }
    @keyframes morph-squircle {
      0%, 100% { border-radius: 25%; transform: rotate(0deg); }
      50% { border-radius: 50%; transform: rotate(90deg); }
    }
    @keyframes morph-cross {
      0%, 100% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(90deg) scale(1.1); }
    }
  `]
})
export class AboutComponent implements OnInit {
  private i18n = inject(I18nService);
  private state = inject(StateService);
  private sanitizer = inject(DomSanitizer);
  
  t = this.i18n.t;
  announcement = signal<SafeHtml | null>(null);

  ngOnInit() {
    const openSettings = this.state.openSettings();
    if (openSettings.announcement) {
      this.announcement.set(
        this.sanitizer.bypassSecurityTrustHtml(openSettings.announcement)
      );
    }
  }
}
