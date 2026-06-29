import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, NgSwitchDefault],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
       class="app-icon" [ngSwitch]="name">

    <ng-container *ngSwitchCase="'home'"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></ng-container>
    <ng-container *ngSwitchCase="'book'"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Z"/><path d="M4 19.5A2 2 0 0 1 6 17.5h13"/></ng-container>
    <ng-container *ngSwitchCase="'graduation'"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></ng-container>
    <ng-container *ngSwitchCase="'users'"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 8.2a3 3 0 1 1 0 5.9"/><path d="M21 20c0-2.6-1.8-4.6-4.2-5.3"/></ng-container>
    <ng-container *ngSwitchCase="'user'"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></ng-container>
    <ng-container *ngSwitchCase="'clipboard'"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6M9 15h6"/></ng-container>
    <ng-container *ngSwitchCase="'chart'"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></ng-container>
    <ng-container *ngSwitchCase="'trend-up'"><path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/></ng-container>
    <ng-container *ngSwitchCase="'settings'"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l1.9-1.5-2-3.4-2.3.6a7.7 7.7 0 0 0-1.7-1L15 3h-4l-.3 2.7a7.7 7.7 0 0 0-1.7 1l-2.3-.6-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-1.9 1.5 2 3.4 2.3-.6c.5.4 1.1.8 1.7 1L11 21h4l.3-2.7c.6-.2 1.2-.6 1.7-1l2.3.6 2-3.4z"/></ng-container>
    <ng-container *ngSwitchCase="'bell'"><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5 1.5 6H4.5C4.5 14 6 13 6 9Z"/><path d="M10 19a2 2 0 0 0 4 0"/></ng-container>
    <ng-container *ngSwitchCase="'search'"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/></ng-container>
    <ng-container *ngSwitchCase="'chat'"><path d="M21 11.5a8.5 8.5 0 1 1-3.6-7"/><path d="M21 3v6h-6"/></ng-container>
    <ng-container *ngSwitchCase="'message'"><path d="M4 4h16v12H8l-4 4V4Z"/></ng-container>
    <ng-container *ngSwitchCase="'logout'"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></ng-container>
    <ng-container *ngSwitchCase="'folder'"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></ng-container>
    <ng-container *ngSwitchCase="'video'"><rect x="2.5" y="5" width="14" height="14" rx="2"/><path d="M16.5 10.5 21 7.5v9l-4.5-3Z"/></ng-container>
    <ng-container *ngSwitchCase="'pdf'"><path d="M6 2h9l4 4v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"/><path d="M14 2v5h5"/></ng-container>
    <ng-container *ngSwitchCase="'doc'"><path d="M6 2h9l4 4v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"/><path d="M14 2v5h5M8 13h7M8 17h7"/></ng-container>
    <ng-container *ngSwitchCase="'edit'"><path d="M4 16.5V20h3.5L18 9.5l-3.5-3.5L4 16.5Z"/><path d="M14.5 4.5l3.5 3.5"/></ng-container>
    <ng-container *ngSwitchCase="'trash'"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></ng-container>
    <ng-container *ngSwitchCase="'plus'"><path d="M12 5v14M5 12h14"/></ng-container>
    <ng-container *ngSwitchCase="'check'"><path d="M5 13l4 4 10-10"/></ng-container>
    <ng-container *ngSwitchCase="'check-circle'"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></ng-container>
    <ng-container *ngSwitchCase="'eye'"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></ng-container>
    <ng-container *ngSwitchCase="'eye-off'"><path d="M3 3l18 18"/><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a14.6 14.6 0 0 1-3.4 4.2M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.4-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></ng-container>
    <ng-container *ngSwitchCase="'mail'"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3 6.5l9 6.5 9-6.5"/></ng-container>
    <ng-container *ngSwitchCase="'lock'"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></ng-container>
    <ng-container *ngSwitchCase="'chevron-down'"><path d="M6 9l6 6 6-6"/></ng-container>
    <ng-container *ngSwitchCase="'chevron-left'"><path d="M15 18l-6-6 6-6"/></ng-container>
    <ng-container *ngSwitchCase="'chevron-right'"><path d="M9 18l6-6-6-6"/></ng-container>
    <ng-container *ngSwitchCase="'upload'"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></ng-container>
    <ng-container *ngSwitchCase="'download'"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></ng-container>
    <ng-container *ngSwitchCase="'play'"><circle cx="12" cy="12" r="9.5"/><path d="M10 9l5 3-5 3V9Z" fill="currentColor"/></ng-container>
    <ng-container *ngSwitchCase="'send'"><path d="M21 3 11 13"/><path d="M21 3 14 21l-3-8-8-3 18-7Z"/></ng-container>
    <ng-container *ngSwitchCase="'calendar'"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></ng-container>
    <ng-container *ngSwitchCase="'arrow-right'"><path d="M5 12h14M13 6l6 6-6 6"/></ng-container>
    <ng-container *ngSwitchCase="'arrow-left'"><path d="M19 12H5M11 6l-6 6 6 6"/></ng-container>
    <ng-container *ngSwitchCase="'menu'"><path d="M4 6h16M4 12h16M4 18h16"/></ng-container>
    <ng-container *ngSwitchCase="'close'"><path d="M6 6l12 12M18 6 6 18"/></ng-container>
    <ng-container *ngSwitchCase="'sparkles'"><path d="M12 3v4M12 17v4M4 12h4M16 12h4"/><path d="M7 7l2 2M15 15l2 2M7 17l2-2M15 9l2-2"/></ng-container>
    <ng-container *ngSwitchCase="'flask'"><path d="M9 2h6M10 2v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2.3h12.4A1.5 1.5 0 0 0 19.5 19L14 8.5V2"/><path d="M7.5 15h9"/></ng-container>
    <ng-container *ngSwitchCase="'globe'"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.5 2.5 4 6 4 9.5s-1.5 7-4 9.5c-2.5-2.5-4-6-4-9.5s1.5-7 4-9.5Z"/></ng-container>
    <ng-container *ngSwitchCase="'mic'"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></ng-container>
    <ng-container *ngSwitchCase="'phone'"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2C9.5 20 4 14.5 4 7a2 2 0 0 1 1-3Z"/></ng-container>
    <ng-container *ngSwitchCase="'building'"><path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-5h6v5M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/></ng-container>
    <ng-container *ngSwitchCase="'credit-card'"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/></ng-container>
    <ng-container *ngSwitchCase="'wallet'"><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M16 13h2"/></ng-container>
    <ng-container *ngSwitchCase="'filter'"><path d="M4 5h16M7 12h10M10 19h4"/></ng-container>
    <ng-container *ngSwitchCase="'dots'"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></ng-container>
    <ng-container *ngSwitchCase="'hand'"><path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V3.5a1.5 1.5 0 0 1 3 0V11M14 11.5V5a1.5 1.5 0 0 1 3 0v8M8 12l-1.5-1.4a1.6 1.6 0 0 0-2.3 2.2L8 17.5c1 1.5 2 2.5 4.5 2.5H15a4 4 0 0 0 4-4v-4.5a1.5 1.5 0 0 0-3 0"/></ng-container>
    <ng-container *ngSwitchCase="'target'"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></ng-container>
    <ng-container *ngSwitchCase="'trophy'"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5a3 3 0 0 0 3 4M16 5h3a3 3 0 0 1-3 4"/><path d="M10 15h4v3h-4z"/><path d="M8 21h8"/></ng-container>
    <ng-container *ngSwitchCase="'family'"><circle cx="7" cy="6.5" r="2.2"/><circle cx="16" cy="6.5" r="2.2"/><circle cx="11.5" cy="11" r="1.8"/><path d="M2.5 18c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5M12.5 18c0-2-1.5-3.5-3.5-3.5M21.5 18c0-2.8-2-4.5-4.5-4.5-1 0-1.9.3-2.6.8"/></ng-container>
    <ng-container *ngSwitchCase="'archive'"><rect x="3" y="3" width="18" height="5" rx="1.5"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 13h4"/></ng-container>
    <ng-container *ngSwitchCase="'robot'"><rect x="5" y="8" width="14" height="11" rx="3"/><circle cx="9.5" cy="13.5" r="1.2" fill="currentColor"/><circle cx="14.5" cy="13.5" r="1.2" fill="currentColor"/><path d="M12 8V5M9 5h6"/></ng-container>
    <ng-container *ngSwitchCase="'shield'"><path d="M12 3l8 3.5v6c0 5-3.5 7.5-8 8.5-4.5-1-8-3.5-8-8.5v-6L12 3Z"/></ng-container>
    <ng-container *ngSwitchCase="'twitter'"><path d="M21 5.5a8 8 0 0 1-2.3.9 3.5 3.5 0 0 0-6 3.2A10 10 0 0 1 4 4.5s-3 6.5 4 9.5a11 11 0 0 1-6.5 1.8C9 20 16 18 18.5 10A7.5 7.5 0 0 0 21 5.5Z"/></ng-container>
    <ng-container *ngSwitchCase="'facebook'"><path d="M14 21v-7h2.5l.5-3H14V9a1.5 1.5 0 0 1 1.5-1.5H17V4.5h-2.2A4 4 0 0 0 10.5 8.5v2.5H8v3h2.5v7Z"/></ng-container>
    <ng-container *ngSwitchCase="'linkedin'"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8.5" r="1.1" fill="currentColor"/><path d="M8 11v6M12 11v6M12 13.5c0-1.4 1-2.5 2.3-2.5S16.5 12 16.5 13.5V17M12 11h.01"/></ng-container>
    <ng-container *ngSwitchCase="'youtube'"><rect x="2.5" y="6" width="19" height="12" rx="3"/><path d="M11 9.5l4 2.5-4 2.5v-5Z" fill="currentColor"/></ng-container>
    <ng-container *ngSwitchCase="'instagram'"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor"/></ng-container>
    <ng-container *ngSwitchCase="'maximize'"><path d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4M15 20h4a1 1 0 0 0 1-1v-4"/></ng-container>
    <ng-container *ngSwitchCase="'volume'"><path d="M5 9v6h3l4 4V5L8 9H5Z"/><path d="M16 9a4 4 0 0 1 0 6"/></ng-container>
    <ng-container *ngSwitchCase="'help'"><circle cx="12" cy="12" r="9.5"/><path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.1.9-1.1 1.7"/><path d="M12 17h.01"/></ng-container>
    <ng-container *ngSwitchDefault><circle cx="12" cy="12" r="9"/></ng-container>
  </svg>
  `,
  styles: [`
    .app-icon { display: block; flex-shrink: 0; }
  `]
})
export class IconComponent {
  @Input() name = '';
  @Input() size: number | string = 20;
}
