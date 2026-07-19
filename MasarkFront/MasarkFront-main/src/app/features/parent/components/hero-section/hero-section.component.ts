import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative flex items-center justify-start h-80 rounded-3xl overflow-hidden mb-8 shadow-premium group/hero border border-white/20">
      <!-- Background Image with zoom on hover -->
      <div 
        class="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover/hero:scale-105"
        style="background-image: url('assets/images/parent_dashboard_hero.jpg');"
      ></div>
      
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent dark:from-slate-900/95 dark:via-slate-900/80 dark:to-transparent transition-colors duration-300"></div>
      
      <!-- Content Panel (Glassmorphism card inside) -->
      <div class="relative z-10 max-w-2xl px-8 md:px-12 flex flex-col justify-center h-full text-right" dir="rtl">
        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50 mb-4 w-fit animate-pulse">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          مرحباً بك في مسارك
        </span>
        <h1 class="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight mb-3">
          مرحباً بك في لوحة تحكم ولي الأمر
        </h1>
        <p class="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          كل الأدوات التي تحتاجها لمتابعة وتوجيه مسيرة طفلك التعليمية وتنمية مهاراته في مكان واحد.
        </p>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class HeroSectionComponent {}
