import { useDroppable } from '@dnd-kit/core';
import { EmployeeCard } from './EmployeeCard';
import type { Employee, OfficePosition } from '../types/database';
import './OfficeLayout.css';

interface OfficeLayoutProps {
  positions: OfficePosition[];
  employees: Employee[];
  onUnassignEmployee: (employeeId: string) => void;
  onShowWorkstationDetails?: (employee: Employee, position: OfficePosition) => void;
}

interface PositionSlotProps {
  position: OfficePosition;
  employee?: Employee;
  onUnassignEmployee: (employeeId: string) => void;
  onShowWorkstationDetails?: (employee: Employee, position: OfficePosition) => void;
}

function PositionSlot({ position, employee, onUnassignEmployee, onShowWorkstationDetails }: PositionSlotProps) {
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
        />
      )}
    </div>
  );
}

export function OfficeLayout({ positions, employees, onUnassignEmployee, onShowWorkstationDetails }: OfficeLayoutProps) {
  // Calcular dimensiones del layout
  const maxX = Math.max(...positions.map(p => p.x + p.width));
  const maxY = Math.max(...positions.map(p => p.y + p.height));

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
          return (
            <PositionSlot
              key={position.id}
              position={position}
              employee={employee}
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
