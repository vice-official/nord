import { HealthDashboard } from '@/entities/system-service/ui/HealthDashboard';
import styles from './SettingsPage.module.css';

export const SettingsPage = () => {
  return (
    <main className={styles.settingsPage}>
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>Настройки системы</h1>
        <p className={styles.subtitle}>Конфигурация параметров ИИ-инженера и статус агентов</p>

        <div className={styles.sectionsLayout}>
          <section className={styles.configCard}>
            <h2>Профилирование генерации</h2>

            <div className={styles.formGroup}>
              <label>Базовая модель по умолчанию</label>
              <select className={styles.selectInput} defaultValue="qwen_32b">
                <option value="qwen_32b">Vice (Qwen 32B Sub-agents)</option>
                <option value="gigachat_pro">GigaChat Pro (Sber System)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Глубина аудита качества (итерации)</label>
              <select className={styles.selectInput} defaultValue="3">
                <option value="1">1 — Быстрая сборка без проверки</option>
                <option value="3">3 — Стандартный кросс-аудит агентов</option>
                <option value="5">5 — Максимальный строгий контроль (ГОСТ)</option>
              </select>
            </div>
          </section>

          <HealthDashboard />
        </div>
      </div>
    </main>
  );
};