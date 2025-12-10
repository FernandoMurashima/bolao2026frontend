import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoggedUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_superuser: boolean;
  is_staff: boolean;
  is_active: boolean;
}

interface LoginResponse {
  token: string;
  user: LoggedUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/api/accounts`;
  private tokenKey = 'bolao2026_token';
  private userKey = 'bolao2026_user';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login/`, { username, password })
      .pipe(
        tap((resp) => {
          this.setToken(resp.token);
          this.setUser(resp.user);
        })
      );
  }

  changePassword(
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      `${this.apiUrl}/change-password/`,
      {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setUser(user: LoggedUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): LoggedUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LoggedUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isSuperUser(): boolean {
    const user = this.getUser();
    return !!user?.is_superuser;
  }

  getMe(): Observable<LoggedUser> {
    return this.http.get<LoggedUser>(`${this.apiUrl}/me/`).pipe(
      tap((user) => {
        this.setUser(user);
      })
    );
  }
}
