package tn.sesame.driveeasy.client.repository;

import tn.sesame.driveeasy.client.model.Client;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

@Repository
public class ClientRepository {
    private final Map<Long, Client> storage = new HashMap<>();
    private final AtomicLong seq = new AtomicLong(1);

    public List<Client> findAll() {
        return new ArrayList<>(storage.values());
    }

    public Optional<Client> findById(Long id) {
        return Optional.ofNullable(storage.get(id));
    }

    public Optional<Client> findByCin(String cin) {
        return storage.values().stream()
                .filter(c -> c.getCin().equalsIgnoreCase(cin))
                .findFirst();
    }

    public Optional<Client> findByEmail(String email) {
        return storage.values().stream()
                .filter(c -> c.getEmail().equalsIgnoreCase(email))
                .findFirst();
    }

    public Optional<Client> findByNumeroPermis(String num) {
        return storage.values().stream()
                .filter(c -> c.getNumeroPermis().equalsIgnoreCase(num))
                .findFirst();
    }

    public Client save(Client client) {
        if (client.getId() == null) {
            client.setId(seq.getAndIncrement());
        }
        storage.put(client.getId(), client);
        return client;
    }

    public void delete(Long id) {
        storage.remove(id);
    }

    // simple search by optional params (nom, cin, email)
    public List<Client> search(Optional<String> nom, Optional<String> cin, Optional<String> email) {
        return storage.values().stream()
                .filter(c -> nom.map(n -> c.getNom().toLowerCase().contains(n.toLowerCase())).orElse(true))
                .filter(c -> cin.map(v -> c.getCin().equalsIgnoreCase(v)).orElse(true))
                .filter(c -> email.map(v -> c.getEmail().equalsIgnoreCase(v)).orElse(true))
                .collect(Collectors.toList());
    }
}
