import { useRagStore } from '../model/useRagStore';
import styles from './SearchRagForm.module.css';

export const SearchRagForm = () => {
  const { query, isLoading, setQuery, executeSearch } = useRagStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.searchContainer}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Задайте вопрос по промышленной документации или стандартам..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className={styles.searchButton} disabled={isLoading || !query.trim()}>
          {isLoading ? 'Поиск...' : 'Найти'}
        </button>
      </div>
    </form>
  );
};