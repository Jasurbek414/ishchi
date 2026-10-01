package uz.ishchi.app.job;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Spring Data reuses the same specification for a page's count query. Adding ORDER BY there is at
 * best pointless and at worst invalid SQL, so the nearest-first sort has to sit it out.
 */
class JobSortSpecificationsTest {

    @Test
    @SuppressWarnings("unchecked")
    void doesNotOrderTheCountQuery() {
        Root<Job> root = Mockito.mock(Root.class);
        CriteriaQuery<?> query = Mockito.mock(CriteriaQuery.class);
        CriteriaBuilder cb = Mockito.mock(CriteriaBuilder.class);
        when(query.getResultType()).thenReturn((Class) Long.class);
        when(cb.conjunction()).thenReturn(Mockito.mock(Predicate.class));

        JobSortSpecifications.nearestFirst(1L, 2L)
                .toPredicate(root, (CriteriaQuery<?>) query, cb);

        verify(query, never()).orderBy(any(Order[].class));
        verify(query, never()).orderBy(Mockito.anyList());
    }

    @Test
    @SuppressWarnings("unchecked")
    void ordersTheActualResultQuery() {
        Root<Job> root = Mockito.mock(Root.class, Mockito.RETURNS_DEEP_STUBS);
        CriteriaQuery<?> query = Mockito.mock(CriteriaQuery.class);
        CriteriaBuilder cb = Mockito.mock(CriteriaBuilder.class, Mockito.RETURNS_DEEP_STUBS);
        when(query.getResultType()).thenReturn((Class) Job.class);
        when(cb.conjunction()).thenReturn(Mockito.mock(Predicate.class));
        when(root.get(Mockito.anyString())).thenReturn(Mockito.mock(Path.class, Mockito.RETURNS_DEEP_STUBS));

        JobSortSpecifications.nearestFirst(1L, 2L)
                .toPredicate(root, (CriteriaQuery<?>) query, cb);

        verify(query).orderBy(Mockito.anyList());
    }
}
