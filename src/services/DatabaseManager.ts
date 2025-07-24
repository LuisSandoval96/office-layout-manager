import type { 
  ApplicationState, 
  Employee, 
  OfficePosition, 
  HistoryRecord, 
  CreateEmployeeData, 
  UpdateEmployeeData,
  OfficeLayout
} from '../types/database';
import { DEFAULT_DEPARTMENTS } from '../types/database';

const STORAGE_KEY = 'office-layout-app-data';
const BACKUP_KEY = 'office-layout-app-backup';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private state: ApplicationState;

  private constructor() {
    // Forzar recreación del layout si es necesario
    this.clearOldLayoutIfNeeded();
    this.state = this.loadFromStorage() || this.createInitialState();
  }

  // Limpiar layout anterior si detectamos el formato viejo
  private clearOldLayoutIfNeeded(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Si el layout tiene width y height pequeños (formato anterior), limpiar
        if (parsed.layout && (parsed.layout.width < 1000 || parsed.layout.height < 1000)) {
          console.log('Detectado layout anterior, limpiando datos...');
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(BACKUP_KEY);
        }
        // Si las posiciones no tienen deskName, también limpiar
        else if (parsed.layout && parsed.layout.positions && parsed.layout.positions.length > 0) {
          const firstPosition = parsed.layout.positions[0];
          if (!firstPosition.deskName) {
            console.log('Detectado formato de posiciones anterior, limpiando datos...');
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(BACKUP_KEY);
          }
          // Verificar si hay posiciones con workstationInfo que no tienen drawerWorking
          else {
            let needsMigration = false;
            parsed.layout.positions.forEach((pos: any) => {
              if (pos.workstationInfo && pos.workstationInfo.drawerWorking === undefined) {
                needsMigration = true;
                pos.workstationInfo.drawerWorking = true; // Valor por defecto
              }
            });
            if (needsMigration) {
              console.log('Migrando datos para incluir drawerWorking...');
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error verificando layout anterior:', error);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Crear estado inicial
  private createInitialState(): ApplicationState {
    const defaultLayout: OfficeLayout = {
      id: 'layout-1',
      name: 'Oficina Principal',
      width: 1200,
      height: 1900,
      positions: this.generateOfficePositions(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      employees: [],
      layout: defaultLayout,
      departments: DEFAULT_DEPARTMENTS,
      history: [],
      lastUpdated: new Date()
    };
  }

  // Generar posiciones específicas basadas en el layout proporcionado
  private generateOfficePositions(): OfficePosition[] {
    const positions: OfficePosition[] = [];
    const deskSize = 80; // Aumentamos el tamaño

    // Definir todas las posiciones del layout con sus coordenadas específicas y más espaciadas
    const layoutPositions = [
      // Lado izquierdo superior
      { name: 'K1', x: 50, y: 50 },
      { name: 'K2', x: 150, y: 50 },
      { name: 'K7', x: 50, y: 150 },
      { name: 'K9', x: 150, y: 150 },

      // Lado izquierdo medio-superior
      { name: 'L2', x: 50, y: 280 },
      { name: 'L1', x: 150, y: 280 },
      { name: 'L7', x: 50, y: 380 },
      { name: 'L8', x: 150, y: 380 },

      // Lado izquierdo medio
      { name: 'M2', x: 50, y: 510 },
      { name: 'M1', x: 150, y: 510 },
      { name: 'M5', x: 50, y: 610 },
      { name: 'M6', x: 150, y: 610 },

      // Lado izquierdo inferior (3 columnas)
      { name: 'N3', x: 50, y: 740 },
      { name: 'N2', x: 150, y: 740 },
      { name: 'N1', x: 250, y: 740 },
      { name: 'N14', x: 50, y: 840 },
      { name: 'N15', x: 150, y: 840 },
      { name: 'N16', x: 250, y: 840 },

      // Lado izquierdo más abajo (3 columnas)
      { name: 'O3', x: 50, y: 970 },
      { name: 'O2', x: 150, y: 970 },
      { name: 'O1', x: 250, y: 970 },
      { name: 'O12', x: 50, y: 1070 },
      { name: 'O13', x: 150, y: 1070 },
      { name: 'O14', x: 250, y: 1070 },

      // Lado izquierdo inferior final (3 columnas)
      { name: 'P3', x: 50, y: 1200 },
      { name: 'P2', x: 150, y: 1200 },
      { name: 'P1', x: 250, y: 1200 },
      { name: 'P14', x: 50, y: 1300 },
      { name: 'P15', x: 150, y: 1300 },
      { name: 'P16', x: 250, y: 1300 },

      // Lado izquierdo final (3 columnas)
      { name: 'Q3', x: 50, y: 1430 },
      { name: 'Q2', x: 150, y: 1430 },
      { name: 'Q1', x: 250, y: 1430 },
      { name: 'Q14', x: 50, y: 1530 },
      { name: 'Q15', x: 150, y: 1530 },
      { name: 'Q16', x: 250, y: 1530 },

      // Centro superior - Salas (más grandes y centradas)
      { name: 'SA', x: 450, y: 200, width: 120, height: 60 },
      { name: 'NA', x: 650, y: 200, width: 120, height: 60 },

      // Centro - Bloque N4-N6 (3 columnas centradas)
      { name: 'N4', x: 430, y: 350 },
      { name: 'N5', x: 530, y: 350 },
      { name: 'N6', x: 630, y: 350 },
      { name: 'N13', x: 430, y: 450 },
      { name: 'N12', x: 530, y: 450 },
      { name: 'N11', x: 630, y: 450 },

      // Centro - Bloque O4-O5 (2 columnas centradas)
      { name: 'O4', x: 480, y: 580 },
      { name: 'O5', x: 580, y: 580 },
      { name: 'O11', x: 480, y: 680 },
      { name: 'O10', x: 580, y: 680 },

      // Centro - Bloque P4-P6 (3 columnas)
      { name: 'P4', x: 430, y: 810 },
      { name: 'P5', x: 530, y: 810 },
      { name: 'P6', x: 630, y: 810 },
      { name: 'P13', x: 430, y: 910 },
      { name: 'P12', x: 530, y: 910 },
      { name: 'P11', x: 630, y: 910 },

      // Centro - Bloque Q4-Q6 (3 columnas)
      { name: 'Q4', x: 430, y: 1040 },
      { name: 'Q5', x: 530, y: 1040 },
      { name: 'Q6', x: 630, y: 1040 },
      { name: 'Q13', x: 430, y: 1140 },
      { name: 'Q12', x: 530, y: 1140 },
      { name: 'Q11', x: 630, y: 1140 },

      // Centro - Bloque R1-R4 (3 columnas)
      { name: 'R1', x: 430, y: 1270 },
      { name: 'R3', x: 530, y: 1270 },
      { name: 'R4', x: 630, y: 1270 },
      { name: 'R2', x: 430, y: 1370 },
      { name: 'R10', x: 530, y: 1370 },
      { name: 'R9', x: 630, y: 1370 },

      // Lado derecho superior
      { name: 'K3', x: 900, y: 50 },
      { name: 'K4', x: 1000, y: 50 },
      { name: 'K6', x: 900, y: 150 },
      { name: 'K5', x: 1000, y: 150 },

      // Lado derecho medio-superior
      { name: 'L3', x: 900, y: 280 },
      { name: 'L4', x: 1000, y: 280 },
      { name: 'L6', x: 900, y: 380 },
      { name: 'L5', x: 1000, y: 380 },

      // Lado derecho medio
      { name: 'M3', x: 900, y: 510 },
      { name: 'M4', x: 1000, y: 510 },
      { name: 'M7', x: 900, y: 610 },
      { name: 'M8', x: 1000, y: 610 },

      // Lado derecho medio-inferior
      { name: 'N7', x: 900, y: 740 },
      { name: 'N8', x: 1000, y: 740 },
      { name: 'N10', x: 900, y: 840 },
      { name: 'N9', x: 1000, y: 840 },

      // Lado derecho inferior
      { name: 'O6', x: 900, y: 970 },
      { name: 'O7', x: 1000, y: 970 },
      { name: 'O9', x: 900, y: 1070 },
      { name: 'O8', x: 1000, y: 1070 },

      // Lado derecho más abajo
      { name: 'P7', x: 900, y: 1200 },
      { name: 'P8', x: 1000, y: 1200 },
      { name: 'P10', x: 900, y: 1300 },
      { name: 'P9', x: 1000, y: 1300 },

      // Lado derecho final
      { name: 'Q7', x: 900, y: 1430 },
      { name: 'Q8', x: 1000, y: 1430 },
      { name: 'Q10', x: 900, y: 1530 },
      { name: 'Q9', x: 1000, y: 1530 },

      // Lado derecho último
      { name: 'R5', x: 900, y: 1660 },
      { name: 'R6', x: 1000, y: 1660 },
      { name: 'R8', x: 900, y: 1760 },
      { name: 'R7', x: 1000, y: 1760 }
    ];

    // Crear las posiciones con las coordenadas específicas
    layoutPositions.forEach((pos, index) => {
      positions.push({
        id: `pos-${pos.name}`,
        number: index + 1,
        x: pos.x,
        y: pos.y,
        width: pos.width || deskSize,
        height: pos.height || deskSize,
        employeeId: null,
        isOccupied: false,
        deskName: pos.name // Agregamos el nombre del escritorio
      });
    });

    return positions;
  }

  // Cargar datos del localStorage
  private loadFromStorage(): ApplicationState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Convertir strings de fecha de vuelta a objetos Date
        parsed.lastUpdated = new Date(parsed.lastUpdated);
        parsed.layout.createdAt = new Date(parsed.layout.createdAt);
        parsed.layout.updatedAt = new Date(parsed.layout.updatedAt);
        parsed.employees.forEach((emp: any) => {
          emp.createdAt = new Date(emp.createdAt);
          emp.updatedAt = new Date(emp.updatedAt);
        });
        parsed.history.forEach((hist: any) => {
          hist.timestamp = new Date(hist.timestamp);
        });
        return parsed;
      }
    } catch (error) {
      console.error('Error cargando datos del storage:', error);
      this.loadBackup();
    }
    return null;
  }

  // Guardar datos en localStorage
  private saveToStorage(): void {
    try {
      // Crear backup antes de guardar
      const currentData = localStorage.getItem(STORAGE_KEY);
      if (currentData) {
        localStorage.setItem(BACKUP_KEY, currentData);
      }

      this.state.lastUpdated = new Date();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error guardando datos:', error);
    }
  }

  // Cargar backup
  private loadBackup(): ApplicationState | null {
    try {
      const backupData = localStorage.getItem(BACKUP_KEY);
      if (backupData) {
        console.log('Cargando datos desde backup...');
        return JSON.parse(backupData);
      }
    } catch (error) {
      console.error('Error cargando backup:', error);
    }
    return null;
  }

  // === MÉTODOS PARA EMPLEADOS ===
  
  // Crear empleado
  public createEmployee(data: CreateEmployeeData): Employee {
    const employee: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.state.employees.push(employee);
    this.addHistoryRecord({
      employeeId: employee.id,
      positionId: '',
      action: 'assigned',
      notes: `Empleado ${employee.name} agregado al sistema`
    });

    this.saveToStorage();
    return employee;
  }

  // Obtener todos los empleados
  public getEmployees(): Employee[] {
    return [...this.state.employees];
  }

  // Obtener empleado por ID
  public getEmployeeById(id: string): Employee | null {
    return this.state.employees.find(emp => emp.id === id) || null;
  }

  // Actualizar empleado
  public updateEmployee(id: string, data: UpdateEmployeeData): Employee | null {
    const index = this.state.employees.findIndex(emp => emp.id === id);
    if (index === -1) return null;

    this.state.employees[index] = {
      ...this.state.employees[index],
      ...data,
      updatedAt: new Date()
    };

    this.addHistoryRecord({
      employeeId: id,
      positionId: '',
      action: 'assigned',
      notes: `Empleado actualizado`
    });

    this.saveToStorage();
    return this.state.employees[index];
  }

  // Eliminar empleado
  public deleteEmployee(id: string): boolean {
    const index = this.state.employees.findIndex(emp => emp.id === id);
    if (index === -1) return false;

    // Liberar posición si está ocupada
    const position = this.state.layout.positions.find(pos => pos.employeeId === id);
    if (position) {
      position.employeeId = null;
      position.isOccupied = false;
    }

    const employeeName = this.state.employees[index].name;
    this.state.employees.splice(index, 1);

    this.addHistoryRecord({
      employeeId: id,
      positionId: position?.id || '',
      action: 'unassigned',
      notes: `Empleado ${employeeName} eliminado del sistema`
    });

    this.saveToStorage();
    return true;
  }

  // === MÉTODOS PARA POSICIONES ===

  // Obtener todas las posiciones
  public getPositions(): OfficePosition[] {
    return [...this.state.layout.positions];
  }

  // Obtener posición por ID
  public getPositionById(id: string): OfficePosition | null {
    return this.state.layout.positions.find(pos => pos.id === id) || null;
  }

  // Asignar empleado a posición
  public assignEmployeeToPosition(employeeId: string, positionId: string, workstationInfo?: import('../types/database').WorkstationInfo): boolean {
    const employee = this.getEmployeeById(employeeId);
    const position = this.getPositionById(positionId);
    
    if (!employee || !position) return false;
    if (position.isOccupied) return false;

    // Liberar posición anterior si existe
    const previousPosition = this.state.layout.positions.find(pos => pos.employeeId === employeeId);
    if (previousPosition) {
      previousPosition.employeeId = null;
      previousPosition.isOccupied = false;
      previousPosition.workstationInfo = undefined;
    }

    // Asignar nueva posición
    position.employeeId = employeeId;
    position.isOccupied = true;
    position.workstationInfo = workstationInfo;

    // Crear notas detalladas para el historial
    let notes = `${employee.name} ${previousPosition ? 'movido a' : 'asignado a'} escritorio ${position.deskName || position.number}`;
    if (workstationInfo) {
      const details = [];
      if (workstationInfo.drawerNumber) details.push(`Cajón: ${workstationInfo.drawerNumber}`);
      if (workstationInfo.chairNumber) details.push(`Silla: ${workstationInfo.chairNumber}`);
      details.push(`Nodos: ${workstationInfo.nodesWorking ? 'Funcionan' : 'No funcionan'}`);
      details.push(`Eléctrico: ${workstationInfo.electricalConnection ? 'Funciona' : 'No funciona'}`);
      details.push(`Cajón: ${workstationInfo.drawerWorking ? 'Funciona' : 'No funciona'}`);
      if (details.length > 0) {
        notes += ` - ${details.join(', ')}`;
      }
      if (workstationInfo.notes) {
        notes += ` | Notas: ${workstationInfo.notes}`;
      }
    }

    this.addHistoryRecord({
      employeeId,
      positionId,
      action: previousPosition ? 'moved' : 'assigned',
      previousPositionId: previousPosition?.id,
      notes
    });

    this.saveToStorage();
    return true;
  }

  // Desasignar empleado de posición
  public unassignEmployeeFromPosition(employeeId: string): boolean {
    const position = this.state.layout.positions.find(pos => pos.employeeId === employeeId);
    if (!position) return false;

    const employee = this.getEmployeeById(employeeId);
    position.employeeId = null;
    position.isOccupied = false;
    position.workstationInfo = undefined; // Limpiar información del puesto

    this.addHistoryRecord({
      employeeId,
      positionId: position.id,
      action: 'unassigned',
      notes: `${employee?.name || 'Empleado'} removido del escritorio ${position.deskName || position.number}`
    });

    this.saveToStorage();
    return true;
  }

  // === MÉTODOS PARA HISTORIAL ===

  // Agregar registro de historial
  private addHistoryRecord(record: Omit<HistoryRecord, 'id' | 'timestamp'>): void {
    const historyRecord: HistoryRecord = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...record
    };

    this.state.history.unshift(historyRecord); // Agregar al inicio

    // Mantener solo los últimos 1000 registros
    if (this.state.history.length > 1000) {
      this.state.history = this.state.history.slice(0, 1000);
    }
  }

  // Obtener historial
  public getHistory(limit?: number): HistoryRecord[] {
    const history = [...this.state.history];
    return limit ? history.slice(0, limit) : history;
  }

  // === MÉTODOS PARA DEPARTAMENTOS ===

  public getDepartments() {
    return [...this.state.departments];
  }

  // === MÉTODOS PARA LAYOUT ===

  public getLayout(): OfficeLayout {
    return { ...this.state.layout };
  }

  // === MÉTODOS DE UTILIDAD ===

  // Obtener estadísticas
  public getStatistics() {
    const totalPositions = this.state.layout.positions.length;
    const occupiedPositions = this.state.layout.positions.filter(pos => pos.isOccupied).length;
    const totalEmployees = this.state.employees.length;
    const employeesByDepartment = this.state.employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Estadísticas de puestos de trabajo
    const workstationStats = this.getWorkstationStatistics();

    return {
      totalPositions,
      occupiedPositions,
      availablePositions: totalPositions - occupiedPositions,
      totalEmployees,
      assignedEmployees: occupiedPositions,
      unassignedEmployees: totalEmployees - occupiedPositions,
      employeesByDepartment,
      occupancyRate: totalPositions > 0 ? (occupiedPositions / totalPositions) * 100 : 0,
      workstationStats
    };
  }

  // Obtener estadísticas de puestos de trabajo
  public getWorkstationStatistics() {
    const occupiedPositions = this.state.layout.positions.filter(pos => pos.isOccupied && pos.workstationInfo);
    
    const totalWithInfo = occupiedPositions.length;
    const nodesWorking = occupiedPositions.filter(pos => pos.workstationInfo?.nodesWorking).length;
    const electricalWorking = occupiedPositions.filter(pos => pos.workstationInfo?.electricalConnection).length;
    const drawerWorking = occupiedPositions.filter(pos => pos.workstationInfo?.drawerWorking).length;
    const withDrawer = occupiedPositions.filter(pos => pos.workstationInfo?.drawerNumber).length;
    const withChair = occupiedPositions.filter(pos => pos.workstationInfo?.chairNumber).length;

    return {
      totalAssignmentsWithInfo: totalWithInfo,
      nodesWorkingCount: nodesWorking,
      nodesWorkingPercentage: totalWithInfo > 0 ? (nodesWorking / totalWithInfo) * 100 : 0,
      electricalWorkingCount: electricalWorking,
      electricalWorkingPercentage: totalWithInfo > 0 ? (electricalWorking / totalWithInfo) * 100 : 0,
      drawerWorkingCount: drawerWorking,
      drawerWorkingPercentage: totalWithInfo > 0 ? (drawerWorking / totalWithInfo) * 100 : 0,
      drawerAssignedCount: withDrawer,
      chairAssignedCount: withChair,
      workstationIssues: occupiedPositions.filter(pos => 
        !pos.workstationInfo?.nodesWorking || !pos.workstationInfo?.electricalConnection || !pos.workstationInfo?.drawerWorking
      ).map(pos => ({
        deskName: pos.deskName || `Posición ${pos.number}`,
        employee: this.getEmployeeById(pos.employeeId!)?.name || 'Desconocido',
        issues: [
          ...(!pos.workstationInfo?.nodesWorking ? ['Nodos no funcionan'] : []),
          ...(!pos.workstationInfo?.electricalConnection ? ['Conexión eléctrica no funciona'] : []),
          ...(!pos.workstationInfo?.drawerWorking ? ['Cajón no funciona'] : [])
        ]
      }))
    };
  }

  // Exportar datos
  public exportData(): string {
    return JSON.stringify(this.state, null, 2);
  }

  // Importar datos
  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      // Validar estructura básica
      if (data.employees && data.layout && data.departments && data.history) {
        this.state = data;
        this.saveToStorage();
        return true;
      }
    } catch (error) {
      console.error('Error importando datos:', error);
    }
    return false;
  }

  // Limpiar todos los datos
  public clearAllData(): void {
    this.state = this.createInitialState();
    this.saveToStorage();
  }
}
