#!/bin/sh

# This script generates an env.js file from environment variables
# to allow runtime configuration in the Angular app.

cat <<EOF > /app/src/env.js
(function(window) {
  window.__ENV__ = {
    API_URL: '${API_URL:-http://localhost:3000}',
    KEYCLOAK_URL: '${KEYCLOAK_URL:-http://localhost:8080}',
    KEYCLOAK_REALM: '${KEYCLOAK_REALM:-demo}',
    KEYCLOAK_CLIENT_ID: '${KEYCLOAK_CLIENT_ID:-demo-web}'
  };
})(this);
EOF
