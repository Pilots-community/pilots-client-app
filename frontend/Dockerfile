# Use nginx alpine for a lightweight image
FROM nginx:alpine

# Copy static files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint substitutes API_BASE_URL and SERVICE_DEFINITION into config.js
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
