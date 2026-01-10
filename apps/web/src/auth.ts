import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'demo',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'demo-web'
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = (onAuthenticatedCallback: () => void) => {
  keycloak.init({ onLoad: 'check-sso', checkLoginIframe: false })
    .then((authenticated) => {
      console.log("Keycloak authenticated:", authenticated);
      if (authenticated) {
        onAuthenticatedCallback();
      }
    })
    .catch(console.error);
};

export const doLogin = keycloak.login;
export const doLogout = keycloak.logout;
export const getToken = () => keycloak.token;
export const isAuthenticated = () => !!keycloak.token;
export const updateToken = () => keycloak.updateToken(30);

export default keycloak;
