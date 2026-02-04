# MIR-Premios

> Sistema de evaluación dental con IA y gestión de leads para implantología - Parte de MIRO 4P Suite

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89-3ecf8e.svg)](https://supabase.com/)

## 📋 Descripción del Proyecto

**mir-premios** es una aplicación web profesional para clínicas dentales especializadas en implantología que permite:

- **Evaluación Clínica Digital**: Formularios clínicos completos con historial médico
- **Análisis con IA**: Escaneo inteligente de radiografías panorámicas para sugerir rutas de tratamiento
- **Sistema de Leads**: Gestión integral del embudo de conversión de pacientes
- **Portal Paciente**: Seguimiento de evaluaciones y citas programadas
- **Portal Profesional**: Dashboard para profesionales con métricas y gestión de leads
- **Integración de Pagos**: MercadoPago para checkout premium
- **Agendamiento Inteligente**: Sistema de citas con integración a Dentalink

### Contexto Clínico

Parte de la **MIRO 4P Suite** (Plataforma de Protocolo de Procedimientos Personalizados), mir-premios facilita el análisis, priorización y recompensa de pacientes en tratamientos de implantología dental basándose en:

- Análisis automatizado de radiografías
- Cuestionarios clínicos estructurados
- Rutas de tratamiento personalizadas
- Sistema de conversión de leads a pacientes

---

## 🚀 Stack Tecnológico

### Frontend
- **React 18** - Biblioteca UI con hooks y componentes funcionales
- **TypeScript 5.8** - Tipado estático y desarrollo type-safe
- **Vite 5.4** - Build tool y dev server ultrarrápido
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - Componentes de UI modernos y accesibles
- **Radix UI** - Primitivas UI sin estilos para accesibilidad
- **Framer Motion** - Animaciones fluidas y transiciones

### Backend & Data
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication con RUT + OTP
  - Edge Functions (13 serverless functions)
  - Storage para imágenes dentales
- **TanStack Query (React Query)** - Server state management y cache
- **React Router v6** - Enrutamiento declarativo

### Integraciones
- **MercadoPago** - Procesamiento de pagos
- **Dentalink API** - Integración con sistema de gestión dental
- **Supabase Functions** - Lógica backend serverless

### Desarrollo
- **ESLint** - Linting de código
- **TypeScript ESLint** - Reglas específicas para TypeScript
- **SWC** - Compilación rápida de TypeScript/React
- **PostCSS** - Transformaciones CSS

---

## 📦 Instalación y Configuración

### Prerrequisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Cuenta de **Supabase** (para backend)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/CACO1972/mir-premios.git
cd mir-premios
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia el archivo de ejemplo y edita con tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
# Obtén estos valores de tu proyecto Supabase
# Dashboard > Settings > API

VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_PROJECT_ID=tu-proyecto-id
VITE_SUPABASE_PUBLISHABLE_KEY=tu-anon-key-aqui
```

> ⚠️ **Importante**: Nunca commitees el archivo `.env` con credenciales reales. Usa `.env.example` solo como template.

### 4. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta las migraciones en `supabase/migrations/`
3. Despliega las Edge Functions en `supabase/functions/`

```bash
# Instalar Supabase CLI
npm install -g supabase

# Link al proyecto
supabase link --project-ref tu-proyecto-id

# Ejecutar migraciones
supabase db push

# Desplegar functions
supabase functions deploy
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`

### 6. Build para Producción

```bash
npm run build
```

Los archivos optimizados estarán en `dist/`

### 7. Preview del Build

```bash
npm run preview
```

---

## 🏗️ Estructura del Proyecto

```
mir-premios/
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── Wizard/         # Flujo de evaluación multi-paso
│   │   ├── Hero/           # Hero section homepage
│   │   ├── Editorial/      # Secciones informativas
│   │   ├── AIModule/       # Análisis con IA
│   │   └── ui/             # shadcn/ui components (40+)
│   ├── pages/              # Páginas principales
│   │   ├── Index.tsx       # Landing page
│   │   ├── Auth.tsx        # Login RUT + OTP
│   │   ├── PortalPaciente.tsx    # Portal del paciente
│   │   └── PortalProfesional.tsx # Dashboard profesional
│   ├── contexts/           # Context providers globales
│   │   ├── ThemeContext.tsx      # Dark/Light mode
│   │   └── LanguageContext.tsx   # i18n ES/EN
│   ├── integrations/       # Integraciones externas
│   │   └── supabase/       # Cliente y tipos Supabase
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilidades y helpers
│   ├── App.tsx             # Componente raíz
│   └── main.tsx            # Entry point
├── supabase/
│   ├── functions/          # 13 Edge Functions
│   │   ├── auth-login-rut/
│   │   ├── auth-verify-otp/
│   │   ├── analyze-dental/
│   │   ├── create-mp-preference/
│   │   └── ...
│   └── migrations/         # Database migrations
├── public/                 # Assets estáticos
├── .env.example            # Template de variables de entorno
├── components.json         # Config de shadcn/ui
├── tailwind.config.ts      # Configuración Tailwind
├── tsconfig.json           # TypeScript config (strict mode)
├── vite.config.ts          # Vite config
└── package.json            # Dependencias
```

---

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 8080)

# Build
npm run build            # Build de producción
npm run build:dev        # Build en modo development
npm run preview          # Preview del build

# Linting
npm run lint             # Ejecutar ESLint
```

---

## 🔐 Seguridad y Buenas Prácticas

✅ **Variables de entorno** externalizadas en `.env`  
✅ **TypeScript strict mode** habilitado  
✅ **No hay credenciales hardcodeadas** en el código  
✅ **Validación de inputs** en formularios  
✅ **Manejo de errores** consistente  
✅ **Loading states** en todas las operaciones async  
✅ **Sanitización** de datos antes de render  

---

## 📱 Funcionalidades Principales

### 1. Flujo de Evaluación (Wizard)
- **Entrada**: Paciente nuevo vs. paciente existente
- **Cuestionario Clínico**: Historia médica, dolor, motivo de consulta
- **Análisis IA**: Escaneo de radiografías con sugerencias de tratamiento
- **Checkout Premium**: Integración MercadoPago
- **Agendamiento**: Reserva de citas con Dentalink

### 2. Autenticación
- Login con **RUT chileno**
- Verificación por **OTP** (código de un solo uso)
- Roles: Paciente / Profesional

### 3. Portal Paciente
- Historial de evaluaciones
- Estado de pagos
- Citas programadas
- Contacto directo con clínica

### 4. Portal Profesional
- Dashboard de métricas (total, pendientes, agendados, completados)
- Gestión de leads por etapa
- Búsqueda y filtrado
- Acceso a evaluaciones completas

---

## 🎨 Características de UI/UX

- ✨ **Modo Dark/Light** con persistencia
- 🌐 **Bilingüe** (Español/Inglés)
- 📱 **Responsive design** (mobile-first)
- ♿ **Accesibilidad** con componentes Radix UI
- 🎬 **Animaciones** fluidas con Framer Motion
- 🎨 **Design system** consistente con shadcn/ui

---

## 🚀 Estado Actual

### v0.1.0 - Primer Release Production-Ready

**Estado**: ✅ Listo para despliegue inicial

**Funcionalidad Core Completa**:
- ✅ Flujo completo de evaluación dental
- ✅ Análisis con IA de radiografías
- ✅ Sistema de autenticación
- ✅ Portales paciente y profesional
- ✅ Integración de pagos MercadoPago
- ✅ Agendamiento de citas

**Calidad de Código**:
- ✅ Build exitoso sin errores
- ✅ Linting pasando (0 errores, 9 warnings menores)
- ✅ TypeScript strict mode habilitado
- ✅ Error handling implementado
- ✅ Loading states en operaciones async
- ✅ Validación de formularios

---

## 🔮 Próximas Mejoras (Roadmap)

> ⚠️ **Nota**: Las siguientes features están planificadas pero **NO implementadas** en v0.1.0

### v0.2.0 - Integraciones Avanzadas
- [ ] Integración directa con MIRO 4P Core
- [ ] Sincronización bidireccional con Dentalink
- [ ] Webhook handlers para eventos externos

### v0.3.0 - Analytics y Reportes
- [ ] Dashboard de métricas clínicas avanzadas
- [ ] Exportación de reportes en PDF
- [ ] Análisis de tendencias y KPIs
- [ ] Gráficos de conversión de leads

### v0.4.0 - Comunicaciones
- [ ] Sistema de notificaciones push
- [ ] Email templates personalizados
- [ ] Recordatorios automáticos de citas
- [ ] Chat en tiempo real con soporte

### v0.5.0 - Offline y Performance
- [ ] Modo offline con sincronización
- [ ] Service workers para cache
- [ ] Optimización de bundle size
- [ ] Lazy loading de componentes

---

## 👥 Contribución

Este es un proyecto privado de MIRO 4P Suite. Para contribuciones:

1. Fork del repositorio
2. Crear branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Estándares de Código

- TypeScript estricto
- ESLint rules enforcement
- Convención de commits semánticos
- Tests para nuevas features (próximamente)

---

## 📄 Licencia

Propietario - MIRO 4P Suite © 2024

---

## 📞 Contacto y Soporte

Para consultas técnicas o soporte:

- **Email**: soporte@miro4p.com
- **GitHub Issues**: [CACO1972/mir-premios/issues](https://github.com/CACO1972/mir-premios/issues)

---

## 🙏 Agradecimientos

Construido con:
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

---

**Versión**: 0.1.0  
**Última actualización**: Febrero 2026  
**Estado**: Production-Ready ✅

