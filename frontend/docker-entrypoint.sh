#!/bin/sh
set -e
export API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
export SERVICE_DEFINITION="${SERVICE_DEFINITION:-certiweightVGMProcess}"
export ALLOW_BOOKING="${ALLOW_BOOKING:-true}"
export OWN_DID="${OWN_DID:-did:web:participant-1-identityhub%3A7093}"
export COUNTERPARTY_DID="${COUNTERPARTY_DID:-did:web:participant-2-identityhub%3A7083}"
envsubst < /usr/share/nginx/html/js/config.js.template > /usr/share/nginx/html/js/config.js
exec nginx -g 'daemon off;'
