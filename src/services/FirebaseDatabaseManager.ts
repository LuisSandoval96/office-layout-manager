import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { 
  ApplicationState, 
  Employee, 
  OfficePosition, 
  HistoryRecord, 
  CreateEmployeeData, 
  UpdateEmployeeData,
  OfficeLayout,
  Department
} from '../types/database';
import { DEFAULT_DEPARTMENTS } from '../types/database';

const COLLECTION_NAME = 'office-layout-state';
const DOCUMENT_ID = 'main-state';

export class FirebaseDatabaseManager {
  private static instance: FirebaseDatabaseManager;
  private state: ApplicationState;
  private listeners: ((state: ApplicationState) => void)[] = [];
  private unsubscribe: (() => void) | null = null;

  private constructor() {
    this.state = this.createInitialState();
    this.initializeFirebaseListener();
  }

  public static getInstance(): FirebaseDatabaseManager {
    if (!FirebaseDatabaseManager.instance) {
      FirebaseDatabaseManager.instance = new FirebaseDatabaseManager();
    }
    return FirebaseDatabaseManager.instance;
  }

  private initializeFirebaseListener(): void {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    
    this.unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        this.state = this.convertFirebaseToState(data);
      } else {
        // Si no existe el documento, crear uno inicial
        this.initializeFirebaseDocument();
      }
      this.notifyListeners();
    }, (error) => {
      console.error('Error listening to Firebase changes:', error);
      // Fallback a estado inicial si hay error
      this.state = this.createInitialState();
      this.notifyListeners();
    });
  }

  private async initializeFirebaseDocument(): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const initialState = this.createInitialState();
      const firebaseData = this.convertStateToFirebase(initialState);
      
      await setDoc(docRef, firebaseData);
      console.log('Firebase document initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase document:', error);
    }
  }

  private convertFirebaseToState(data: any): ApplicationState {
    return {
      employees: data.employees || [],
      layout: {
        ...data.layout,
        createdAt: data.layout?.createdAt?.toDate() || new Date(),
        updatedAt: data.layout?.updatedAt?.toDate() || new Date()
      },
      departments: data.departments || DEFAULT_DEPARTMENTS,
      history: (data.history || []).map((record: any) => ({
        ...record,
        timestamp: record.timestamp?.toDate() || new Date()
      })),
      lastUpdated: data.lastUpdated?.toDate() || new Date()
    };
  }

  private convertStateToFirebase(state: ApplicationState): any {
    return {
      employees: state.employees,
      layout: {
        ...state.layout,
        createdAt: Timestamp.fromDate(state.layout.createdAt),
        updatedAt: Timestamp.fromDate(new Date())
      },
      departments: state.departments,
      history: state.history.map(record => ({
        ...record,
        timestamp: Timestamp.fromDate(record.timestamp)
      })),
      lastUpdated: serverTimestamp()
    };
  }

  private async saveToFirebase(): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const firebaseData = this.convertStateToFirebase(this.state);
      
      await updateDoc(docRef, firebaseData);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      throw error;
    }
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
    const deskSize = 80;

    // Definición de posiciones específicas del layout
    const layoutPositions = [
      // Fila superior (escritorios 1-8)
      { x: 50, y: 50, number: 1, deskName: "Desk 1" },
      { x: 150, y: 50, number: 2, deskName: "Desk 2" },
      { x: 250, y: 50, number: 3, deskName: "Desk 3" },
      { x: 350, y: 50, number: 4, deskName: "Desk 4" },
      { x: 450, y: 50, number: 5, deskName: "Desk 5" },
      { x: 550, y: 50, number: 6, deskName: "Desk 6" },
      { x: 650, y: 50, number: 7, deskName: "Desk 7" },
      { x: 750, y: 50, number: 8, deskName: "Desk 8" },

      // Escritorios centrales lado izquierdo (9-16)
      { x: 50, y: 200, number: 9, deskName: "Desk 9" },
      { x: 50, y: 300, number: 10, deskName: "Desk 10" },
      { x: 50, y: 400, number: 11, deskName: "Desk 11" },
      { x: 50, y: 500, number: 12, deskName: "Desk 12" },
      { x: 50, y: 600, number: 13, deskName: "Desk 13" },
      { x: 50, y: 700, number: 14, deskName: "Desk 14" },
      { x: 50, y: 800, number: 15, deskName: "Desk 15" },
      { x: 50, y: 900, number: 16, deskName: "Desk 16" },

      // Escritorios centrales lado derecho (17-24)
      { x: 750, y: 200, number: 17, deskName: "Desk 17" },
      { x: 750, y: 300, number: 18, deskName: "Desk 18" },
      { x: 750, y: 400, number: 19, deskName: "Desk 19" },
      { x: 750, y: 500, number: 20, deskName: "Desk 20" },
      { x: 750, y: 600, number: 21, deskName: "Desk 21" },
      { x: 750, y: 700, number: 22, deskName: "Desk 22" },
      { x: 750, y: 800, number: 23, deskName: "Desk 23" },
      { x: 750, y: 900, number: 24, deskName: "Desk 24" },

      // Área central - isla de escritorios (25-32)
      { x: 300, y: 350, number: 25, deskName: "Desk 25" },
      { x: 400, y: 350, number: 26, deskName: "Desk 26" },
      { x: 500, y: 350, number: 27, deskName: "Desk 27" },
      { x: 300, y: 450, number: 28, deskName: "Desk 28" },
      { x: 400, y: 450, number: 29, deskName: "Desk 29" },
      { x: 500, y: 450, number: 30, deskName: "Desk 30" },
      { x: 350, y: 550, number: 31, deskName: "Desk 31" },
      { x: 450, y: 550, number: 32, deskName: "Desk 32" },

      // Área inferior - escritorios en L (33-40)
      { x: 150, y: 1100, number: 33, deskName: "Desk 33" },
      { x: 250, y: 1100, number: 34, deskName: "Desk 34" },
      { x: 350, y: 1100, number: 35, deskName: "Desk 35" },
      { x: 450, y: 1100, number: 36, deskName: "Desk 36" },
      { x: 550, y: 1100, number: 37, deskName: "Desk 37" },
      { x: 650, y: 1100, number: 38, deskName: "Desk 38" },
      { x: 150, y: 1200, number: 39, deskName: "Desk 39" },
      { x: 650, y: 1200, number: 40, deskName: "Desk 40" },

      // Escritorios adicionales parte inferior (41-50)
      { x: 50, y: 1350, number: 41, deskName: "Desk 41" },
      { x: 150, y: 1350, number: 42, deskName: "Desk 42" },
      { x: 250, y: 1350, number: 43, deskName: "Desk 43" },
      { x: 350, y: 1350, number: 44, deskName: "Desk 44" },
      { x: 450, y: 1350, number: 45, deskName: "Desk 45" },
      { x: 550, y: 1350, number: 46, deskName: "Desk 46" },
      { x: 650, y: 1350, number: 47, deskName: "Desk 47" },
      { x: 750, y: 1350, number: 48, deskName: "Desk 48" },
      { x: 300, y: 1450, number: 49, deskName: "Desk 49" },
      { x: 500, y: 1450, number: 50, deskName: "Desk 50" },

      // Escritorios finales (51-60)
      { x: 100, y: 1600, number: 51, deskName: "Desk 51" },
      { x: 200, y: 1600, number: 52, deskName: "Desk 52" },
      { x: 300, y: 1600, number: 53, deskName: "Desk 53" },
      { x: 400, y: 1600, number: 54, deskName: "Desk 54" },
      { x: 500, y: 1600, number: 55, deskName: "Desk 55" },
      { x: 600, y: 1600, number: 56, deskName: "Desk 56" },
      { x: 700, y: 1600, number: 57, deskName: "Desk 57" },
      { x: 250, y: 1700, number: 58, deskName: "Desk 58" },
      { x: 400, y: 1700, number: 59, deskName: "Desk 59" },
      { x: 550, y: 1700, number: 60, deskName: "Desk 60" },
    ];

    layoutPositions.forEach(pos => {
      positions.push({
        id: `pos-${pos.number}`,
        x: pos.x,
        y: pos.y,
        width: deskSize,
        height: deskSize,
        number: pos.number,
        deskName: pos.deskName,
        employeeId: null,
        isOccupied: false,
        workstationInfo: undefined
      });
    });

    return positions;
  }

  // Métodos públicos para suscripción a cambios
  public subscribe(listener: (state: ApplicationState) => void): () => void {
    this.listeners.push(listener);
    // Llamar inmediatamente con el estado actual
    listener(this.state);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Métodos de acceso a datos
  public getState(): ApplicationState {
    return { ...this.state };
  }

  public getEmployees(): Employee[] {
    return [...this.state.employees];
  }

  public getLayout(): OfficeLayout {
    return { ...this.state.layout };
  }

  public getDepartments(): Department[] {
    return [...this.state.departments];
  }

  public getHistory(): HistoryRecord[] {
    return [...this.state.history];
  }

  // Métodos adicionales para compatibilidad
  public getPositions(): any[] {
    return this.getLayout().positions;
  }

  public getEmployeeById(id: string): Employee | null {
    return this.getEmployees().find(emp => emp.id === id) || null;
  }

  public getPositionById(id: string): any | null {
    return this.getLayout().positions.find(pos => pos.id === id) || null;
  }

  // Métodos de modificación de datos
  public async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      department: data.department,
      position: data.position,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.state.employees.push(newEmployee);
    
    // Añadir a historial
    this.addToHistory('employee_created', `Empleado ${newEmployee.name} creado`);
    
    await this.saveToFirebase();
    return newEmployee;
  }

  public async updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee | null> {
    const employeeIndex = this.state.employees.findIndex(emp => emp.id === id);
    if (employeeIndex === -1) return null;

    this.state.employees[employeeIndex] = {
      ...this.state.employees[employeeIndex],
      ...data,
      updatedAt: new Date()
    };

    // Añadir a historial
    this.addToHistory('employee_updated', `Empleado ${this.state.employees[employeeIndex].name} actualizado`);
    
    await this.saveToFirebase();
    return this.state.employees[employeeIndex];
  }

  public async deleteEmployee(id: string): Promise<boolean> {
    const employeeIndex = this.state.employees.findIndex(emp => emp.id === id);
    if (employeeIndex === -1) return false;

    const employeeName = this.state.employees[employeeIndex].name;
    
    // Quitar empleado de cualquier posición
    this.state.layout.positions.forEach(pos => {
      if (pos.employeeId === id) {
        pos.employeeId = null;
      }
    });

    this.state.employees.splice(employeeIndex, 1);
    
    // Añadir a historial
    this.addToHistory('employee_deleted', `Empleado ${employeeName} eliminado`);
    
    await this.saveToFirebase();
    return true;
  }

  public async assignEmployeeToPosition(employeeId: string, positionId: string): Promise<boolean> {
    const positionNumber = parseInt(positionId.replace('pos-', ''));
    const employee = this.state.employees.find(emp => emp.id === employeeId);
    const position = this.state.layout.positions.find(pos => pos.number === positionNumber);
    
    if (!employee || !position) return false;

    // Quitar empleado de posición anterior si existe
    this.state.layout.positions.forEach(pos => {
      if (pos.employeeId === employeeId) {
        pos.employeeId = null;
      }
    });

    // Quitar cualquier otro empleado de la nueva posición
    if (position.employeeId) {
      const previousEmployee = this.state.employees.find(emp => emp.id === position.employeeId);
      if (previousEmployee) {
        this.addToHistory('unassigned', `${previousEmployee.name} removido de posición ${positionNumber}`);
      }
    }

    // Asignar empleado a nueva posición
    position.employeeId = employeeId;
    employee.position = positionNumber.toString();
    employee.updatedAt = new Date();

    // Añadir a historial
    this.addToHistory('assigned', `${employee.name} asignado a posición ${positionNumber}`);
    
    await this.saveToFirebase();
    return true;
  }

  public async unassignEmployeeFromPosition(employeeId: string): Promise<boolean> {
    const employee = this.state.employees.find(emp => emp.id === employeeId);
    if (!employee) return false;

    // Quitar empleado de cualquier posición
    this.state.layout.positions.forEach(pos => {
      if (pos.employeeId === employeeId) {
        pos.employeeId = null;
      }
    });

    employee.position = "";
    employee.updatedAt = new Date();

    // Añadir a historial
    this.addToHistory('unassigned', `${employee.name} removido de su posición`);
    
    await this.saveToFirebase();
    return true;
  }

  public async updateWorkstationInfo(positionNumber: number, workstationInfo: any): Promise<boolean> {
    const position = this.state.layout.positions.find(pos => pos.number === positionNumber);
    if (!position) return false;

    position.workstationInfo = workstationInfo;
    
    // Añadir a historial
    this.addToHistory('workstation_updated', `Información de estación ${positionNumber} actualizada`);
    
    await this.saveToFirebase();
    return true;
  }

  private addToHistory(action: 'assigned' | 'unassigned' | 'moved' | 'employee_created' | 'employee_updated' | 'employee_deleted' | 'workstation_updated', description: string): void {
    const historyRecord: HistoryRecord = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      employeeId: '',
      positionId: '',
      action: action as 'assigned' | 'unassigned' | 'moved',
      timestamp: new Date(),
      notes: description
    };

    this.state.history.unshift(historyRecord);
    
    // Mantener solo los últimos 100 registros
    if (this.state.history.length > 100) {
      this.state.history = this.state.history.slice(0, 100);
    }
  }

  // Método para limpiar los listeners cuando no se necesiten más
  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.listeners = [];
  }

  // Método para exportar datos (útil para backups)
  public exportData(): ApplicationState {
    return { ...this.state };
  }

  // Método para importar datos (útil para restaurar backups)
  public async importData(data: ApplicationState): Promise<void> {
    this.state = { ...data };
    await this.saveToFirebase();
  }

  // Métodos de estadísticas
  public getStatistics() {
    const employees = this.state.employees;
    const positions = this.state.layout.positions;
    const totalPositions = positions.length;
    const occupiedPositions = positions.filter(pos => pos.employeeId !== null).length;
    const availablePositions = totalPositions - occupiedPositions;
    
    const departmentStats = this.state.departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept.name);
      return {
        name: dept.name,
        count: deptEmployees.length,
        color: dept.color
      };
    });

    return {
      totalEmployees: employees.length,
      totalPositions,
      occupiedPositions,
      availablePositions,
      occupancyRate: totalPositions > 0 ? (occupiedPositions / totalPositions) * 100 : 0,
      departmentStats
    };
  }

  // Método para limpiar todos los datos
  public async clearAllData(): Promise<void> {
    this.state = this.createInitialState();
    await this.saveToFirebase();
  }
}
