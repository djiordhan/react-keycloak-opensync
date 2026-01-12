declare global {
  interface Window {
    __ENV__?: {
      API_URL?: string;
      KEYCLOAK_URL?: string;
      KEYCLOAK_REALM?: string;
      KEYCLOAK_CLIENT_ID?: string;
    };
  }
}

export const environment = {
  apiUrl: window.__ENV__?.API_URL ?? 'http://localhost:3000',
  keycloak: {
    url: window.__ENV__?.KEYCLOAK_URL ?? 'http://localhost:8080',
    realm: window.__ENV__?.KEYCLOAK_REALM ?? 'demo',
    clientId: window.__ENV__?.KEYCLOAK_CLIENT_ID ?? 'demo-web'
  }
};
