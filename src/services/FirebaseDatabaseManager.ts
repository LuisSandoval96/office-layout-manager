import { 
  doc, 
  setDoc, 
  getDoc,
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
  Department,
  WorkstationInfo
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
    
    console.log('🔄 SYNC: Initializing Firebase listener...');
    console.log('🔄 SYNC: Document path:', `${COLLECTION_NAME}/${DOCUMENT_ID}`);
    
    this.unsubscribe = onSnapshot(docRef, (doc) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔄 SYNC [${timestamp}]: Firebase document change detected`);
      console.log('🔄 SYNC: Document exists:', doc.exists());
      console.log('🔄 SYNC: Document metadata:', {
        fromCache: doc.metadata.fromCache,
        hasPendingWrites: doc.metadata.hasPendingWrites
      });
      
      if (doc.exists()) {
        const data = doc.data();
        console.log('🔄 SYNC: Firebase data received:', {
          employeesCount: data.employees?.length || 0,
          positionsCount: data.layout?.positions?.length || 0,
          assignedPositions: data.layout?.positions?.filter((p: any) => p.employeeId).length || 0,
          lastUpdated: data.lastUpdated?.toDate?.()?.toLocaleString() || 'No timestamp'
        });
        
        // 🔄 SYNC: Log detailed employee data
        if (data.employees && data.employees.length > 0) {
          console.log('🔄 SYNC: Employee details from Firebase:', data.employees.map((emp: any) => ({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            department: emp.department,
            updatedAt: emp.updatedAt?.toDate?.()?.toLocaleString() || 'No timestamp'
          })));
        }
        
        // Log de posiciones asignadas
        const assignedPositions = data.layout?.positions?.filter((p: any) => p.employeeId) || [];
        console.log('🔄 SYNC: Assigned positions from Firebase:', assignedPositions.map((p: any) => ({
          deskName: p.deskName || p.number,
          employeeId: p.employeeId,
          isOccupied: p.isOccupied
        })));
        
        this.state = this.convertFirebaseToState(data);
        
        // Verificar estado después de conversión
        const stateAssigned = this.state.layout.positions.filter(p => p.employeeId);
        console.log('🔄 SYNC: Assigned positions after conversion:', stateAssigned.map(p => ({
          deskName: p.deskName || p.number,
          employeeId: p.employeeId,
          isOccupied: p.isOccupied
        })));
        
        // 🔄 SYNC: Log final employee count after conversion
        console.log(`🔄 SYNC: Final employee count after conversion: ${this.state.employees.length}`);
        console.log('🔄 SYNC: Final employees list:', this.state.employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          position: emp.position,
          department: emp.department
        })));
      } else {
        console.log('🔄 SYNC: Firebase document does not exist, creating initial document');
        // Si no existe el documento, crear uno inicial
        this.initializeFirebaseDocument();
      }
      console.log('🔄 SYNC: Notifying listeners of state change');
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
    // ⚠️ DETECTIVE: Log incoming data from Firebase
    console.log('🔍 CONVERT FROM FIREBASE: Raw employee data:', data.employees?.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      position: emp.position,
      positionType: typeof emp.position,
      department: emp.department
    })));
    
    const convertedEmployees = data.employees || [];
    
    // ⚠️ DETECTIVE: Check if any employee has corrupted position data
    convertedEmployees.forEach((emp: any) => {
      if (/^\d+$/.test(emp.position)) {
        console.error('🚨 CORRUPTION DETECTED in Firebase data:', {
          name: emp.name,
          corruptedPosition: emp.position,
          positionType: typeof emp.position,
          department: emp.department
        });
      }
    });

    return {
      employees: convertedEmployees,
      layout: {
        ...data.layout,
        positions: (data.layout?.positions || []).map((pos: any) => ({
          ...pos,
          isOccupied: pos.employeeId !== null && pos.employeeId !== undefined
        })),
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
    // ⚠️ DETECTIVE: Check employees BEFORE sending to Firebase
    console.log('🔍 CONVERT TO FIREBASE: Employee data being sent:', state.employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      position: emp.position,
      positionType: typeof emp.position,
      department: emp.department
    })));
    
    // ⚠️ DETECTIVE: Check for corruption before sending
    state.employees.forEach(emp => {
      if (/^\d+$/.test(emp.position)) {
        console.error('🚨 CORRUPTION DETECTED before sending to Firebase:', {
          name: emp.name,
          corruptedPosition: emp.position,
          positionType: typeof emp.position,
          department: emp.department
        });
        console.error('🚨 This employee will be sent to Firebase with corrupted data!');
      }
    });

    // 🔧 DEEP CLEAN: Remove ALL undefined values recursively
    const deepCleanObject = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      
      // Handle Date objects - convert to Timestamp for Firebase
      if (obj instanceof Date) {
        return Timestamp.fromDate(obj);
      }
      
      // Handle Timestamp objects - keep as is
      if (obj && typeof obj === 'object' && obj.toDate && typeof obj.toDate === 'function') {
        return obj; // Already a Firebase Timestamp
      }
      
      if (Array.isArray(obj)) {
        return obj.filter(item => item !== undefined).map(deepCleanObject);
      }
      
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = deepCleanObject(value);
          }
        }
        return cleaned;
      }
      
      return obj;
    };

    // Limpiar empleados más agresivamente
    const cleanEmployees = state.employees
      .filter(emp => emp && emp.id && emp.name)
      .map(emp => {
        const cleanEmp: any = {
          id: emp.id,
          name: emp.name || 'Sin nombre',
          department: emp.department || 'General',
          position: emp.position || 'Empleado'
        };
        
        // Solo agregar timestamps si existen
        if (emp.createdAt) {
          cleanEmp.createdAt = emp.createdAt instanceof Date ? Timestamp.fromDate(emp.createdAt) : emp.createdAt;
        }
        if (emp.updatedAt) {
          cleanEmp.updatedAt = emp.updatedAt instanceof Date ? Timestamp.fromDate(emp.updatedAt) : emp.updatedAt;
        }
        
        return deepCleanObject(cleanEmp);
      });

    const cleanDepartments = state.departments
      .filter(dept => dept && dept.id)
      .map(dept => deepCleanObject(dept));
      
    const cleanHistory = state.history
      .filter(record => record && record.timestamp)
      .map(record => {
        const cleanRecord: any = { ...record };
        if (cleanRecord.timestamp instanceof Date) {
          cleanRecord.timestamp = Timestamp.fromDate(cleanRecord.timestamp);
        }
        return deepCleanObject(cleanRecord);
      });
    
    // Verificar asignaciones antes de guardar con más detalle
    const assignedPositions = state.layout.positions.filter(pos => pos.employeeId);
    console.log('CONVERT: Total positions:', state.layout.positions.length);
    console.log('CONVERT: Assigned positions before saving:', assignedPositions.length);
    console.log('CONVERT: Assigned positions details:', assignedPositions.map(pos => ({
      id: pos.id,
      number: pos.number,
      deskName: pos.deskName || pos.number,
      employeeId: pos.employeeId,
      isOccupied: pos.isOccupied
    })));
    
    // Limpiar posiciones de manera más agresiva
    const cleanPositions = state.layout.positions.map(pos => {
      const cleanPos: any = {
        id: pos.id,
        number: pos.number,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        employeeId: pos.employeeId || null,
        isOccupied: pos.isOccupied || false,
        deskName: pos.deskName || `Desk-${pos.number}`
      };
      
      // Solo agregar workstationInfo si existe y está completo
      if (pos.workstationInfo && Object.keys(pos.workstationInfo).length > 0) {
        const cleanWorkstation: any = { ...pos.workstationInfo };
        if (cleanWorkstation.assignedDate instanceof Date) {
          cleanWorkstation.assignedDate = Timestamp.fromDate(cleanWorkstation.assignedDate);
        } else if (!cleanWorkstation.assignedDate) {
          cleanWorkstation.assignedDate = Timestamp.fromDate(new Date());
        }
        cleanPos.workstationInfo = deepCleanObject(cleanWorkstation);
      }
      
      return cleanPos;
    });
    
    console.log('CONVERT: Clean positions count:', cleanPositions.length);
    console.log('CONVERT: Clean assigned positions:', cleanPositions.filter(p => p.employeeId).length);
    
    const firebaseData = {
      employees: cleanEmployees,
      layout: {
        id: state.layout.id || 'layout-1',
        name: state.layout.name || 'Oficina Principal',
        width: state.layout.width || 1200,
        height: state.layout.height || 1900,
        positions: cleanPositions,
        createdAt: Timestamp.fromDate(state.layout.createdAt || new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      },
      departments: cleanDepartments,
      history: cleanHistory,
      lastUpdated: serverTimestamp()
    };

    // 🔧 FINAL VALIDATION: Check for any remaining undefined values
    const validateNoUndefined = (obj: any, path = ''): boolean => {
      if (obj === undefined) {
        console.error(`🚨 UNDEFINED FOUND at path: ${path}`);
        return false;
      }
      
      if (Array.isArray(obj)) {
        return obj.every((item, index) => validateNoUndefined(item, `${path}[${index}]`));
      }
      
      if (obj && typeof obj === 'object') {
        return Object.entries(obj).every(([key, value]) => 
          validateNoUndefined(value, path ? `${path}.${key}` : key)
        );
      }
      
      return true;
    };

    const isValid = validateNoUndefined(firebaseData);
    if (!isValid) {
      console.error('🚨 FIREBASE DATA CONTAINS UNDEFINED VALUES - CLEANING AGAIN');
      return deepCleanObject(firebaseData);
    }

    console.log('✅ FIREBASE DATA IS CLEAN - No undefined values found');
    return firebaseData;
  }

  private async saveToFirebase(): Promise<void> {
    try {
      console.log('SAVE: Starting save to Firebase...');
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      
      // 🔧 CRITICAL: Clean state before conversion
      console.log('SAVE: Cleaning state before conversion...');
      
      const firebaseData = this.convertStateToFirebase(this.state);
      
      console.log('SAVE: Firebase data to save:', {
        employeesCount: firebaseData.employees?.length || 0,
        positionsCount: firebaseData.layout?.positions?.length || 0,
        assignedPositions: firebaseData.layout?.positions?.filter((p: any) => p.employeeId)?.length || 0
      });
      
      // Log specific assignment data with more detail
      const assignedPositions = firebaseData.layout?.positions?.filter((p: any) => p.employeeId) || [];
      console.log('SAVE: Assigned positions data (detailed):', assignedPositions.map((p: any) => ({
        id: p.id,
        number: p.number,
        deskName: p.deskName,
        employeeId: p.employeeId,
        isOccupied: p.isOccupied,
        hasWorkstationInfo: !!p.workstationInfo
      })));
      
      // Verificar que los empleados existen y tienen datos válidos
      const employeesData = firebaseData.employees || [];
      console.log('SAVE: Employees data (detailed):', employeesData.map((e: any) => ({
        id: e.id,
        name: e.name,
        position: e.position,
        department: e.department
      })));
      
      // 🔧 ULTRA SAFE SAVE: Try multiple methods
      console.log('SAVE: Attempting safe save to Firebase...');
      
      try {
        // Method 1: Use setDoc with complete replacement
        await setDoc(docRef, firebaseData);
        console.log('SAVE: ✅ setDoc completed successfully');
      } catch (setDocError) {
        console.error('SAVE: ❌ setDoc failed, trying merge method:', setDocError);
        
        try {
          // Method 2: Use setDoc with merge
          await setDoc(docRef, firebaseData, { merge: true });
          console.log('SAVE: ✅ setDoc with merge completed successfully');
        } catch (mergeError) {
          console.error('SAVE: ❌ setDoc with merge also failed:', mergeError);
          throw mergeError;
        }
      }
      
      // Verificar que los datos se guardaron haciendo una re-lectura rápida
      console.log('SAVE: Verifying data was saved correctly...');
      const savedDoc = await getDoc(docRef);
      if (savedDoc.exists()) {
        const savedData = savedDoc.data();
        const savedAssignments = savedData.layout?.positions?.filter((p: any) => p.employeeId) || [];
        console.log('SAVE: ✅ Verification - saved assignments count:', savedAssignments.length);
        console.log('SAVE: ✅ Verification - saved assignments:', savedAssignments.map((p: any) => ({
          id: p.id,
          number: p.number,
          deskName: p.deskName,
          employeeId: p.employeeId
        })));
      } else {
        console.error('SAVE: ❌ Document does not exist after saving!');
      }
      
      console.log('SAVE: ✅ State saved to Firebase successfully');
    } catch (error) {
      console.error('SAVE: ❌ Error saving to Firebase:', error);
      
      // 🆘 EMERGENCY: Log detailed error information
      if (error instanceof Error) {
        console.error('SAVE: Error name:', error.name);
        console.error('SAVE: Error message:', error.message);
        if ('code' in error) {
          console.error('SAVE: Firebase error code:', (error as any).code);
        }
      }
      
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
        deskName: pos.name
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
    console.log('Notifying listeners, current employees count:', this.state.employees.length);
    console.log('Active listeners count:', this.listeners.length);
    this.listeners.forEach(listener => listener(this.state));
  }

  // Método para debug de sincronización
  public debugSync(): void {
    console.log('=== DEBUG SYNC ===');
    console.log('Current state employees:', this.state.employees.map(emp => ({ id: emp.id, name: emp.name })));
    console.log('Current state assigned positions:', 
      this.state.layout.positions.filter(pos => pos.employeeId).map(pos => ({
        id: pos.id,
        number: pos.number,
        deskName: pos.deskName,
        employeeId: pos.employeeId,
        isOccupied: pos.isOccupied
      }))
    );
    console.log('Active listeners:', this.listeners.length);
    console.log('Firebase connection status:', this.unsubscribe ? 'Connected' : 'Disconnected');
    console.log('==================');
  }

  // 🆘 EMERGENCY SYNC: Método de diagnóstico y reparación en tiempo real
  public async emergencySync(): Promise<void> {
    console.log('🆘 EMERGENCY SYNC: Starting emergency synchronization...');
    
    try {
      // 1. Verificar conexión actual
      console.log('🆘 Step 1: Checking current connection...');
      this.debugSync();
      
      // 2. Forzar reconexión
      console.log('🆘 Step 2: Forcing reconnection...');
      if (this.unsubscribe) {
        this.unsubscribe();
        console.log('🆘 Previous listener disconnected');
      }
      
      // 3. Re-inicializar listener
      console.log('🆘 Step 3: Re-initializing Firebase listener...');
      this.initializeFirebaseListener();
      
      // 4. Forzar lectura directa
      console.log('🆘 Step 4: Force reading from Firebase...');
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('🆘 Direct read successful:', {
          employeesCount: data.employees?.length || 0,
          assignedPositions: data.layout?.positions?.filter((p: any) => p.employeeId)?.length || 0,
          lastUpdated: data.lastUpdated?.toDate?.()?.toLocaleString() || 'No timestamp'
        });
        
        // Forzar actualización del estado
        this.state = this.convertFirebaseToState(data);
        this.notifyListeners();
        
        console.log('🆘 EMERGENCY SYNC: Successfully completed!');
      } else {
        console.error('🆘 EMERGENCY SYNC: Document does not exist!');
      }
      
    } catch (error) {
      console.error('🆘 EMERGENCY SYNC: Failed with error:', error);
    }
  }

  // Método para forzar re-sincronización
  public async forceSyncFromFirebase(): Promise<void> {
    console.log('Forcing sync from Firebase...');
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      // Forzar re-lectura del documento
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.state = this.convertFirebaseToState(data);
        console.log('Force sync completed, notifying listeners...');
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error forcing sync:', error);
    }
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
    console.log('Creating new employee:', data);
    
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
    
    console.log('Employee added to state, saving to Firebase...');
    console.log('Current employees count:', this.state.employees.length);
    
    await this.saveToFirebase();
    
    console.log('Employee saved to Firebase successfully');
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

  // Corregir datos incorrectos de empleado
  public async fixEmployeeData(employeeId: string, correctData: { name: string; department: string; position: string }): Promise<boolean> {
    const employeeIndex = this.state.employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) return false;

    this.state.employees[employeeIndex] = {
      ...this.state.employees[employeeIndex],
      name: correctData.name,
      department: correctData.department,
      position: correctData.position,
      updatedAt: new Date()
    };
    
    // Añadir a historial
    this.addToHistory('employee_updated', `Datos de empleado ${correctData.name} corregidos`);
    
    await this.saveToFirebase();
    return true;
  }

  // Método para corregir datos corruptos de empleados
  public async fixCorruptedEmployeeData(): Promise<boolean> {
    console.log('🔧 STARTING COMPREHENSIVE DATA FIX...');
    console.log('🔧 Current employees in state:', this.state.employees.length);
    
    // Log TODOS los empleados para diagnosticar
    this.state.employees.forEach((emp, index) => {
      console.log(`🔧 Employee ${index + 1}:`, {
        id: emp.id,
        name: emp.name,
        position: emp.position,
        positionType: typeof emp.position,
        isNumeric: /^\d+$/.test(emp.position),
        department: emp.department,
        hasUndefined: Object.values(emp).some(val => val === undefined)
      });
    });
    
    // Buscar empleados con posiciones numéricas (corruptas) - más agresivo
    const corruptedEmployees = this.state.employees.filter(emp => {
      const isNumeric = typeof emp.position === 'string' && /^\d+$/.test(emp.position);
      const isSpecificBadData = emp.name === 'Jossafath Almaguer' && emp.position === '73';
      const hasUndefinedValues = Object.values(emp).some(val => val === undefined);
      console.log(`🔧 Checking ${emp.name}: position="${emp.position}", isNumeric=${isNumeric}, isSpecificBad=${isSpecificBadData}, hasUndefined=${hasUndefinedValues}`);
      return isNumeric || isSpecificBadData || hasUndefinedValues;
    });
    
    console.log('🔧 Found corrupted employees:', corruptedEmployees.length);
    corruptedEmployees.forEach((emp, index) => {
      console.log(`🔧 Corrupted ${index + 1}:`, {
        name: emp.name,
        currentPosition: emp.position,
        department: emp.department,
        undefinedFields: Object.entries(emp).filter(([, val]) => val === undefined).map(([key]) => key)
      });
    });
    
    // Primero, limpiar TODOS los empleados de valores undefined para evitar errores de Firebase
    let cleanedCount = 0;
    this.state.employees.forEach(emp => {
      let wasModified = false;
      
      // Limpiar campos undefined que causan errores de Firebase
      if (emp.position === undefined || emp.position === null) {
        emp.position = 'Empleado';
        wasModified = true;
        console.log(`🔧 CLEANED undefined position for ${emp.name}`);
      }
      
      if (emp.department === undefined || emp.department === null) {
        emp.department = 'General';
        wasModified = true;
        console.log(`🔧 CLEANED undefined department for ${emp.name}`);
      }
      
      if (wasModified) {
        emp.updatedAt = new Date();
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🔧 Cleaned ${cleanedCount} employees from undefined values`);
    }
    
    if (corruptedEmployees.length === 0 && cleanedCount === 0) {
      console.log('🔧 No corrupted employee data found to fix');
      // Forzar corrección específica para Jossafath si existe
      const jossafath = this.state.employees.find(emp => emp.name === 'Jossafath Almaguer');
      if (jossafath && (jossafath.position === '73' || /^\d+$/.test(jossafath.position))) {
        console.log('🔧 FORCE FIXING Jossafath Almaguer:', jossafath);
        jossafath.position = 'Analista';
        jossafath.department = 'Norteamerica';
        jossafath.updatedAt = new Date();
        
        this.addToHistory('employee_updated', 'Forzado: Datos de Jossafath Almaguer corregidos');
        await this.saveToFirebase();
        console.log('🔧 FORCE FIX completed for Jossafath');
        return true;
      }
      return false;
    }
    
    let correctedCount = 0;
    
    // Corregir cada empleado con posición numérica
    for (const employee of corruptedEmployees) {
      console.log(`🔧 CORRECTING ${employee.name}: "${employee.position}" → "Analista"`);
      
      const oldPosition = employee.position;
      
      // Corregir datos completamente
      employee.position = 'Analista';
      employee.department = employee.department || 'Norteamerica';
      employee.updatedAt = new Date();
      correctedCount++;
      
      console.log(`🔧 FIXED ${employee.name}: ${oldPosition} → ${employee.position}`);
    }
    
    if (correctedCount > 0 || cleanedCount > 0) {
      console.log(`🔧 Corrected ${correctedCount} employees and cleaned ${cleanedCount} employees, saving to Firebase...`);
      
      // Añadir a historial
      this.addToHistory('employee_updated', `Datos corregidos para ${correctedCount} empleados y limpiados ${cleanedCount} empleados`);
      
      // Guardar con verificación más robusta
      try {
        await this.saveToFirebase();
        console.log('🔧 Data saved successfully to Firebase');
      } catch (firebaseError) {
        console.error('🔧 Firebase save error:', firebaseError);
        console.log('🔧 Attempting alternative save method...');
        
        // Método alternativo de guardado - sobrescribir completamente
        try {
          await this.saveToFirebase();
          console.log('🔧 Alternative save successful');
        } catch (alternativeError) {
          console.error('🔧 Alternative save also failed:', alternativeError);
        }
      }
      
      // Verificar que los cambios se aplicaron
      setTimeout(() => {
        const verification = this.state.employees.filter(emp => 
          typeof emp.position === 'string' && /^\d+$/.test(emp.position)
        );
        
        console.log(`🔧 POST-FIX verification: ${verification.length} employees still have numeric positions`);
        verification.forEach(emp => {
          console.log(`🔧 Still corrupted: ${emp.name} = ${emp.position}`);
        });
        
        console.log('🔧 Employee data corrections completed');
      }, 2000);
      
      return true;
    }
    
    return false;
  }

  public async assignEmployeeToPosition(employeeId: string, positionId: string, workstationInfo?: WorkstationInfo): Promise<boolean> {
    console.log('==========================================');
    console.log('ASSIGNMENT: Starting assignment process');
    console.log('ASSIGNMENT: Employee ID:', employeeId);
    console.log('ASSIGNMENT: Position ID:', positionId);
    console.log('ASSIGNMENT: Workstation Info:', workstationInfo);
    console.log('ASSIGNMENT: Current employees count:', this.state.employees.length);
    console.log('ASSIGNMENT: Current positions count:', this.state.layout.positions.length);
    
    // Buscar empleado con validación completa
    const employee = this.state.employees.find(emp => emp.id === employeeId);
    if (!employee) {
      console.error('ASSIGNMENT: Employee not found with ID:', employeeId);
      console.log('ASSIGNMENT: Available employees:', this.state.employees.map(e => ({ 
        id: e.id, 
        name: e.name, 
        position: e.position 
      })));
      return false;
    }
    
    // ⚠️ DETECTIVE MODE: Log employee data BEFORE any changes
    console.log('🕵️ BEFORE ASSIGNMENT - Employee data:', { 
      id: employee.id, 
      name: employee.name, 
      position: employee.position,
      positionType: typeof employee.position,
      department: employee.department 
    });

    // Buscar posición - probemos ambos métodos de búsqueda
    let position = this.state.layout.positions.find(pos => pos.id === positionId);
    if (!position) {
      // Si no encontramos por ID, intentar por número
      const positionNumber = parseInt(positionId.replace('pos-', ''));
      position = this.state.layout.positions.find(pos => pos.number === positionNumber);
      console.log('ASSIGNMENT: Searching by number:', positionNumber, 'Found:', !!position);
    }
    
    if (!position) {
      console.error('ASSIGNMENT: Position not found with ID:', positionId);
      console.log('ASSIGNMENT: Available position IDs (first 10):', this.state.layout.positions.slice(0, 10).map(p => ({ 
        id: p.id, 
        number: p.number, 
        deskName: p.deskName 
      })));
      return false;
    }
    
    console.log('ASSIGNMENT: Found position:', {
      id: position.id,
      number: position.number,
      deskName: position.deskName,
      currentEmployeeId: position.employeeId,
      isOccupied: position.isOccupied
    });

    // ⚠️ CRITICAL: Double-check that we're NOT modifying employee.position
    console.log('🚨 CRITICAL CHECK: About to modify position data, employee.position should NOT change');
    console.log('🚨 Employee.position BEFORE position assignment:', employee.position);

    // Validar que los datos son correctos
    if (!employee.id || !employee.name) {
      console.error('ASSIGNMENT: Employee data is invalid:', employee);
      return false;
    }

    if (!position.id) {
      console.error('ASSIGNMENT: Position data is invalid:', position);
      return false;
    }

    // Quitar empleado de posición anterior si existe
    let removedFromPrevious = false;
    this.state.layout.positions.forEach(pos => {
      if (pos.employeeId === employeeId) {
        console.log('ASSIGNMENT: Removing employee from previous position:', pos.deskName || pos.number);
        pos.employeeId = null;
        pos.isOccupied = false;
        removedFromPrevious = true;
      }
    });
    
    if (removedFromPrevious) {
      console.log('ASSIGNMENT: Employee removed from previous position successfully');
    }

    // Quitar cualquier otro empleado de la nueva posición
    if (position.employeeId) {
      const previousEmployee = this.state.employees.find(emp => emp.id === position.employeeId);
      if (previousEmployee) {
        console.log('ASSIGNMENT: Removing previous employee from position:', previousEmployee.name);
        this.addToHistory('unassigned', `${previousEmployee.name} removido de posición ${position.deskName || position.number}`);
      }
    }

    // ⚠️ DETECTIVE: Log employee.position AFTER removing from previous but BEFORE new assignment
    console.log('🕵️ AFTER removing from previous position - Employee.position:', employee.position);

    // Asignar empleado a nueva posición
    position.employeeId = employeeId;
    position.isOccupied = true;
    
    // ⚠️ CRITICAL: We should NEVER modify employee.position here!
    // employee.position should remain as job title (Analista, Supervisor, etc.)
    // position.number or position.deskName is the desk location (73, L4, etc.)
    
    console.log('🚨 AFTER position assignment - Employee.position should still be:', employee.position);
    console.log('🚨 Position.number (desk location):', position.number);
    console.log('🚨 Position.deskName (desk name):', position.deskName);
    
    // ONLY update the timestamp
    employee.updatedAt = new Date();

    // ⚠️ DETECTIVE: Log employee.position AFTER timestamp update
    console.log('🕵️ AFTER timestamp update - Employee.position:', employee.position);

    // Guardar información del workstation si se proporciona
    if (workstationInfo) {
      console.log('ASSIGNMENT: Saving workstation info:', workstationInfo);
      position.workstationInfo = {
        ...workstationInfo,
        assignedDate: new Date()
      };
    }

    // ⚠️ DETECTIVE: Final check before saving
    console.log('🕵️ FINAL CHECK before save - Employee data:', {
      id: employee.id,
      name: employee.name,
      position: employee.position, // This should still be "Analista"
      positionType: typeof employee.position,
      department: employee.department
    });

    console.log('ASSIGNMENT: Assignment completed in local state:', {
      positionId: position.id,
      positionNumber: position.number,
      positionDeskName: position.deskName,
      positionEmployeeId: position.employeeId,
      positionOccupied: position.isOccupied,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeJobTitle: employee.position, // This is the job title, NOT desk number
      employeeDepartment: employee.department,
      hasWorkstationInfo: !!position.workstationInfo
    });

    // Verificar que la asignación se hizo correctamente en el estado local
    const verifyPosition = this.state.layout.positions.find(p => p.id === positionId);
    if (!verifyPosition || verifyPosition.employeeId !== employeeId) {
      console.error('ASSIGNMENT: Local assignment verification failed!');
      console.log('ASSIGNMENT: Expected employee ID:', employeeId);
      console.log('ASSIGNMENT: Actual employee ID in position:', verifyPosition?.employeeId);
      return false;
    }

    // Añadir a historial
    this.addToHistory('assigned', `${employee.name} asignado a posición ${position.deskName || position.number}`);
    
    console.log('ASSIGNMENT: About to save to Firebase...');
    console.log('🚨 PRE-SAVE: Employee.position =', employee.position);
    console.log('ASSIGNMENT: All assigned positions before save:', 
      this.state.layout.positions.filter(p => p.employeeId).map(p => ({
        id: p.id,
        number: p.number,
        deskName: p.deskName,
        employeeId: p.employeeId,
        isOccupied: p.isOccupied
      }))
    );
    
    try {
      await this.saveToFirebase();
      console.log('ASSIGNMENT: Firebase save completed successfully');
      
      // ⚠️ DETECTIVE: Check if employee.position got corrupted during save
      console.log('🚨 POST-SAVE: Employee.position =', employee.position);
      
      // Verificar que los datos se mantuvieron después del guardado
      const finalPosition = this.state.layout.positions.find(p => p.id === positionId);
      if (finalPosition?.employeeId === employeeId) {
        console.log('ASSIGNMENT: Final verification successful - assignment persisted');
      } else {
        console.error('ASSIGNMENT: Final verification failed - assignment was lost!');
        console.log('ASSIGNMENT: Expected:', employeeId, 'Got:', finalPosition?.employeeId);
      }
      
      console.log('ASSIGNMENT: Process completed successfully');
      console.log('==========================================');
      return true;
    } catch (error) {
      console.error('ASSIGNMENT: Error saving to Firebase:', error);
      console.log('==========================================');
      return false;
    }
  }

  public async unassignEmployeeFromPosition(employeeId: string): Promise<boolean> {
    const employee = this.state.employees.find(emp => emp.id === employeeId);
    if (!employee) return false;

    // Quitar empleado de cualquier posición
    this.state.layout.positions.forEach(pos => {
      if (pos.employeeId === employeeId) {
        pos.employeeId = null;
        pos.isOccupied = false;
      }
    });

    // NO modificar employee.position ya que contiene el cargo del empleado
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
    const assignedEmployees = employees.filter(emp => {
      return positions.some(pos => pos.employeeId === emp.id);
    }).length;
    const unassignedEmployees = employees.length - assignedEmployees;

    // Estadísticas por departamento
    const employeesByDepartment: Record<string, number> = {};
    this.state.departments.forEach(dept => {
      employeesByDepartment[dept.name] = employees.filter(emp => emp.department === dept.name).length;
    });

    // Estadísticas de workstation
    let totalAssignmentsWithInfo = 0;
    let nodesWorkingCount = 0;
    let electricalWorkingCount = 0;
    let drawerWorkingCount = 0;
    let drawerAssignedCount = 0;
    let chairAssignedCount = 0;
    const workstationIssues: Array<{
      deskName: string;
      employee: string;
      issues: string[];
    }> = [];

    positions.forEach(pos => {
      if (pos.employeeId && pos.workstationInfo) {
        totalAssignmentsWithInfo++;
        const info = pos.workstationInfo;
        
        if (info.nodesWorking) nodesWorkingCount++;
        if (info.electricalConnection) electricalWorkingCount++;
        if (info.drawerWorking) drawerWorkingCount++;
        if (info.drawerNumber) drawerAssignedCount++;
        if (info.chairNumber) chairAssignedCount++;

        // Verificar problemas
        const issues: string[] = [];
        if (!info.nodesWorking) issues.push('Nodos no funcionan');
        if (!info.electricalConnection) issues.push('Conexión eléctrica no funciona');
        if (!info.drawerWorking) issues.push('Cajón no funciona');
        if (!info.drawerNumber) issues.push('Sin cajón asignado');
        if (!info.chairNumber) issues.push('Sin silla asignada');

        if (issues.length > 0) {
          const employee = employees.find(emp => emp.id === pos.employeeId);
          workstationIssues.push({
            deskName: pos.deskName || `Posición ${pos.number}`,
            employee: employee?.name || 'Desconocido',
            issues
          });
        }
      }
    });

    const occupancyRate = totalPositions > 0 ? (occupiedPositions / totalPositions) * 100 : 0;

    return {
      totalPositions,
      occupiedPositions,
      availablePositions,
      totalEmployees: employees.length,
      assignedEmployees,
      unassignedEmployees,
      employeesByDepartment,
      occupancyRate,
      workstationStats: {
        totalAssignmentsWithInfo,
        nodesWorkingCount,
        nodesWorkingPercentage: totalAssignmentsWithInfo > 0 ? (nodesWorkingCount / totalAssignmentsWithInfo) * 100 : 0,
        electricalWorkingCount,
        electricalWorkingPercentage: totalAssignmentsWithInfo > 0 ? (electricalWorkingCount / totalAssignmentsWithInfo) * 100 : 0,
        drawerWorkingCount,
        drawerWorkingPercentage: totalAssignmentsWithInfo > 0 ? (drawerWorkingCount / totalAssignmentsWithInfo) * 100 : 0,
        drawerAssignedCount,
        chairAssignedCount,
        workstationIssues
      }
    };
  }

  // Método para limpiar todos los datos
  public async clearAllData(): Promise<void> {
    try {
      console.log('Clearing all data and resetting layout...');
      
      // Recrear estado con layout correcto
      this.state = this.createInitialState();
      
      // Verificar que el layout tiene los nombres correctos
      const samplePositions = this.state.layout.positions.slice(0, 5);
      console.log('First 5 positions after reset:', samplePositions.map(p => ({ name: p.deskName, id: p.id })));
      
      // Forzar guardado completo en Firebase (usar setDoc en lugar de updateDoc)
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const firebaseData = this.convertStateToFirebase(this.state);
      
      await setDoc(docRef, firebaseData);
      console.log('Layout reset completed successfully');
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Función especial para forzar reset del layout sin perder empleados
  public async forceResetLayout(): Promise<void> {
    try {
      console.log('Force resetting layout to original names (keeping employees)...');
      
      // Mantener empleados actuales pero regenerar layout
      const currentEmployees = [...this.state.employees];
      
      // Recrear estado con layout correcto
      this.state = this.createInitialState();
      
      // Restaurar empleados
      this.state.employees = currentEmployees;
      
      // Verificar que el layout tiene los nombres correctos
      const samplePositions = this.state.layout.positions.slice(0, 5);
      console.log('First 5 positions after layout reset:', samplePositions.map(p => ({ name: p.deskName, id: p.id })));
      
      // Forzar guardado en Firebase
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const firebaseData = this.convertStateToFirebase(this.state);
      
      await setDoc(docRef, firebaseData);
      console.log('Layout force reset completed successfully');
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error force resetting layout:', error);
      throw error;
    }
  }
}
