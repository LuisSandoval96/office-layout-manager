import { DatabaseManager } from './DatabaseManager';
import { FirebaseDatabaseManager } from './FirebaseDatabaseManager';
import { isFirebaseConfigured } from '../config/database';
import type { 
  ApplicationState, 
  Employee, 
  HistoryRecord, 
  CreateEmployeeData, 
  UpdateEmployeeData,
  OfficeLayout,
  Department
} from '../types/database';

// Interface común para ambos database managers
interface IDatabaseManager {
  getState(): ApplicationState;
  getEmployees(): Employee[];
  getLayout(): OfficeLayout;
  getDepartments(): Department[];
  getHistory(): HistoryRecord[];
  
  // Métodos adicionales que necesita App.tsx
  getPositions(): any[];
  getEmployeeById(id: string): Employee | null;
  getPositionById(id: string): any | null;
  
  createEmployee(data: CreateEmployeeData): Promise<Employee>;
  updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee | null>;
  deleteEmployee(id: string): Promise<boolean>;
  
  assignEmployeeToPosition(employeeId: string, positionId: string, workstationInfo?: any): Promise<boolean>;
  unassignEmployeeFromPosition(employeeId: string): Promise<boolean>;
  updateWorkstationInfo(positionNumber: number, workstationInfo: any): Promise<boolean>;
  
  // Métodos adicionales
  getStatistics(): any;
  clearAllData(): Promise<void>;
  
  subscribe(listener: (state: ApplicationState) => void): () => void;
  exportData(): ApplicationState;
  importData(data: ApplicationState): Promise<void>;
}

class DatabaseManagerWrapper implements IDatabaseManager {
  private manager: IDatabaseManager;

  constructor() {
    if (isFirebaseConfigured()) {
      console.log('Using Firebase Database Manager');
      this.manager = FirebaseDatabaseManager.getInstance();
    } else {
      console.log('Using Local Storage Database Manager');
      this.manager = DatabaseManager.getInstance() as unknown as IDatabaseManager;
    }
  }

  getState(): ApplicationState {
    return this.manager.getState();
  }

  getEmployees(): Employee[] {
    return this.manager.getEmployees();
  }

  getLayout(): OfficeLayout {
    return this.manager.getLayout();
  }

  getDepartments(): Department[] {
    return this.manager.getDepartments();
  }

  getHistory(): HistoryRecord[] {
    return this.manager.getHistory();
  }

  getPositions(): any[] {
    return this.manager.getLayout().positions;
  }

  getEmployeeById(id: string): Employee | null {
    return this.manager.getEmployees().find(emp => emp.id === id) || null;
  }

  getPositionById(id: string): any | null {
    return this.manager.getLayout().positions.find(pos => pos.id === id) || null;
  }

  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    return this.manager.createEmployee(data);
  }

  async updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee | null> {
    return this.manager.updateEmployee(id, data);
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.manager.deleteEmployee(id);
  }

  async assignEmployeeToPosition(employeeId: string, positionId: string, workstationInfo?: any): Promise<boolean> {
    if (workstationInfo) {
      // Si hay workstationInfo, primero asignar y luego actualizar la información
      const positionNumber = parseInt(positionId.replace('pos-', ''));
      const success = await this.manager.assignEmployeeToPosition(employeeId, positionId);
      if (success) {
        await this.manager.updateWorkstationInfo(positionNumber, workstationInfo);
      }
      return success;
    } else {
      return this.manager.assignEmployeeToPosition(employeeId, positionId);
    }
  }

  async unassignEmployeeFromPosition(employeeId: string): Promise<boolean> {
    return this.manager.unassignEmployeeFromPosition(employeeId);
  }

  async updateWorkstationInfo(positionNumber: number, workstationInfo: any): Promise<boolean> {
    return this.manager.updateWorkstationInfo(positionNumber, workstationInfo);
  }

  subscribe(listener: (state: ApplicationState) => void): () => void {
    return this.manager.subscribe(listener);
  }

  exportData(): ApplicationState {
    return this.manager.exportData();
  }

  async importData(data: ApplicationState): Promise<void> {
    return this.manager.importData(data);
  }

  getStatistics(): any {
    return this.manager.getStatistics();
  }

  async clearAllData(): Promise<void> {
    return this.manager.clearAllData();
  }
}

// Singleton para el wrapper
let instance: DatabaseManagerWrapper | null = null;

export const getDatabaseManager = (): DatabaseManagerWrapper => {
  if (!instance) {
    instance = new DatabaseManagerWrapper();
  }
  return instance;
};

export default getDatabaseManager;
