import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative flex items-center justify-start h-80 rounded-3xl overflow-hidden mb-8 shadow-premium group/hero border border-white/20">
      <!-- Background Image taking the full hero section -->
      <div 
        class="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover/hero:scale-105"
        style="background-image: url('assets/images/parent-hero.png');"
      ></div>
      
      <!-- Gradient overlay (Darker on the right where text is, fading out to the left) -->
      <div class="absolute inset-0 bg-gradient-to-l from-white/95 via-white/70 to-white/10 dark:from-slate-900/95 dark:via-slate-900/80 dark:to-transparent transition-colors duration-300"></div>
      
      <!-- Content Panel -->
      <div class="relative z-10 max-w-2xl px-8 md:px-12 flex flex-col justify-center h-full text-right" dir="rtl">
        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 mb-4 w-fit animate-pulse backdrop-blur-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          مرحباً بك في مسارك
        </span>
        <h1 class="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight mb-3 drop-shadow-sm">
          مرحباً بك في لوحة تحكم ولي الأمر
        </h1>
        <p class="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-semibold drop-shadow-sm">
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
