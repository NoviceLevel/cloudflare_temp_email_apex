import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeaderComponent } from './views/header/header.component';
import { FooterComponent } from './views/footer/footer.component';
import { GlobalStateService } from './services/global-state.service';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, MatProgressSpinnerModule],
  template: `
    <div class="app-container" [class.dark-theme]="state.isDark()">
      <!-- 全局加载遮罩 -->
      @if (state.loading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      }
      
      <app-header></app-header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1;
      padding: 16px 0;
    }
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .dark-theme {
      background-color: #121212;
      color: #ffffff;
    }
  `]
})
export class AppComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);

  async ngOnInit() {
    // 初始化时获取用户设置
    try {
      await this.api.getUserSettings();
    } catch (error) {
      console.error('getUserSettings error:', error);
    }
  }
}
