import { useDraggable } from '@dnd-kit/core';
import { X, Info } from 'lucide-react';
import type { Employee, OfficePosition, Department } from '../types/database';
import './EmployeeCard.css';

interface EmployeeCardProps {
  employee: Employee;
  isDraggable: boolean;
  onUnassign: (employeeId: string) => void;
  showUnassignButton?: boolean;
  position?: OfficePosition; // Información de la posición para mostrar detalles
  onShowDetails?: (employee: Employee, position: OfficePosition) => void;
  departments?: Department[]; // Array de departamentos para obtener colores
}

export function EmployeeCard({ employee, isDraggable, onUnassign, showUnassignButton = false, position, onShowDetails, departments = [] }: EmployeeCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: employee.id,
    disabled: !isDraggable,
  });

  // Buscar el color del departamento
  const department = departments.find(dept => dept.name === employee.department);
  const departmentColor = department?.color || '#6b7280'; // Color por defecto si no se encuentra

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  // Crear estilos dinámicos para el color del departamento
  const cardStyle = {
    ...style,
    borderLeftColor: departmentColor,
    borderLeftWidth: '4px'
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className={`employee-card ${isDraggable ? 'draggable' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div 
        className="employee-drag-area"
        {...listeners}
        {...attributes}
      >
        <div className="employee-info">
          <div className="employee-name">{employee.name}</div>
          <div 
            className="employee-department"
            style={{ color: departmentColor }}
          >
            {employee.department}
          </div>
          <div className="employee-position">{employee.position}</div>
        </div>
      </div>
      
      {showUnassignButton && (
        <div className="card-actions">
          {position && onShowDetails && (
            <button
              className="info-button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Botón azul clickeado para mostrar detalles', employee.name);
                onShowDetails(employee, position);
              }}
              title="Ver información del puesto"
            >
              <Info size={14} />
            </button>
          )}
          <button
            className="unassign-button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Botón rojo clickeado para desasignar', employee.name);
              onUnassign(employee.id);
            }}
            title="Quitar de posición"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
