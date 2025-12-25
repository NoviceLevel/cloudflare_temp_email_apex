import { Component, Input, ElementRef, OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shadow-html',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (useFallback()) {
      <div [innerHTML]="htmlContent"></div>
    } @else {
      <div #shadowHost></div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ShadowHtmlComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() htmlContent: string = '';
  @ViewChild('shadowHost') shadowHostRef!: ElementRef<HTMLDivElement>;

  useFallback = signal(false);
  private shadowRoot: ShadowRoot | null = null;

  ngAfterViewInit() {
    if (typeof Element.prototype.attachShadow !== 'function') {
      console.warn('Shadow DOM is not supported in this browser, using innerHTML fallback');
      this.useFallback.set(true);
      return;
    }
    this.renderShadowDom();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['htmlContent'] && !changes['htmlContent'].firstChange) {
      this.renderShadowDom();
    }
  }

  ngOnDestroy() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
    }
    this.shadowRoot = null;
  }

  private renderShadowDom() {
    if (this.useFallback()) return;
    if (!this.shadowHostRef?.nativeElement) return;

    try {
      if (!this.shadowRoot) {
        try {
          this.shadowRoot = this.shadowHostRef.nativeElement.attachShadow({ mode: 'open' });
        } catch (error) {
          console.warn('Shadow DOM not supported, falling back to innerHTML:', error);
          this.useFallback.set(true);
          return;
        }
      }

      if (this.shadowRoot) {
        this.shadowRoot.innerHTML = this.htmlContent;
      }
    } catch (error) {
      console.error('Failed to render Shadow DOM, falling back to innerHTML:', error);
      this.useFallback.set(true);
    }
  }
}
