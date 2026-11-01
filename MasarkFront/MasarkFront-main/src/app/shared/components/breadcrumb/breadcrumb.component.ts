import { Component, Input, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter, Subscription } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css'
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  private readonly _items = signal<BreadcrumbItem[]>([]);

  @Input()
  set items(val: BreadcrumbItem[]) {
    this._items.set(val || []);
  }
  get items(): BreadcrumbItem[] {
    return this._items();
  }

  @Input() theme: 'light' | 'dark' = 'light';

  readonly autoCrumbs = signal<BreadcrumbItem[]>([]);

  readonly activeCrumbs = computed(() => {
    const explicit = this._items();
    if (explicit && explicit.length > 0) {
      return explicit;
    }
    return this.autoCrumbs();
  });

  private routerSub?: Subscription;

  ngOnInit(): void {
    this.buildBreadcrumbs();
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.buildBreadcrumbs();
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private buildBreadcrumbs(): void {
    const crumbs: BreadcrumbItem[] = [];
    let currentRoute: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let accumulatedUrl = '';

    while (currentRoute) {
      const routeUrl = currentRoute.url.map(segment => segment.path).join('/');
      if (routeUrl) {
        accumulatedUrl += `/${routeUrl}`;
      }

      const label = currentRoute.data?.['breadcrumb'];
      if (label) {
        // Avoid duplicate adjacent items
        if (crumbs.length === 0 || crumbs[crumbs.length - 1].label !== label) {
          crumbs.push({
            label,
            route: accumulatedUrl || '/'
          });
        }
      }

      currentRoute = currentRoute.firstChild;
    }

    this.autoCrumbs.set(crumbs);
  }
}
