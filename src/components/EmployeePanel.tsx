import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import { DepartmentLegend } from './DepartmentLegend';
import type { Employee, OfficePosition, Department } from '../types/database';
import { POSITION_TYPES } from '../types/database';
import './EmployeePanel.css';

interface EmployeePanelProps {
  employees: Employee[];
  positions: OfficePosition[];
  departments: Department[];
  onEmployeeCreate: (data: { name: string; department: string; position: string }) => void;
  onEmployeeUpdate: (id: string, data: { name: string; department: string; position: string }) => void;
  onEmployeeDelete: (id: string) => void;
  onUnassignEmployee: (employeeId: string) => void;
}

interface EmployeeFormData {
  name: string;
  department: string;
  position: string;
}

export function EmployeePanel({ 
  employees, 
  positions, 
  departments,
  onEmployeeCreate, 
  onEmployeeUpdate, 
  onEmployeeDelete, 
  onUnassignEmployee 
}: EmployeePanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    department: '',
    position: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
    const matchesPosition = !positionFilter || employee.position === positionFilter;
    
    return matchesSearch && matchesDepartment && matchesPosition;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.department || !formData.position) return;

    if (editingEmployee) {
      onEmployeeUpdate(editingEmployee.id, formData);
    } else {
      onEmployeeCreate(formData);
    }

    // Resetear formulario
    setFormData({ name: '', department: '', position: '' });
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      department: employee.department,
      position: employee.position
    });
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', department: '', position: '' });
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const getEmployeePosition = (employeeId: string) => {
    return positions.find(pos => pos.employeeId === employeeId);
  };

  return (
    <div className="employee-panel">
      <div className="panel-header">
        <h2>👥 Gestión de Empleados</h2>
        <button 
          className="add-button"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus size={16} />
          Nuevo Empleado
        </button>
      </div>

      <DepartmentLegend departments={departments} />

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar empleados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Todos los departamentos</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="">Todas las posiciones</option>
            {POSITION_TYPES.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Formulario */}
      {isFormOpen && (
        <div className="form-overlay">
          <form className="employee-form" onSubmit={handleSubmit}>
            <h3>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
            
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Departamento:</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              >
                <option value="">Seleccionar departamento</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Posición:</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              >
                <option value="">Seleccionar posición</option>
                {POSITION_TYPES.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCancel}>Cancelar</button>
              <button type="submit">
                {editingEmployee ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de empleados */}
      <div className="employees-list">
        <div className="list-header">
          <span>Total: {filteredEmployees.length} empleados</span>
        </div>
        
        {filteredEmployees.map(employee => {
          const assignedPosition = getEmployeePosition(employee.id);
          return (
            <div key={employee.id} className="employee-item">
              <EmployeeCard
                employee={employee}
                isDraggable={false}
                onUnassign={onUnassignEmployee}
                showUnassignButton={!!assignedPosition}
                departments={departments}
              />
              
              <div className="employee-actions">
                <div className="position-info">
                  {assignedPosition ? (
                    <span className="assigned">📍 Escritorio {assignedPosition.deskName || assignedPosition.number}</span>
                  ) : (
                    <span className="unassigned">🔄 Sin asignar</span>
                  )}
                </div>
                
                <div className="action-buttons">
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(employee)}
                    title="Editar empleado"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar a ${employee.name}?`)) {
                        onEmployeeDelete(employee.id);
                      }
                    }}
                    title="Eliminar empleado"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="empty-state">
            <p>No se encontraron empleados con los filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
