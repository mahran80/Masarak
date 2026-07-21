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
    <ng-container *ngSwitchCase="'chat'"><path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></ng-container>
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

    <!-- Heroicons — Lessons feature -->
    <ng-container *ngSwitchCase="'academic-cap'"><path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/></ng-container>
    <ng-container *ngSwitchCase="'book-open'"><path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></ng-container>
    <ng-container *ngSwitchCase="'document-text'"><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></ng-container>
    <ng-container *ngSwitchCase="'clipboard-document-list'"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/></ng-container>
    <ng-container *ngSwitchCase="'document-check'"><path d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm4.125 9.75 2.25 2.25L21 9.75"/></ng-container>
    <ng-container *ngSwitchCase="'check-badge'"><path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"/></ng-container>
    <ng-container *ngSwitchCase="'pencil-square'"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></ng-container>
    <ng-container *ngSwitchCase="'square-2-stack'"><path d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-8.25A2.25 2.25 0 0 1 7.5 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"/></ng-container>
    <ng-container *ngSwitchCase="'link-slash'"><path d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"/><path d="m2.25 2.25 19.5 19.5"/></ng-container>
    <ng-container *ngSwitchCase="'bars-3'"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></ng-container>
    <ng-container *ngSwitchCase="'arrow-up-tray'"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/></ng-container>
    <ng-container *ngSwitchCase="'arrow-top-right-on-square'"><path d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></ng-container>
    <ng-container *ngSwitchCase="'folder-open'"><path d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"/></ng-container>
    <ng-container *ngSwitchCase="'list-bullet'"><path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></ng-container>
    <ng-container *ngSwitchCase="'squares-2x2'"><path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></ng-container>
    <ng-container *ngSwitchCase="'exclamation-triangle'"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></ng-container>
    <ng-container *ngSwitchCase="'x-mark'"><path d="M6 18 18 6M6 6l12 12"/></ng-container>
    <ng-container *ngSwitchCase="'play-circle'"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"/></ng-container>
    <ng-container *ngSwitchCase="'clock'"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></ng-container>
    <ng-container *ngSwitchCase="'link'"><path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/></ng-container>
    <ng-container *ngSwitchCase="'pencil'"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"/></ng-container>
    <ng-container *ngSwitchCase="'notes'"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/><path d="M19.5 7.125 16.862 4.487"/><path d="M3 20.25V17.6c0-.597.237-1.17.659-1.591L17.25 2.418"/></ng-container>
    <ng-container *ngSwitchCase="'clipboard-document'"><path d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-1.674c.11.208.1.444-.025.654M15.75 18H4.875c-.621 0-1.125-.504-1.125-1.125V4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125.504 1.125 1.125V18Z"/></ng-container>
    <ng-container *ngSwitchCase="'chevron-up'"><path d="M4.5 15.75l7.5-7.5 7.5 7.5"/></ng-container>
    <ng-container *ngSwitchCase="'arrow-right-on-rectangle'"><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H5.25" /></ng-container>

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
