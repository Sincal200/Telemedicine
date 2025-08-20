# Etapa 1: Construir la aplicación React
FROM node:18-alpine as builder

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:stable-alpine

# Copiar los archivos construidos desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar la configuración de Nginx para manejar el enrutamiento del lado del cliente
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
