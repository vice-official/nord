import { useEffect } from 'react';
import { useSystemStore } from '../model/useSystemStore';
import styles from './HealthDashboard.module.css';

export const HealthDashboard = () => {
  const { services, isChecking, checkSystemHealth } = useSystemStore();

  useEffect(() => {
    checkSystemHealth();
  }, [checkSystemHealth]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <span className={styles.title}>Мониторинг инфраструктуры</span>
        <button className={styles.refreshButton} onClick={checkSystemHealth} disabled={isChecking}>
          {isChecking ? 'Обновление...' : 'Обновить'}
        </button>
      </div>

      <div className={styles.grid}>
        {services.map((service) => (
          <div key={service.name} className={styles.serviceRow}>
            <div className={styles.serviceInfo}>
              <div className={`${styles.statusIndicator} ${styles[`status_${service.status}`]}`} />
              <span className={styles.serviceName}>{service.name}</span>
            </div>
            <span className={styles.metrics}>
              {service.latency_ms ? `${service.latency_ms} ms` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};