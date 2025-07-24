// Tipos de datos para la aplicación de layout de oficina

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkstationInfo {
  drawerNumber?: string;
  chairNumber?: string;
  nodesWorking: boolean;
  electricalConnection: boolean;
  drawerWorking: boolean; // Nueva funcionalidad para verificar si el cajón funciona
  assignedDate?: Date;
  notes?: string;
}

export interface OfficePosition {
  id: string;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  employeeId: string | null;
  isOccupied: boolean;
  deskName?: string; // Nombre del escritorio (K1, L2, etc.)
  workstationInfo?: WorkstationInfo; // Información del puesto de trabajo
}

export interface Department {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface OfficeLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  positions: OfficePosition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryRecord {
  id: string;
  employeeId: string;
  positionId: string;
  action: 'assigned' | 'unassigned' | 'moved';
  previousPositionId?: string;
  timestamp: Date;
  notes?: string;
}

export interface ApplicationState {
  employees: Employee[];
  layout: OfficeLayout;
  departments: Department[];
  history: HistoryRecord[];
  lastUpdated: Date;
}

// Tipos para operaciones de la base de datos
export type CreateEmployeeData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEmployeeData = Partial<CreateEmployeeData>;

export type CreatePositionData = Omit<OfficePosition, 'id' | 'isOccupied'>;
export type UpdatePositionData = Partial<CreatePositionData>;

// Tipos para el estado de la aplicación
export interface DragEvent {
  employeeId: string;
  sourcePositionId?: string;
  targetPositionId: string;
}

export interface FilterOptions {
  department?: string;
  position?: string;
  searchTerm?: string;
}

// Constantes predefinidas
export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Norteamerica', color: '#3B82F6' },
  { id: '2', name: 'Sudamerica', color: '#10B981' },
  { id: '3', name: 'QSMX', color: '#8B5CF6' },
  { id: '4', name: 'P & Supply Chain', color: '#F59E0B' },
  { id: '5', name: 'Ambiental', color: '#059669' }
];

export const POSITION_TYPES = [
  'Analista',
  'Supervisor',
  'Gerente'
] as const;

export type PositionType = typeof POSITION_TYPES[number];
