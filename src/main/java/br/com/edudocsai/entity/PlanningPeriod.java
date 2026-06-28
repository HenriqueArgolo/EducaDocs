package br.com.edudocsai.entity;

/**
 * Define a periodicidade de um plano de aula.
 *
 * <ul>
 *   <li>{@link #SINGLE}  – aula única (padrão atual, sem periodicidade)</li>
 *   <li>{@link #WEEKLY}  – plano semanal (5 dias letivos, com distribuição diária)</li>
 *   <li>{@link #MONTHLY} – plano mensal (4 semanas, com objetivos semanais e cronograma)</li>
 * </ul>
 */
public enum PlanningPeriod {
    SINGLE,
    WEEKLY,
    MONTHLY
}
