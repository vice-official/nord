import { SearchRagForm } from '@/features/search-rag/ui/SearchRagForm';
import { useRagStore } from '@/features/search-rag/model/useRagStore';
import styles from './RagPage.module.css';

export const RagPage = () => {
  const { answer, sources, error } = useRagStore();

  return (
    <main className={styles.ragPage}>
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>Интеллектуальный RAG-поиск</h1>
        <p className={styles.subtitle}>Поиск смысловых ответов по верифицированной базе знаний и ТЗ</p>
        <SearchRagForm />
        {error && <div className={styles.errorBlock}>{error}</div>}
        {answer && (
          <div className={styles.resultsWrapper}>
            <section className={styles.answerSection}>
              <h2>Ответ системы</h2>
              <div className={styles.answerBody}>{answer}</div>
            </section>
            {sources.length > 0 && (
              <section className={styles.sourcesSection}>
                <h2>Первоисточники документации</h2>
                <div className={styles.sourcesGrid}>
                  {sources.map((source) => (
                    <div key={source.id} className={styles.sourceCard}>
                      <p className={styles.sourceText}>"{source.text}"</p>
                      {source.score && (
                        <span className={styles.sourceScore}>
                          Релевантность: {(source.score * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
};