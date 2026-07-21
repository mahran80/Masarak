import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class MasarakComponent implements AfterViewInit {
  heroImages: string[] = [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200'
  ];

  currentImageIndex = 0;
  currentImageUrl = () => this.heroImages[this.currentImageIndex];

  constructor(private host: ElementRef<HTMLElement>) {}

  // Moved out of the original inline <script> tag — Angular strips
  // <script> from templates, so this runs the same reveal-on-scroll
  // effect from the component instead.
  ngAfterViewInit(): void {
    const sections = this.host.nativeElement.querySelectorAll('section > div');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    sections.forEach((el) => {
      el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
      observer.observe(el);
    });
  }
}