# 📍 Gestión de Layout de Oficina

Una aplicación web interactiva para gestionar el layout de oficina con funcionalidades de drag & drop para asignar empleados a posiciones específicas.

## 🚀 Características

- **Layout Visual Interactivo**: Visualización de plano de oficina con posiciones numeradas
- **Gestión de Empleados**: Sistema CRUD completo para empleados con campos de nombre, departamento y posición
- **Drag & Drop**: Funcionalidad intuitiva para arrastrar empleados a posiciones específicas
- **Base de Datos Local**: Almacenamiento persistente en localStorage con respaldo automático
- **Estadísticas y Reportes**: Panel completo con métricas de ocupación y actividad
- **Exportar/Importar**: Funcionalidad para respaldar y restaurar datos
- **Historial de Actividad**: Registro completo de cambios y movimientos

## 🛠️ Tecnologías Utilizadas

- **React 18** con TypeScript
- **Vite** como herramienta de construcción
- **@dnd-kit** para funcionalidad drag & drop
- **Lucide React** para iconos
- **CSS Modules** para estilos

## 📦 Instalación

1. Clona o descarga el proyecto
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en `http://localhost:5173`

## 🎯 Cómo Usar

### 1. Gestión de Empleados
- Ve a la pestaña "👥 Empleados"
- Haz clic en "Nuevo Empleado" para agregar empleados
- Completa los campos: Nombre, Departamento y Posición
- Usa los filtros para buscar empleados específicos

### 2. Asignación en Layout
- Ve a la pestaña "🏢 Layout"
- Arrastra empleados desde la barra lateral a las posiciones numeradas
- Los empleados ya asignados aparecen en sus posiciones correspondientes
- Haz clic en la X para quitar un empleado de su posición

### 3. Estadísticas
- Ve a la pestaña "📊 Estadísticas"
- Visualiza métricas de ocupación y distribución por departamento
- Revisa el historial de actividad reciente
- Exporta o importa datos para respaldo

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── EmployeeCard.tsx    # Tarjeta de empleado
│   ├── EmployeePanel.tsx   # Panel de gestión de empleados
│   ├── OfficeLayout.tsx    # Layout visual de oficina
│   └── Statistics.tsx      # Estadísticas y reportes
├── services/           # Servicios de la aplicación
│   └── DatabaseManager.ts  # Gestión de datos local
├── types/              # Definiciones TypeScript
│   └── database.ts         # Tipos e interfaces
└── App.tsx             # Componente principal
```

## 💾 Almacenamiento de Datos

La aplicación utiliza localStorage del navegador para persistir datos:
- **Datos principales**: Empleados, posiciones y configuración
- **Respaldo automático**: Se crea antes de cada actualización
- **Historial**: Registro de todos los cambios realizados

## 🎨 Características de UI

- **Responsive Design**: Adaptable a diferentes tamaños de pantalla
- **Drag & Drop Visual**: Retroalimentación visual durante el arrastre
- **Indicadores de Estado**: Colores y iconos para diferentes estados
- **Navegación por Pestañas**: Interfaz organizada y fácil de usar

## 📊 Datos por Defecto

La aplicación incluye departamentos predefinidos:
- Administración
- Ventas  
- Marketing
- IT
- Recursos Humanos
- Contabilidad

Y posiciones típicas:
- Gerente, Supervisor, Coordinador
- Analista, Asistente, Especialista
- Director, Jefe de Área

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la construcción de producción
- `npm run lint` - Ejecuta linting del código

## 🚀 Producción

Para compilar para producción:

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## 📝 Notas de Desarrollo

- Los datos se guardan automáticamente en localStorage
- El layout por defecto es de 12x8 posiciones (96 total)
- Cada posición tiene un número único para fácil identificación
- El sistema mantiene un historial completo de cambios
