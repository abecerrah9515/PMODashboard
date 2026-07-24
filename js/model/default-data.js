export const DEFAULT_DATA = {
 "fases": [
  {
   "id": 1,
   "nom": "Iniciación",
   "sub": "",
   "s": [
    2024,
    0,
    15
   ],
   "e": [
    2024,
    1,
    29
   ],
   "esp": 1.0,
   "real": 1.0,
   "peso": 0.1,
   "com": "Fase cerrada sin novedades.",
   "dias": 45
  },
  {
   "id": 2,
   "nom": "Planeación",
   "sub": "",
   "s": [
    2024,
    1,
    1
   ],
   "e": [
    2024,
    2,
    31
   ],
   "esp": 1.0,
   "real": 1.0,
   "peso": 0.15,
   "com": "Entregables aprobados por el comité.",
   "dias": 59
  },
  {
   "id": 3,
   "nom": "Análisis y Diseño",
   "sub": "Fase de mayor peso",
   "s": [
    2024,
    2,
    15
   ],
   "e": [
    2024,
    5,
    30
   ],
   "esp": 1.0,
   "real": 0.85,
   "peso": 0.25,
   "com": "Pendiente validación de la arquitectura.",
   "dias": 107
  },
  {
   "id": 4,
   "nom": "Desarrollo",
   "sub": "",
   "s": [
    2024,
    4,
    1
   ],
   "e": [
    2024,
    9,
    31
   ],
   "esp": 0.9,
   "real": 0.6,
   "peso": 0.3,
   "com": "En ejecución según lo planeado.",
   "dias": 183
  },
  {
   "id": 5,
   "nom": "Pruebas y QA",
   "sub": "",
   "s": [
    2024,
    8,
    1
   ],
   "e": [
    2024,
    11,
    15
   ],
   "esp": 0.5,
   "real": 0.2,
   "peso": 0.15,
   "com": "Inicio de pruebas integradas.",
   "dias": 105
  },
  {
   "id": 6,
   "nom": "Cierre",
   "sub": "",
   "s": [
    2024,
    11,
    1
   ],
   "e": [
    2025,
    0,
    31
   ],
   "esp": 0.2,
   "real": 0.0,
   "peso": 0.05,
   "com": "Fase no iniciada.",
   "dias": 61
  }
 ],
 "del": [
  {
   "id": 1,
   "nom": "Acta de constitución del proyecto",
   "rol": "Gerente de Proyecto",
   "pct": 1.0,
   "entrega": "Hito 1",
   "fase": 1
  },
  {
   "id": 2,
   "nom": "Plan de gestión del proyecto",
   "rol": "Gerente de Proyecto",
   "pct": 1.0,
   "entrega": "Hito 1",
   "fase": 2
  },
  {
   "id": 3,
   "nom": "Matriz de interesados",
   "rol": "Analista Funcional",
   "pct": 1.0,
   "entrega": "Hito 1",
   "fase": 2
  },
  {
   "id": 4,
   "nom": "Documento de requisitos",
   "rol": "Líder Funcional · apoyo Analista",
   "pct": 0.95,
   "entrega": "Hito 2",
   "fase": 3
  },
  {
   "id": 5,
   "nom": "Arquitectura de la solución",
   "rol": "Arquitecto · apoyo Líder Técnico",
   "pct": 0.88,
   "entrega": "Hito 2",
   "fase": 3
  },
  {
   "id": 6,
   "nom": "Modelo de datos",
   "rol": "Ingeniero de Datos",
   "pct": 0.8,
   "entrega": "Hito 2",
   "fase": 3
  },
  {
   "id": 7,
   "nom": "Módulo de autenticación",
   "rol": "Desarrollador Backend",
   "pct": 0.7,
   "entrega": "Hito 2",
   "fase": 4
  },
  {
   "id": 8,
   "nom": "Interfaz de usuario",
   "rol": "Desarrollador Frontend",
   "pct": 0.55,
   "entrega": "Hito 2",
   "fase": 4
  },
  {
   "id": 9,
   "nom": "Integración de servicios",
   "rol": "Líder Técnico · apoyo Backend",
   "pct": 0.6,
   "entrega": "Hito 2",
   "fase": 4
  },
  {
   "id": 10,
   "nom": "Reportes y tableros",
   "rol": "Analista BI",
   "pct": 0.4,
   "entrega": "Hito 2",
   "fase": 4
  },
  {
   "id": 11,
   "nom": "Plan de pruebas",
   "rol": "Líder de QA",
   "pct": 0.5,
   "entrega": "Hito 2",
   "fase": 5
  },
  {
   "id": 12,
   "nom": "Manual de usuario",
   "rol": "Documentador Técnico",
   "pct": 0.3,
   "entrega": "Hito 2",
   "fase": 5
  },
  {
   "id": 13,
   "nom": "Plan de despliegue",
   "rol": "Ingeniero DevOps",
   "pct": 0.2,
   "entrega": "Hito 2",
   "fase": 6
  }
 ],
 "risks": [
  {
   "id": 1,
   "nom": "Retraso en la definición de requisitos",
   "mit": "Priorizar talleres con los usuarios clave.",
   "imp": "a",
   "impLbl": "Alto",
   "prob": 0.5,
   "estado": "Controlado"
  },
  {
   "id": 2,
   "nom": "Disponibilidad del equipo de trabajo",
   "mit": "Asegurar backups para los roles críticos.",
   "imp": "m",
   "impLbl": "Medio",
   "prob": 0.3,
   "estado": "Controlado"
  },
  {
   "id": 3,
   "nom": "Cambios de alcance no planificados",
   "mit": "Aplicar control de cambios formal.",
   "imp": "a",
   "impLbl": "Alto",
   "prob": 0.7,
   "estado": "Activo"
  },
  {
   "id": 4,
   "nom": "Dependencias con proveedores externos",
   "mit": "Acordar SLAs y puntos de control.",
   "imp": "m",
   "impLbl": "Medio",
   "prob": 0.5,
   "estado": "Controlado"
  },
  {
   "id": 5,
   "nom": "Calidad de los datos de origen",
   "mit": "Perfilar las fuentes de forma temprana.",
   "imp": "a",
   "impLbl": "Alto",
   "prob": 0.5,
   "estado": "Controlado"
  },
  {
   "id": 6,
   "nom": "Sobrecosto de infraestructura",
   "mit": "Revisar el consumo de forma mensual.",
   "imp": "m",
   "impLbl": "Medio",
   "prob": 0.3,
   "estado": "Controlado"
  },
  {
   "id": 7,
   "nom": "Rotación de personal clave",
   "mit": "Documentar y transferir el conocimiento.",
   "imp": "m",
   "impLbl": "Medio",
   "prob": 0.5,
   "estado": "Controlado"
  },
  {
   "id": 8,
   "nom": "Incidencias en la integración",
   "mit": "Reforzar las pruebas de integración continua.",
   "imp": "b",
   "impLbl": "Bajo",
   "prob": 0.3,
   "estado": "Controlado"
  },
  {
   "id": 9,
   "nom": "Retraso en las aprobaciones",
   "mit": "Definir un único responsable de aprobación.",
   "imp": "m",
   "impLbl": "Medio",
   "prob": 0.9,
   "estado": "Activo"
  }
 ],
 "sol": [
  {
   "id": 1,
   "nom": "Aprobar el acta de constitución",
   "fecha": [
    2024,
    0,
    18
   ],
   "cierre": [
    2024,
    0,
    25
   ],
   "est": "fin",
   "estLbl": "Finalizado",
   "fase": 1
  },
  {
   "id": 2,
   "nom": "Conformar el equipo de trabajo",
   "fecha": [
    2024,
    0,
    22
   ],
   "cierre": [
    2024,
    1,
    2
   ],
   "est": "fin",
   "estLbl": "Finalizado",
   "fase": 1
  },
  {
   "id": 3,
   "nom": "Validar requisitos con los usuarios",
   "fecha": [
    2024,
    2,
    20
   ],
   "cierre": null,
   "est": "proc",
   "estLbl": "En Proceso",
   "fase": 3
  },
  {
   "id": 4,
   "nom": "Aprobar la arquitectura de la solución",
   "fecha": [
    2024,
    3,
    5
   ],
   "cierre": null,
   "est": "proc",
   "estLbl": "En Proceso",
   "fase": 3
  },
  {
   "id": 5,
   "nom": "Configurar los ambientes de desarrollo",
   "fecha": [
    2024,
    4,
    10
   ],
   "cierre": [
    2024,
    4,
    24
   ],
   "est": "fin",
   "estLbl": "Finalizado",
   "fase": 4
  },
  {
   "id": 6,
   "nom": "Revisar avances quincenales",
   "fecha": [
    2024,
    5,
    1
   ],
   "cierre": null,
   "est": "proc",
   "estLbl": "En Proceso",
   "fase": 4
  },
  {
   "id": 7,
   "nom": "Definir criterios de aceptación",
   "fecha": [
    2024,
    8,
    3
   ],
   "cierre": null,
   "est": "no",
   "estLbl": "No iniciado",
   "fase": 5
  },
  {
   "id": 8,
   "nom": "Programar las capacitaciones",
   "fecha": [
    2024,
    10,
    5
   ],
   "cierre": null,
   "est": "no",
   "estLbl": "No iniciado",
   "fase": 6
  },
  {
   "id": 9,
   "nom": "Preparar el plan de salida a producción",
   "fecha": [
    2024,
    9,
    15
   ],
   "cierre": null,
   "est": "proc",
   "estLbl": "En Proceso",
   "fase": 4
  }
 ],
 "src": "Datos de ejemplo (ficticios)"
};
