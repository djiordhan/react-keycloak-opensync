import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthService {
  private keycloak = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId
  });
  private authenticatedSubject = new BehaviorSubject(false);

  authenticated$ = this.authenticatedSubject.asObservable();

  async init(): Promise<void> {
    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        checkLoginIframe: false
      });
      this.authenticatedSubject.next(authenticated);
    } catch (error) {
      console.error('Keycloak init failed', error);
      this.authenticatedSubject.next(false);
    }
  }

  login(): void {
    this.keycloak.login();
  }

  logout(): void {
    this.keycloak.logout();
  }

  isAuthenticated(): boolean {
    return !!this.keycloak.token;
  }

  getToken(): string | undefined {
    return this.keycloak.token;
  }

  updateToken(): Promise<boolean> {
    return this.keycloak.updateToken(30);
  }
}
