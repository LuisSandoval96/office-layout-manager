import { useState } from 'react';
import type { WorkstationInfo } from '../types/database';
import './WorkstationInfoModal.css';

interface WorkstationInfoModalProps {
  isOpen: boolean;
  deskName: string;
  employeeName: string;
  onConfirm: (workstationInfo: WorkstationInfo) => void;
  onCancel: () => void;
  existingInfo?: WorkstationInfo;
}

export function WorkstationInfoModal({ 
  isOpen, 
  deskName, 
  employeeName, 
  onConfirm, 
  onCancel,
  existingInfo
}: WorkstationInfoModalProps) {
  const [drawerNumber, setDrawerNumber] = useState(existingInfo?.drawerNumber || '');
  const [chairNumber, setChairNumber] = useState(existingInfo?.chairNumber || '');
  const [nodesWorking, setNodesWorking] = useState(existingInfo?.nodesWorking ?? true);
  const [electricalConnection, setElectricalConnection] = useState(existingInfo?.electricalConnection ?? true);
  const [drawerWorking, setDrawerWorking] = useState(existingInfo?.drawerWorking ?? true);
  const [notes, setNotes] = useState(existingInfo?.notes || '');

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    console.log('WorkstationInfoModal: Confirm button clicked');
    
    console.log('WorkstationInfoModal: Form data:', {
      drawerNumber: drawerNumber.trim(),
      chairNumber: chairNumber.trim(),
      nodesWorking,
      electricalConnection,
      drawerWorking,
      notes: notes.trim()
    });
    
    const workstationInfo: WorkstationInfo = {
      drawerNumber: drawerNumber.trim() || undefined,
      chairNumber: chairNumber.trim() || undefined,
      nodesWorking,
      electricalConnection,
      drawerWorking,
      assignedDate: new Date(),
      notes: notes.trim() || undefined
    };

    console.log('WorkstationInfoModal: Calling onConfirm with:', workstationInfo);
    
    try {
      onConfirm(workstationInfo);
      console.log('WorkstationInfoModal: onConfirm called successfully');
    } catch (error) {
      console.error('WorkstationInfoModal: Error calling onConfirm:', error);
    }
    
    // Reset form
    setDrawerNumber('');
    setChairNumber('');
    setNodesWorking(true);
    setElectricalConnection(true);
    setDrawerWorking(true);
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('WorkstationInfoModal: Form submit event triggered');
    handleConfirmClick();
  };

  const handleCancel = () => {
    // Reset form
    setDrawerNumber('');
    setChairNumber('');
    setNodesWorking(true);
    setElectricalConnection(true);
    setDrawerWorking(true);
    setNotes('');
    onCancel();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Información del Puesto de Trabajo</h3>
          <p>Asignando a <strong>{employeeName}</strong> al escritorio <strong>{deskName}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="drawerNumber">Número de Cajón:</label>
              <input
                type="text"
                id="drawerNumber"
                value={drawerNumber}
                onChange={(e) => setDrawerNumber(e.target.value)}
                placeholder="Ej: 001, A-15, etc."
              />
            </div>

            <div className="form-group">
              <label htmlFor="chairNumber">Número de Silla:</label>
              <input
                type="text"
                id="chairNumber"
                value={chairNumber}
                onChange={(e) => setChairNumber(e.target.value)}
                placeholder="Ej: S-001, 123, etc."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={nodesWorking}
                  onChange={(e) => setNodesWorking(e.target.checked)}
                />
                <span className="checkbox-text">¿Funcionan los nodos?</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={electricalConnection}
                  onChange={(e) => setElectricalConnection(e.target.checked)}
                />
                <span className="checkbox-text">¿Conexión eléctrica funciona?</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={drawerWorking}
                  onChange={(e) => setDrawerWorking(e.target.checked)}
                />
                <span className="checkbox-text">¿Cajón funciona?</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas adicionales (opcional):</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cualquier observación adicional..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleCancel} className="btn-cancel">
              Cancelar
            </button>
            <button type="button" onClick={handleConfirmClick} className="btn-confirm">
              Confirmar Asignación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
