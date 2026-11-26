package tn.sesame.driveeasy.vehicule.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import tn.sesame.driveeasy.vehicule.model.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Dépôt en mémoire vive (RAM) pour les véhicules.
 * Conforme à l'exigence : bases de données strictement interdites.
 */
@Repository
public class VehiculeRepository {

    private final Map<Long, Vehicule> store = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @PostConstruct
    public void initData() {
        // Jeu de données initial riche en mémoire RAM
        saveInternal(new Vehicule(null, "210-TUN-1234", "Renault", "Clio V", 2023, "Blanc Glacier",
                Carburant.ESSENCE, BoiteVitesse.MANUELLE, 5, 25400, new BigDecimal("65.00"),
                StatutVehicule.DISPONIBLE, "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600",
                CategorieVehicule.ECONOMIQUE));

        saveInternal(new Vehicule(null, "220-TUN-5678", "Peugeot", "208 GT", 2024, "Jaune Faro",
                Carburant.ESSENCE, BoiteVitesse.AUTOMATIQUE, 5, 12000, new BigDecimal("75.00"),
                StatutVehicule.DISPONIBLE, "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600",
                CategorieVehicule.ECONOMIQUE));

        saveInternal(new Vehicule(null, "215-TUN-9012", "Volkswagen", "Golf 8", 2023, "Gris Dauphin",
                Carburant.DIESEL, BoiteVitesse.AUTOMATIQUE, 5, 34000, new BigDecimal("95.00"),
                StatutVehicule.LOUE, "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600",
                CategorieVehicule.BERLINE));

        saveInternal(new Vehicule(null, "230-TUN-3456", "Hyundai", "Tucson N-Line", 2024, "Noir Fantôme",
                Carburant.HYBRIDE, BoiteVitesse.AUTOMATIQUE, 5, 8500, new BigDecimal("130.00"),
                StatutVehicule.DISPONIBLE, "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600",
                CategorieVehicule.SUV));

        saveInternal(new Vehicule(null, "205-TUN-7890", "Mercedes-Benz", "Classe C 220d", 2022, "Argent Selenite",
                Carburant.DIESEL, BoiteVitesse.AUTOMATIQUE, 5, 45000, new BigDecimal("180.00"),
                StatutVehicule.MAINTENANCE, "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600",
                CategorieVehicule.BERLINE));

        saveInternal(new Vehicule(null, "235-TUN-1122", "Tesla", "Model 3 Long Range", 2024, "Bleu Outremer",
                Carburant.ELECTRIQUE, BoiteVitesse.AUTOMATIQUE, 5, 5200, new BigDecimal("160.00"),
                StatutVehicule.DISPONIBLE, "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600",
                CategorieVehicule.LUXE));

        saveInternal(new Vehicule(null, "200-TUN-9988", "Renault", "Master Van", 2022, "Blanc",
                Carburant.DIESEL, BoiteVitesse.MANUELLE, 3, 62000, new BigDecimal("110.00"),
                StatutVehicule.DISPONIBLE, "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600",
                CategorieVehicule.UTILITAIRE));
    }

    private Vehicule saveInternal(Vehicule vehicule) {
        if (vehicule.getId() == null) {
            vehicule.setId(idGenerator.getAndIncrement());
        }
        store.put(vehicule.getId(), vehicule);
        return vehicule;
    }

    public Vehicule save(Vehicule vehicule) {
        return saveInternal(vehicule);
    }

    public Optional<Vehicule> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    public Optional<Vehicule> findByImmatriculation(String immatriculation) {
        if (immatriculation == null) return Optional.empty();
        return store.values().stream()
                .filter(v -> immatriculation.equalsIgnoreCase(v.getImmatriculation()))
                .findFirst();
    }

    public List<Vehicule> findAll() {
        return new ArrayList<>(store.values());
    }

    public boolean existsById(Long id) {
        return store.containsKey(id);
    }

    public boolean existsByImmatriculation(String immatriculation) {
        return findByImmatriculation(immatriculation).isPresent();
    }

    public void deleteById(Long id) {
        store.remove(id);
    }
}
