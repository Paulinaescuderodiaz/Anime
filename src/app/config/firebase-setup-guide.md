# 🔥 Guía Visual: Configurar Google Authentication en Firebase

## 📋 **PASO A PASO COMPLETO**

### **1. Acceder a Authentication**
```
Firebase Console → Tu Proyecto "Anime" → Authentication (menú lateral)
```

### **2. Habilitar Google Provider**
```
Authentication → Sign-in method → Google → Habilitar
```

### **3. Configurar Google**
- ✅ **Activar**: Toggle ON
- ✅ **Nombre del proyecto**: "Anime"
- ✅ **Email de soporte**: Tu email
- ✅ **Guardar**: Click "Save"

### **4. Obtener Configuración**
```
Firebase Console → ⚙️ Configuración → Tus aplicaciones → Web (</>)
```

### **5. Registrar App Web**
- ✅ **Apodo**: "NekoRate Web"
- ✅ **Firebase Hosting**: No (por ahora)
- ✅ **Registrar aplicación**

### **6. Copiar Configuración**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...", // ← Copia este valor
  authDomain: "anime-d45f9.firebaseapp.com", // ← Copia este valor
  projectId: "anime-d45f9", // ← Copia este valor
  storageBucket: "anime-d45f9.appspot.com", // ← Copia este valor
  messagingSenderId: "123456789012", // ← Copia este valor
  appId: "1:123456789012:web:abcdef..." // ← Copia este valor
};
```

### **7. Actualizar Archivo**
Reemplaza los valores en: `src/app/config/firebase.config.ts`

### **8. Configurar Dominios**
```
Authentication → Settings → Authorized domains
```
Agregar:
- `localhost` (para desarrollo)
- Tu dominio de producción

### **9. Probar**
```bash
ionic serve
```
Ve a: http://localhost:8103
Haz clic en "CONTINUAR CON GOOGLE"

## 🎯 **RESULTADO ESPERADO**

✅ **Login con Google funciona**
✅ **Popup de Google aparece**
✅ **Usuario se autentica**
✅ **Navega a la página principal**

## ⚠️ **TROUBLESHOOTING**

### **Error: "Error al iniciar sesión con Google"**
- Verifica que la configuración de Firebase sea correcta
- Asegúrate de que Google esté habilitado en Authentication
- Verifica que `localhost` esté en dominios autorizados

### **Error: "Firebase not initialized"**
- Verifica que `firebase.config.ts` tenga los valores correctos
- Reinicia el servidor: `ionic serve`

### **Error: "Domain not authorized"**
- Agrega `localhost` a dominios autorizados en Firebase
- Espera unos minutos para que se propague

## 🚀 **PRÓXIMOS PASOS**

1. **Configurar Firebase** con tus credenciales reales
2. **Probar el login** con Google
3. **Personalizar** la experiencia del usuario
4. **Agregar más proveedores** (Facebook, Twitter, etc.)

## 📱 **COMANDOS ÚTILES**

```bash
# Desarrollo
ionic serve

# Compilar
ng build --configuration development

# Verificar errores
ng build --configuration development
```

## 🔧 **ARCHIVOS IMPORTANTES**

- `src/app/config/firebase.config.ts` - Configuración de Firebase
- `src/app/services/google-auth.service.ts` - Servicio de Google Auth
- `src/app/services/auth.service.ts` - Servicio principal
- `src/app/login/login.page.html` - Interfaz de login
- `src/app/login/login.page.ts` - Lógica de login

## 🎨 **PERSONALIZACIÓN**

Puedes personalizar:
- **Colores** del botón de Google
- **Mensajes** de error y éxito
- **Redirección** después del login
- **Datos** del usuario que se guardan

¡Tu aplicación ya está lista para autenticación con Google! 🚀
