import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.production ? '' : 'http://127.0.0.1:8787';
  
  private jwt = '';
  private auth = '';
  private adminAuth = '';
  private userJwt = '';
  private locale = 'zh';

  constructor(private http: HttpClient) {}

  setAuth(options: {
    jwt?: string;
    auth?: string;
    adminAuth?: string;
    userJwt?: string;
    locale?: string;
  }) {
    if (options.jwt !== undefined) this.jwt = options.jwt;
    if (options.auth !== undefined) this.auth = options.auth;
    if (options.adminAuth !== undefined) this.adminAuth = options.adminAuth;
    if (options.userJwt !== undefined) this.userJwt = options.userJwt;
    if (options.locale !== undefined) this.locale = options.locale;
  }

  private get headers(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-lang': this.locale,
      'x-custom-auth': this.auth,
      'x-admin-auth': this.adminAuth,
    });
    if (this.jwt) {
      headers = headers.set('Authorization', `Bearer ${this.jwt}`);
    }
    if (this.userJwt) {
      headers = headers.set('x-user-token', this.userJwt);
    }
    return headers;
  }

  fetch<T>(path: string, method: string = 'GET', body?: any): Observable<T> {
    const url = `${this.baseUrl}${path}`;
    const options = { headers: this.headers };

    let request: Observable<T>;
    switch (method.toUpperCase()) {
      case 'POST':
        request = this.http.post<T>(url, body, options);
        break;
      case 'PUT':
        request = this.http.put<T>(url, body, options);
        break;
      case 'DELETE':
        request = this.http.delete<T>(url, options);
        break;
      case 'PATCH':
        request = this.http.patch<T>(url, body, options);
        break;
      default:
        request = this.http.get<T>(url, options);
    }

    return request.pipe(
      catchError(error => {
        const message = error.error?.message || error.message || 'Unknown error';
        return throwError(() => new Error(`[${error.status}]: ${message}`));
      })
    );
  }

  // Open API
  getOpenSettings(): Observable<any> {
    return this.fetch('/open_api/settings');
  }

  // Address API
  getSettings(): Observable<any> {
    return this.fetch('/api/settings');
  }

  newAddress(data: { name: string; domain: string; password?: string }): Observable<any> {
    return this.fetch('/api/new_address', 'POST', data);
  }

  addressLogin(email: string, password: string): Observable<any> {
    return this.fetch('/api/address_login', 'POST', { email, password });
  }

  deleteAddress(): Observable<any> {
    return this.fetch('/api/delete_address', 'DELETE');
  }

  // Mail API
  getMails(limit = 20, offset = 0): Observable<any> {
    return this.fetch(`/api/mails?limit=${limit}&offset=${offset}`);
  }

  getMail(id: number): Observable<any> {
    return this.fetch(`/api/mail/${id}`);
  }

  deleteMail(id: number): Observable<any> {
    return this.fetch(`/api/mails/${id}`, 'DELETE');
  }

  // Send Mail API
  sendMail(data: {
    to_mail: string;
    to_name?: string;
    from_name?: string;
    subject: string;
    is_html: boolean;
    content: string;
  }): Observable<any> {
    return this.fetch('/api/send_mail', 'POST', data);
  }

  // User API
  getUserOpenSettings(): Observable<any> {
    return this.fetch('/user_api/open_settings');
  }

  getUserSettings(): Observable<any> {
    return this.fetch('/user_api/settings');
  }

  // Admin API
  adminFetch<T>(path: string, method: string = 'GET', body?: any): Observable<T> {
    return this.fetch<T>(path, method, body);
  }

  adminGetAddresses(limit = 20, offset = 0, query?: string): Observable<any> {
    let url = `/admin/address?limit=${limit}&offset=${offset}`;
    if (query) url += `&query=${query}`;
    return this.fetch(url);
  }

  adminGetStatistics(): Observable<any> {
    return this.fetch('/admin/statistics');
  }
}
