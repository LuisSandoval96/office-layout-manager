import { X } from 'lucide-react';
import type { Employee, OfficePosition } from '../types/database';
import './WorkstationDetailsModal.css';

interface WorkstationDetailsModalProps {
  isOpen: boolean;
  employee: Employee;
  position: OfficePosition;
  onClose: () => void;
  onEdit?: () => void;
}

export function WorkstationDetailsModal({ isOpen, employee, position, onClose, onEdit }: WorkstationDetailsModalProps) {
  if (!isOpen) return null;

  const workstationInfo = position.workstationInfo;

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="details-modal-overlay">
      <div className="details-modal-container">
        <div className="details-modal-header">
          <h3>📋 Información del Puesto de Trabajo</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="details-content">
          {/* Información del empleado */}
          <div className="info-section">
            <h4>👤 Empleado</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{employee.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Departamento:</span>
                <span className="info-value">{employee.department}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Cargo:</span>
                <span className="info-value">{employee.position}</span>
              </div>
            </div>
          </div>

          {/* Información de la posición */}
          <div className="info-section">
            <h4>🏢 Ubicación</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Escritorio:</span>
                <span className="info-value">{position.deskName || `Posición ${position.number}`}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Coordenadas:</span>
                <span className="info-value">{position.x}, {position.y}</span>
              </div>
            </div>
          </div>

          {/* Información del puesto de trabajo */}
          <div className="info-section">
            <h4>🛠️ Equipamiento del Puesto</h4>
            {workstationInfo ? (
              <div className="info-grid">
                {workstationInfo.drawerNumber && (
                  <div className="info-item">
                    <span className="info-label">Número de Cajón:</span>
                    <span className="info-value">{workstationInfo.drawerNumber}</span>
                  </div>
                )}
                {workstationInfo.chairNumber && (
                  <div className="info-item">
                    <span className="info-label">Número de Silla:</span>
                    <span className="info-value">{workstationInfo.chairNumber}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Estado de Nodos:</span>
                  <span className={`status-badge ${workstationInfo.nodesWorking ? 'working' : 'not-working'}`}>
                    {workstationInfo.nodesWorking ? '✅ Funcionan' : '❌ No funcionan'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Conexión Eléctrica:</span>
                  <span className={`status-badge ${workstationInfo.electricalConnection ? 'working' : 'not-working'}`}>
                    {workstationInfo.electricalConnection ? '✅ Funciona' : '❌ No funciona'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Estado del Cajón:</span>
                  <span className={`status-badge ${workstationInfo.drawerWorking ? 'working' : 'not-working'}`}>
                    {workstationInfo.drawerWorking ? '✅ Funciona' : '❌ No funciona'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Fecha de Asignación:</span>
                  <span className="info-value">{formatDate(workstationInfo.assignedDate)}</span>
                </div>
                {workstationInfo.notes && (
                  <div className="info-item full-width">
                    <span className="info-label">Notas:</span>
                    <span className="info-value">{workstationInfo.notes}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-info">
                <p>ℹ️ No hay información adicional registrada para este puesto.</p>
                <p>La información se registra cuando se asigna un empleado usando drag & drop.</p>
                {onEdit && (
                  <button 
                    className="edit-button" 
                    onClick={onEdit}
                    style={{ 
                      marginTop: '10px', 
                      padding: '8px 16px', 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    ✏️ Agregar Información
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="details-modal-footer">
          {onEdit && (
            <button 
              className="edit-footer-button" 
              onClick={onEdit}
              style={{ 
                marginRight: '10px',
                padding: '8px 16px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              ✏️ Editar Información
            </button>
          )}
          <button className="close-footer-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
