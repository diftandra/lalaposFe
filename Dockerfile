# Serve pre-built Angular app with nginx
# Build first with: npm run build -- --configuration production

FROM nginxinc/nginx-unprivileged
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/lala-pos/ /usr/share/nginx/html
EXPOSE 4200
