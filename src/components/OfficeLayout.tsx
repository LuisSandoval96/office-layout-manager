import { useDroppable } from '@dnd-kit/core';
import { EmployeeCard } from './EmployeeCard';
import type { Employee, OfficePosition, Department } from '../types/database';
import './OfficeLayout.css';

interface OfficeLayoutProps {
  positions: OfficePosition[];
  employees: Employee[];
  departments: Department[];
  onUnassignEmployee: (employeeId: string) => void;
  onShowWorkstationDetails?: (employee: Employee, position: OfficePosition) => void;
}

interface PositionSlotProps {
  position: OfficePosition;
  employee?: Employee;
  departments: Department[];
  onUnassignEmployee: (employeeId: string) => void;
  onShowWorkstationDetails?: (employee: Employee, position: OfficePosition) => void;
}

function PositionSlot({ position, employee, departments, onUnassignEmployee, onShowWorkstationDetails }: PositionSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: position.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`position-slot ${isOver ? 'drop-over' : ''} ${position.isOccupied ? 'occupied' : 'empty'}`}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      }}
    >
      <div className="position-number">{position.deskName || position.number}</div>
      {employee && (
        <EmployeeCard
          employee={employee}
          isDraggable={true}
          onUnassign={onUnassignEmployee}
          showUnassignButton={true}
          position={position}
          onShowDetails={onShowWorkstationDetails}
          departments={departments}
        />
      )}
    </div>
  );
}

export function OfficeLayout({ positions, employees, departments, onUnassignEmployee, onShowWorkstationDetails }: OfficeLayoutProps) {
  // Calcular dimensiones del layout
  const maxX = Math.max(...positions.map(p => p.x + p.width));
  const maxY = Math.max(...positions.map(p => p.y + p.height));

  // Debug: Log para ver qué datos estamos recibiendo
  console.log('OfficeLayout RENDER: Positions count:', positions.length);
  console.log('OfficeLayout RENDER: Employees count:', employees.length);
  
  const assignedPositions = positions.filter(p => p.employeeId);
  console.log('OfficeLayout RENDER: Assigned positions count:', assignedPositions.length);
  console.log('OfficeLayout RENDER: Assigned positions details:', assignedPositions.map(p => ({
    id: p.id,
    number: p.number,
    deskName: p.deskName,
    employeeId: p.employeeId,
    isOccupied: p.isOccupied
  })));
  
  console.log('OfficeLayout RENDER: Employees details:', employees.map(e => ({
    id: e.id,
    name: e.name,
    position: e.position
  })));

  return (
    <div className="office-layout-container">
      <h2>Layout de Oficina</h2>
      <div 
        className="office-layout"
        style={{
          width: maxX + 20,
          height: maxY + 20,
        }}
      >
        {positions.map((position) => {
          const employee = employees.find(emp => emp.id === position.employeeId);
          
          // Debug: Log específico para cada posición
          if (position.employeeId) {
            console.log('OfficeLayout RENDER: Position', position.deskName || position.number, 'has employeeId:', position.employeeId);
            console.log('OfficeLayout RENDER: Found employee for this position:', employee ? `${employee.name} (${employee.id})` : 'NOT FOUND');
          }
          
          return (
            <PositionSlot
              key={position.id}
              position={position}
              employee={employee}
              departments={departments}
              onUnassignEmployee={onUnassignEmployee}
              onShowWorkstationDetails={onShowWorkstationDetails}
            />
          );
        })}
      </div>
      <div className="layout-info">
        <p>📋 Arrastra empleados desde la barra lateral a las posiciones disponibles</p>
        <p>🔄 Arrastra empleados entre posiciones para reubicarlos</p>
        <p>❌ Haz clic en la X para quitar un empleado de su posición</p>
      </div>
    </div>
  );
}
