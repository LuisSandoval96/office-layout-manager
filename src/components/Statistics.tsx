import { useState, useEffect } from 'react';
import { BarChart3, Users, MapPin, TrendingUp, Download, Upload, Trash2, RefreshCw } from 'lucide-react';
import getDatabaseManager from '../services/DatabaseWrapper';
import './Statistics.css';

interface StatisticsData {
  totalPositions: number;
  occupiedPositions: number;
  availablePositions: number;
  totalEmployees: number;
  assignedEmployees: number;
  unassignedEmployees: number;
  employeesByDepartment: Record<string, number>;
  occupancyRate: number;
  workstationStats: {
    totalAssignmentsWithInfo: number;
    nodesWorkingCount: number;
    nodesWorkingPercentage: number;
    electricalWorkingCount: number;
    electricalWorkingPercentage: number;
    drawerWorkingCount: number;
    drawerWorkingPercentage: number;
    drawerAssignedCount: number;
    chairAssignedCount: number;
    workstationIssues: Array<{
      deskName: string;
      employee: string;
      issues: string[];
    }>;
  };
}

interface StatisticsProps {
  onFixData: () => Promise<void>;
}

export function Statistics({ onFixData }: StatisticsProps) {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState('');

  const db = getDatabaseManager();

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = () => {
    try {
      console.log('Loading statistics...');
      const statisticsData = db.getStatistics();
      const historyData = db.getHistory().slice(0, 10); // Últimos 10 registros
      console.log('Statistics loaded:', statisticsData);
      setStats(statisticsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Crear datos por defecto en caso de error
      setStats({
        totalPositions: 0,
        occupiedPositions: 0,
        availablePositions: 0,
        totalEmployees: 0,
        assignedEmployees: 0,
        unassignedEmployees: 0,
        employeesByDepartment: {},
        occupancyRate: 0,
        workstationStats: {
          totalAssignmentsWithInfo: 0,
          nodesWorkingCount: 0,
          nodesWorkingPercentage: 0,
          electricalWorkingCount: 0,
          electricalWorkingPercentage: 0,
          drawerWorkingCount: 0,
          drawerWorkingPercentage: 0,
          drawerAssignedCount: 0,
          chairAssignedCount: 0,
          workstationIssues: []
        }
      });
      setHistory([]);
    }
  };

  const handleExportData = () => {
    const data = db.exportData();
    setExportData(JSON.stringify(data, null, 2));
    setShowExportModal(true);
  };

  const handleDownloadData = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `office-layout-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as string;
          const parsedData = JSON.parse(data);
          await db.importData(parsedData);
          alert('Datos importados exitosamente');
          loadStatistics();
        } catch (error) {
          alert('Error al importar datos. Verifica el formato del archivo.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      await db.clearAllData();
      loadStatistics();
      alert('Datos eliminados exitosamente');
      // Recargar la página para aplicar el nuevo layout
      window.location.reload();
    }
  };

  const handleResetLayout = async () => {
    if (confirm('¿Resetear el layout a los nombres originales (K1, K2, L1, L2, SA, NA)? Esto mantendrá los empleados.')) {
      try {
        await db.forceResetLayout();
        loadStatistics();
        alert('Layout reseteado exitosamente con nombres originales');
        // Recargar la página para aplicar el nuevo layout
        window.location.reload();
      } catch (error) {
        alert('Error al resetear layout. Verifique la consola.');
        console.error('Error resetting layout:', error);
      }
    }
  };

  const handleRegenerateLayout = () => {
    if (confirm('¿Regenerar el layout con el diseño personalizado? Esto mantendrá los empleados pero recreará las posiciones.')) {
      // Limpiar localStorage para forzar regeneración
      localStorage.clear();
      alert('Layout regenerado. La página se recargará.');
      window.location.reload();
    }
  };

  if (!stats) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  return (
    <div className="statistics-panel">
      <div className="panel-header">
        <h2>📊 Estadísticas y Reportes</h2>
        <div className="header-actions">
          <button className="fix-data-button" onClick={onFixData}>
            🔧 Fix Data
          </button>
          <button className="export-button" onClick={handleExportData}>
            <Download size={16} />
            Exportar
          </button>
          <label className="import-button">
            <Upload size={16} />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              style={{ display: 'none' }}
            />
          </label>
          <button className="regenerate-button" onClick={handleRegenerateLayout}>
            🔄 Regenerar Layout
          </button>
          <button className="regenerate-button" onClick={handleResetLayout}>
            <RefreshCw size={16} />
            Resetear Layout Original
          </button>
          <button className="danger-button" onClick={handleClearData}>
            <Trash2 size={16} />
            Limpiar Todo
          </button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <MapPin />
          </div>
          <div className="stat-content">
            <h3>Posiciones Totales</h3>
            <div className="stat-value">{stats.totalPositions}</div>
            <div className="stat-detail">
              {stats.occupiedPositions} ocupadas • {stats.availablePositions} disponibles
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <h3>Empleados Totales</h3>
            <div className="stat-value">{stats.totalEmployees}</div>
            <div className="stat-detail">
              {stats.assignedEmployees} asignados • {stats.unassignedEmployees} sin asignar
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <h3>Tasa de Ocupación</h3>
            <div className="stat-value">{stats.occupancyRate.toFixed(1)}%</div>
            <div className="stat-detail">
              {stats.occupiedPositions} de {stats.totalPositions} posiciones
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 />
          </div>
          <div className="stat-content">
            <h3>Departamentos</h3>
            <div className="stat-value">{Object.keys(stats.employeesByDepartment).length}</div>
            <div className="stat-detail">
              {Object.values(stats.employeesByDepartment).reduce((a, b) => a + b, 0)} empleados total
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Puestos de Trabajo */}
      <div className="workstation-stats-section">
        <h3>📋 Estado de Puestos de Trabajo</h3>
        <div className="workstation-grid">
          <div className="workstation-card">
            <div className="workstation-icon">🔧</div>
            <div className="workstation-content">
              <h4>Nodos Funcionando</h4>
              <div className="workstation-value">
                {stats.workstationStats.nodesWorkingCount} / {stats.workstationStats.totalAssignmentsWithInfo}
              </div>
              <div className="workstation-percentage">
                {stats.workstationStats.nodesWorkingPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="workstation-card">
            <div className="workstation-icon">⚡</div>
            <div className="workstation-content">
              <h4>Conexión Eléctrica</h4>
              <div className="workstation-value">
                {stats.workstationStats.electricalWorkingCount} / {stats.workstationStats.totalAssignmentsWithInfo}
              </div>
              <div className="workstation-percentage">
                {stats.workstationStats.electricalWorkingPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="workstation-card">
            <div className="workstation-icon">🗃️</div>
            <div className="workstation-content">
              <h4>Cajones Funcionando</h4>
              <div className="workstation-value">
                {stats.workstationStats.drawerWorkingCount} / {stats.workstationStats.totalAssignmentsWithInfo}
              </div>
              <div className="workstation-percentage">
                {stats.workstationStats.drawerWorkingPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="workstation-card">
            <div className="workstation-icon">🗄️</div>
            <div className="workstation-content">
              <h4>Cajones Asignados</h4>
              <div className="workstation-value">
                {stats.workstationStats.drawerAssignedCount}
              </div>
              <div className="workstation-detail">
                de {stats.workstationStats.totalAssignmentsWithInfo} puestos
              </div>
            </div>
          </div>

          <div className="workstation-card">
            <div className="workstation-icon">🪑</div>
            <div className="workstation-content">
              <h4>Sillas Asignadas</h4>
              <div className="workstation-value">
                {stats.workstationStats.chairAssignedCount}
              </div>
              <div className="workstation-detail">
                de {stats.workstationStats.totalAssignmentsWithInfo} puestos
              </div>
            </div>
          </div>
        </div>

        {/* Problemas en puestos de trabajo */}
        {stats.workstationStats.workstationIssues.length > 0 && (
          <div className="workstation-issues">
            <h4>⚠️ Puestos con Problemas</h4>
            <div className="issues-list">
              {stats.workstationStats.workstationIssues.map((issue, index) => (
                <div key={index} className="issue-item">
                  <div className="issue-desk">
                    <strong>{issue.deskName}</strong> - {issue.employee}
                  </div>
                  <div className="issue-problems">
                    {issue.issues.map((problem, i) => (
                      <span key={i} className="issue-tag">{problem}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de departamentos */}
      <div className="chart-section">
        <h3>Empleados por Departamento</h3>
        <div className="department-chart">
          {Object.entries(stats.employeesByDepartment).map(([department, count]) => {
            const percentage = stats.totalEmployees > 0 ? (count / stats.totalEmployees) * 100 : 0;
            return (
              <div key={department} className="department-bar">
                <div className="department-label">
                  <span>{department}</span>
                  <span>{count}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="percentage">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial reciente */}
      <div className="history-section">
        <h3>Actividad Reciente</h3>
        <div className="history-list">
          {history.length > 0 ? (
            history.map((record) => (
              <div key={record.id} className="history-item">
                <div className="history-content">
                  <div className="history-action">
                    {record.action === 'assigned' && '➕'}
                    {record.action === 'moved' && '🔄'}
                    {record.action === 'unassigned' && '➖'}
                    {record.notes}
                  </div>
                  <div className="history-time">
                    {new Date(record.timestamp).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-history">
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de exportación */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="export-modal">
            <h3>Exportar Datos</h3>
            <p>Los datos se han preparado para exportación. Puedes copiar el texto o descargar el archivo.</p>
            <textarea
              value={exportData}
              readOnly
              rows={10}
              className="export-textarea"
            />
            <div className="modal-actions">
              <button onClick={() => setShowExportModal(false)}>Cerrar</button>
              <button onClick={handleDownloadData} className="download-button">
                <Download size={16} />
                Descargar JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
