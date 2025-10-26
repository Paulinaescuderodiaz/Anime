# 🔥 Configuración de Firebase para Autenticación con Google

## 📋 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto (ej: "nekorate-anime")
4. Habilita Google Analytics (opcional)

### 2. Configurar Authentication
1. En el panel izquierdo, ve a "Authentication"
2. Haz clic en "Comenzar"
3. Ve a la pestaña "Sign-in method"
4. Habilita "Google" como proveedor
5. Configura el nombre del proyecto y email de soporte

### 3. Obtener Configuración
1. Ve a "Configuración del proyecto" (ícono de engranaje)
2. En "Tus aplicaciones", haz clic en "Web" (</>)
3. Registra tu app con un nombre (ej: "NekoRate Web")
4. Copia la configuración que aparece

### 4. Actualizar Configuración
Reemplaza los valores en `src/app/config/firebase.config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "tu-api-key-real",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

### 5. Configurar Dominios Autorizados
En Firebase Console > Authentication > Settings:
- Agrega `localhost:8100` para desarrollo
- Agrega tu dominio de producción cuando despliegues

## 🚀 Funcionalidades Implementadas

- ✅ **Login con Google**: Botón para autenticación rápida
- ✅ **Gestión de sesión**: Mantiene la sesión activa
- ✅ **Datos del usuario**: Nombre, email, foto de perfil
- ✅ **Logout**: Cerrar sesión de Google
- ✅ **Fallback**: Sistema de login tradicional como respaldo

## 🔧 Comandos Útiles

```bash
# Instalar dependencias
npm install firebase @angular/fire

# Verificar configuración
ng build --configuration development

# Probar en desarrollo
ionic serve
```

## 📱 Pruebas

1. **Desarrollo**: `http://localhost:8100`
2. **Móvil**: Usa `ionic serve` y abre en el navegador móvil
3. **Producción**: Configura tu dominio en Firebase

## ⚠️ Notas Importantes

- **API Keys**: Nunca expongas las claves en repositorios públicos
- **Dominios**: Configura correctamente los dominios autorizados
- **HTTPS**: Firebase requiere HTTPS en producción
- **Cuotas**: Google tiene límites de uso gratuitos

## 🎯 Próximos Pasos

1. Configurar Firebase con tus credenciales reales
2. Probar el login con Google
3. Personalizar la experiencia del usuario
4. Agregar más proveedores (Facebook, Twitter, etc.)
