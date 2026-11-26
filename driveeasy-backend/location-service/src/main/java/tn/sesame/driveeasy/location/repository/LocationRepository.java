package tn.sesame.driveeasy.location.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import tn.sesame.driveeasy.location.model.Location;
import tn.sesame.driveeasy.location.model.StatutLocation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Dépôt en mémoire vive (RAM) pour les locations.
 * Conforme à l'exigence : bases de données strictement interdites.
 */
@Repository
public class LocationRepository {

    private final Map<Long, Location> store = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @PostConstruct
    public void initData() {
        // Location 1 : EN_COURS (Golf 8, client Sarra Trabelsi id=2)
        saveInternal(new Location(null, 2L, 3L,
                LocalDate.now().minusDays(2), LocalDate.now().plusDays(3), null,
                34000, null, new BigDecimal("95.00"),
                new BigDecimal("451.25"), BigDecimal.ZERO,
                StatutLocation.EN_COURS, LocalDateTime.now().minusDays(2)));

        // Location 2 : TERMINEE (historique client Mohamed Ben Ali id=1)
        saveInternal(new Location(null, 1L, 1L,
                LocalDate.now().minusDays(15), LocalDate.now().minusDays(10), LocalDate.now().minusDays(10),
                25000, 25400, new BigDecimal("65.00"),
                new BigDecimal("292.50"), BigDecimal.ZERO,
                StatutLocation.TERMINEE, LocalDateTime.now().minusDays(16)));

        // Location 3 : RESERVEE future (client Youssef Gharbi id=3)
        saveInternal(new Location(null, 3L, 4L,
                LocalDate.now().plusDays(2), LocalDate.now().plusDays(7), null,
                8500, null, new BigDecimal("130.00"),
                new BigDecimal("845.00"), BigDecimal.ZERO,
                StatutLocation.RESERVEE, LocalDateTime.now().minusHours(5)));

        // Location 4 : TERMINEE avec retard et pénalités
        saveInternal(new Location(null, 1L, 2L,
                LocalDate.now().minusDays(25), LocalDate.now().minusDays(20), LocalDate.now().minusDays(18),
                11200, 12000, new BigDecimal("75.00"),
                new BigDecimal("562.50"), new BigDecimal("225.00"),
                StatutLocation.TERMINEE, LocalDateTime.now().minusDays(26)));
    }

    private Location saveInternal(Location location) {
        if (location.getId() == null) {
            location.setId(idGenerator.getAndIncrement());
        }
        store.put(location.getId(), location);
        return location;
    }

    public Location save(Location location) {
        return saveInternal(location);
    }

    public Optional<Location> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Location> findAll() {
        return new ArrayList<>(store.values());
    }

    public List<Location> findByClientId(Long clientId) {
        return store.values().stream()
                .filter(l -> l.getClientId().equals(clientId))
                .toList();
    }

    public List<Location> findByVehiculeId(Long vehiculeId) {
        return store.values().stream()
                .filter(l -> l.getVehiculeId().equals(vehiculeId))
                .toList();
    }

    public long countCompletedRentalsByClientId(Long clientId) {
        return store.values().stream()
                .filter(l -> l.getClientId().equals(clientId) && l.getStatut() == StatutLocation.TERMINEE)
                .count();
    }

    public boolean existsById(Long id) {
        return store.containsKey(id);
    }

    public void deleteById(Long id) {
        store.remove(id);
    }
}
