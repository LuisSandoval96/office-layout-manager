import type { Department } from '../types/database';
import './DepartmentLegend.css';

interface DepartmentLegendProps {
  departments: Department[];
}

export function DepartmentLegend({ departments }: DepartmentLegendProps) {
  return (
    <div className="department-legend">
      <h4>🏢 Departamentos</h4>
      <div className="legend-items">
        {departments.map(dept => (
          <div key={dept.id} className="legend-item">
            <div 
              className="color-indicator"
              style={{ backgroundColor: dept.color }}
            ></div>
            <span className="department-name">{dept.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
