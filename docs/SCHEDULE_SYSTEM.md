# Sistema de Agendamiento y Horarios

Este documento describe la arquitectura y las reglas de negocio detrás del sistema de horarios dinámicos de PatyNails.

## 1. Almacenamiento de Configuración (Firestore)

La configuración global del negocio se almacena en Firebase Firestore.
- **Colección:** `settings`
- **Documento:** `business`

### Estructura de Datos
```json
{
  "openingTime": "07:00",
  "closingTime": "19:00",
  "slotInterval": 30,
  "minimumAppointmentDuration": 30,
  "timezone": "America/Asuncion"
}
```
Si este documento no existe, el sistema utiliza valores por defecto provistos en `scheduleService.js`.

---

## 2. Lógica Central (`scheduleService.js`)

Todos los cálculos de tiempo, disponibilidad y conflictos pasan exclusivamente por `src/services/schedule/scheduleService.js`. 

No se debe calcular el tiempo manualmente sumando minutos en componentes de UI.

### `generateTimeSlots()`
Genera los intervalos para la grilla visual de la agenda. 
Por ejemplo, si `slotInterval` es `30`, genera: `07:00`, `07:30`, `08:00`, etc., hasta llegar a `closingTime`.

### `checkAvailability()`
Verifica si un bloque horario y duración son válidos. Las reglas aplicadas son:
1. **Límites de negocio:** El inicio no puede ser menor a `openingTime` y el fin del servicio no puede superar el `closingTime`.
2. **Duración mínima:** Se asegura de reservar al menos la duración mínima estipulada (`minimumAppointmentDuration`).
3. **Superposición (Conflictos):** Revisa que el bloque solicitado no intercepte con ningún otro turno existente. Se ignoran los turnos `cancelled` y `no_show`.

### `getAvailableAppointments()`
Calcula dinámicamente qué horarios puede seleccionar un cliente para un servicio. Genera todos los slots posibles del día y los filtra uno por uno a través de `checkAvailability`.

---

## 3. Experiencia de Usuario (Componentes)

### Reserva Online (`UserBookingModal.jsx`)
En vez de permitir al cliente elegir cualquier hora (y arrojar error al guardar si estaba ocupado), el sistema obtiene previamente todos los turnos del día y filtra la lista de horarios. **Solo se muestran los botones de los horarios en los que el servicio entra perfectamente.**

### Agenda Administrativa (`WeeklyAgendaView.jsx`)
La grilla se dibuja usando CSS dinámico (posicionamiento absoluto de los bloques). 
- El `rowHeight` (alto de fila) se multiplica por los slots ocupados.
- Si cambias `slotInterval` a 15 o a 60 minutos desde Ajustes, el calendario redibuja la estructura sin deformar los bloques de servicios reales.

---

## 4. Retrocompatibilidad

Originalmente, el sistema utilizaba un objeto estático `BUSINESS_HOURS` en `src/constants/app.js`.
Ese objeto fue renombrado a `DEPRECATED_BUSINESS_HOURS`. Algunos componentes secundarios pueden seguir utilizándolo temporalmente (ej: textos informativos en el landing page), pero toda lógica que involucre crear o validar un turno ahora usa la configuración dinámica de Firestore.
