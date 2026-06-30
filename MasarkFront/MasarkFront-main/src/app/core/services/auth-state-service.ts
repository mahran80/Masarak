import { Injectable, signal, computed } from '@angular/core';
import { UserInfoDto, StoredAuth } from '../models/auth.models';

const ACCESS_TOKEN_KEY  = 'masarak_access_token';
const REFRESH_TOKEN_KEY = 'masarak_refresh_token';
const USER_KEY          = 'masarak_user';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  // ── Private signals ─────────────────────────────────────────────────────────
  private readonly _user         = signal<UserInfoDto | null>(this._loadUser());
  private readonly _accessToken  = signal<string | null>(this._loadToken());
  private readonly _isLoading    = signal(false);
  private readonly _error        = signal<string | null>(null);

  // ── Public read-only computed signals ────────────────────────────────────────
  readonly user            = this._user.asReadonly();
  readonly accessToken     = this._accessToken.asReadonly();
  readonly isLoading       = this._isLoading.asReadonly();
  readonly error           = this._error.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user() && !!this._accessToken());
  readonly userRole        = computed(() => this._user()?.role ?? null);
  readonly isAdmin         = computed(() => this._user()?.role === 'Admin');
  readonly isStudent       = computed(() => this._user()?.role === 'Student');
  readonly isTeacher       = computed(() => this._user()?.role === 'Teacher');
  readonly isParent        = computed(() => this._user()?.role === 'Parent');

  // ── Mutations ────────────────────────────────────────────────────────────────
  setAuth(auth: StoredAuth): void {
    localStorage.setItem(ACCESS_TOKEN_KEY,  auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    localStorage.setItem(USER_KEY,          JSON.stringify(auth.user));
    this._accessToken.set(auth.accessToken);
    this._user.set(auth.user);
    this._error.set(null);
  }

  updateTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY,  accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this._accessToken.set(accessToken);
  }

  clearAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._accessToken.set(null);
    this._user.set(null);
    this._error.set(null);
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────
  private _loadToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private _loadUser(): UserInfoDto | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
