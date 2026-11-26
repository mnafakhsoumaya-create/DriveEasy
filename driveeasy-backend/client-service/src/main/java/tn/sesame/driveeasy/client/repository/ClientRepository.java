package tn.sesame.driveeasy.client.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import tn.sesame.driveeasy.client.model.CategorieClient;
import tn.sesame.driveeasy.client.model.Client;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Dépôt en mémoire vive (RAM) pour les clients.
 * Conforme à l'exigence : bases de données strictement interdites.
 */
@Repository
public class ClientRepository {

    private final Map<Long, Client> store = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @PostConstruct
    public void initData() {
        // Client 1 : Adulte éligible, VIP (> 15 locations)
        saveInternal(new Client(null, "08123456", "Ben Ali", "Mohamed",
                LocalDate.of(1988, 4, 15), "mohamed.benali@email.tn", "+216 98 123 456",
                "Avenue Habib Bourguiba, Tunis", "TN-8804-9912",
                LocalDate.now().plusYears(4), CategorieClient.VIP, LocalDate.of(2023, 1, 10)));

        // Client 2 : Adulte éligible, FIDELE (> 5 locations)
        saveInternal(new Client(null, "09234567", "Trabelsi", "Sarra",
                LocalDate.of(1995, 8, 22), "sarra.trabelsi@email.tn", "+216 22 234 567",
                "Route du Relais, La Marsa", "TN-9508-4451",
                LocalDate.now().plusYears(2), CategorieClient.FIDELE, LocalDate.of(2023, 6, 18)));

        // Client 3 : Adulte éligible, STANDARD
        saveInternal(new Client(null, "11345678", "Gharbi", "Youssef",
                LocalDate.of(2000, 11, 5), "youssef.gharbi@email.tn", "+216 55 345 678",
                "Cité Ennasr 2, Ariana", "TN-0011-8899",
                LocalDate.now().plusYears(5), CategorieClient.STANDARD, LocalDate.of(2024, 2, 5)));

        // Client 4 : Permis expiré (test non-éligibilité)
        saveInternal(new Client(null, "07456789", "Mansour", "Amine",
                LocalDate.of(1992, 3, 30), "amine.mansour@email.tn", "+216 97 456 789",
                "Sousse Ville, Sousse", "TN-9203-1122",
                LocalDate.now().minusDays(15), CategorieClient.STANDARD, LocalDate.of(2023, 9, 12)));

        // Client 5 : Âgé de moins de 21 ans (test non-éligibilité âge)
        saveInternal(new Client(null, "14567890", "Jaziri", "Nour",
                LocalDate.now().minusYears(19), "nour.jaziri@email.tn", "+216 29 567 890",
                "Les Berges du Lac 1, Tunis", "TN-0701-3344",
                LocalDate.now().plusYears(6), CategorieClient.STANDARD, LocalDate.of(2024, 5, 20)));
    }

    private Client saveInternal(Client client) {
        if (client.getId() == null) {
            client.setId(idGenerator.getAndIncrement());
        }
        store.put(client.getId(), client);
        return client;
    }

    public Client save(Client client) {
        return saveInternal(client);
    }

    public Optional<Client> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    public Optional<Client> findByCin(String cin) {
        if (cin == null) return Optional.empty();
        return store.values().stream()
                .filter(c -> cin.equalsIgnoreCase(c.getCin()))
                .findFirst();
    }

    public Optional<Client> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return store.values().stream()
                .filter(c -> email.equalsIgnoreCase(c.getEmail()))
                .findFirst();
    }

    public Optional<Client> findByNumeroPermis(String numeroPermis) {
        if (numeroPermis == null) return Optional.empty();
        return store.values().stream()
                .filter(c -> numeroPermis.equalsIgnoreCase(c.getNumeroPermis()))
                .findFirst();
    }

    public List<Client> findAll() {
        return new ArrayList<>(store.values());
    }

    public boolean existsById(Long id) {
        return store.containsKey(id);
    }

    public void deleteById(Long id) {
        store.remove(id);
    }
}
