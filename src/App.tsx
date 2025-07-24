import { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { OfficeLayout } from './components/OfficeLayout';
import { EmployeePanel } from './components/EmployeePanel';
import { EmployeeCard } from './components/EmployeeCard';
import { Statistics } from './components/Statistics';
import { WorkstationInfoModal } from './components/WorkstationInfoModal';
import { WorkstationDetailsModal } from './components/WorkstationDetailsModal';
import getDatabaseManager from './services/DatabaseWrapper';
import type { Employee, OfficePosition, WorkstationInfo } from './types/database';
import './App.css';

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<OfficePosition[]>([]);
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'employees' | 'stats'>('layout');
  
  // Estado para el modal de información del puesto
  const [showWorkstationModal, setShowWorkstationModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    employeeId: string;
    positionId: string;
    employee: Employee;
    position: OfficePosition;
  } | null>(null);

  // Estado para el modal de detalles del puesto
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState<{
    employee: Employee;
    position: OfficePosition;
  } | null>(null);

  const db = getDatabaseManager();

  // Cargar datos iniciales y suscribirse a cambios
  useEffect(() => {
    loadData();
    
    // Suscribirse a cambios en tiempo real
    const unsubscribe = db.subscribe((state) => {
      console.log('Firebase state update received:', {
        employeesCount: state.employees.length,
        positionsCount: state.layout.positions.length,
        occupiedPositions: state.layout.positions.filter(p => p.employeeId).length
      });
      
      setEmployees(state.employees);
      setPositions(state.layout.positions);
      
      // Log de empleados asignados
      const assignedEmployees = state.layout.positions
        .filter(p => p.employeeId)
        .map(p => {
          const emp = state.employees.find(e => e.id === p.employeeId);
          return { position: p.deskName || p.number, employee: emp?.name };
        });
      console.log('Currently assigned employees:', assignedEmployees);
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = () => {
    setEmployees(db.getEmployees());
    setPositions(db.getPositions());
  };

  const handleDragStart = (event: DragStartEvent) => {
    const employeeId = event.active.id as string;
    const employee = db.getEmployeeById(employeeId);
    setDraggedEmployee(employee);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedEmployee(null);

    if (!over) return;

    const employeeId = active.id as string;
    const positionId = over.id as string;

    // Verificar si es una posición válida
    if (positionId.startsWith('pos-')) {
      const employee = db.getEmployeeById(employeeId);
      const position = db.getPositionById(positionId);
      
      if (employee && position && !position.isOccupied) {
        // Mostrar modal para capturar información del puesto
        setPendingAssignment({
          employeeId,
          positionId,
          employee,
          position
        });
        setShowWorkstationModal(true);
      }
    }
  };

  // Confirmar asignación con información del puesto
  const handleWorkstationInfoConfirm = async (workstationInfo: WorkstationInfo) => {
    if (pendingAssignment) {
      console.log('Assigning employee to position:', {
        employeeId: pendingAssignment.employeeId,
        positionId: pendingAssignment.positionId,
        workstationInfo
      });
      
      const success = await db.assignEmployeeToPosition(
        pendingAssignment.employeeId, 
        pendingAssignment.positionId, 
        workstationInfo
      );
      
      console.log('Assignment result:', success);
      
      if (success) {
        console.log('Assignment successful, Firebase should update automatically');
        // No necesitamos loadData() porque Firebase se actualiza automáticamente
      } else {
        console.error('Assignment failed');
      }
    }
    setShowWorkstationModal(false);
    setPendingAssignment(null);
  };

  // Cancelar asignación
  const handleWorkstationInfoCancel = () => {
    setShowWorkstationModal(false);
    setPendingAssignment(null);
  };

  // Mostrar detalles del puesto de trabajo
  const handleShowWorkstationDetails = (employee: Employee, position: OfficePosition) => {
    console.log('Mostrando detalles del puesto:', employee.name, position.deskName);
    setSelectedWorkstation({ employee, position });
    setShowDetailsModal(true);
  };

  // Cerrar modal de detalles
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedWorkstation(null);
  };

  const handleEmployeeCreate = (data: { name: string; department: string; position: string }) => {
    db.createEmployee(data);
    loadData();
  };

  const handleEmployeeUpdate = async (id: string, data: { name: string; department: string; position: string }) => {
    await db.updateEmployee(id, data);
    loadData();
  };

  const handleEmployeeDelete = async (id: string) => {
    await db.deleteEmployee(id);
    loadData();
  };

  const handleUnassignEmployee = async (employeeId: string) => {
    console.log('Desasignando empleado:', employeeId);
    const success = await db.unassignEmployeeFromPosition(employeeId);
    console.log('Resultado de desasignación:', success);
    if (success) {
      loadData();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <img src="/logo-gm.png" alt="GM Logo" className="app-logo" />
          <h1>Layout GP&MS</h1>
        </div>
        <nav className="app-nav">
          <button 
            className={`nav-button ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            🏢 Layout
          </button>
          <button 
            className={`nav-button ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            👥 Empleados
          </button>
          <button 
            className={`nav-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Estadísticas
          </button>
        </nav>
      </header>

      <main className="app-main">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {activeTab === 'layout' && (
            <div className="layout-view">
              <div className="layout-sidebar">
                <h3>Empleados Disponibles</h3>
                <div className="available-employees">
                  {employees.filter(emp => !positions.find(pos => pos.employeeId === emp.id)).map(employee => (
                    <EmployeeCard 
                      key={employee.id} 
                      employee={employee} 
                      isDraggable={true}
                      onUnassign={() => {}}
                    />
                  ))}
                </div>
              </div>
              <div className="layout-content">
                <OfficeLayout 
                  positions={positions}
                  employees={employees}
                  onUnassignEmployee={handleUnassignEmployee}
                  onShowWorkstationDetails={handleShowWorkstationDetails}
                />
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <EmployeePanel
              employees={employees}
              positions={positions}
              onEmployeeCreate={handleEmployeeCreate}
              onEmployeeUpdate={handleEmployeeUpdate}
              onEmployeeDelete={handleEmployeeDelete}
              onUnassignEmployee={handleUnassignEmployee}
            />
          )}

          {activeTab === 'stats' && (
            <Statistics />
          )}

          <DragOverlay>
            {draggedEmployee && (
              <EmployeeCard 
                employee={draggedEmployee} 
                isDraggable={false}
                onUnassign={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>

        {/* Modal de información del puesto de trabajo */}
        <WorkstationInfoModal
          isOpen={showWorkstationModal}
          deskName={pendingAssignment?.position.deskName || `Posición ${pendingAssignment?.position.number}`}
          employeeName={pendingAssignment?.employee.name || ''}
          onConfirm={handleWorkstationInfoConfirm}
          onCancel={handleWorkstationInfoCancel}
        />

        {/* Modal de detalles del puesto de trabajo */}
        {selectedWorkstation && (
          <WorkstationDetailsModal
            isOpen={showDetailsModal}
            employee={selectedWorkstation.employee}
            position={selectedWorkstation.position}
            onClose={handleCloseDetailsModal}
          />
        )}
      </main>
    </div>
  );
}

export default App;
