import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface AdminUser {
  id?: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  password?: string; // só envio quando quiser definir/trocar
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = `${environment.apiBaseUrl}/api/accounts/users/`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  create(user: AdminUser): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, user);
  }

  update(id: number, user: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}${id}/`, user);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }
}
