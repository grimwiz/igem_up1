# Minimal runtime image for the IGEM/UP/1 procedure builder
FROM nginx:1.25-alpine

# Copy hardened Nginx configuration and static assets
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
WORKDIR /usr/share/nginx/html
COPY --chown=nginx:nginx index.html manifest.webmanifest styles.css app.js sw.js ./

# Ensure predictable permissions
RUN find . -type f -exec chmod 0644 {} \; \
    && find . -type d -exec chmod 0755 {} \;

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
