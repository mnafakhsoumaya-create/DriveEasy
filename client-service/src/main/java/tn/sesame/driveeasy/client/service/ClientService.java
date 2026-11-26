package tn.sesame.driveeasy.client.service;

import tn.sesame.driveeasy.client.model.Client;
import tn.sesame.driveeasy.client.enums.CategorieClient;
import tn.sesame.driveeasy.client.repository.ClientRepository;
import tn.sesame.driveeasy.client.exception.*;
import tn.sesame.driveeasy.client.dto.ActiveLocationResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Optional;

@Service
public class ClientService {

    private final ClientRepository repository;
    private final RestTemplate restTemplate;

    public ClientService(ClientRepository repository, RestTemplate restTemplate) {
        this.repository = repository;
        this.restTemplate = restTemplate;
    }

    public List<Client> getAll(Optional<String> nom, Optional<String> cin, Optional<String> email) {
        return repository.search(nom, cin, email);
    }

    public Client getById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ClientNotFoundException(id));
    }

    public Client create(Client client) {
        if (repository.findByCin(client.getCin()).isPresent())
            throw new ClientAlreadyExistsException("CIN", client.getCin());
        if (repository.findByEmail(client.getEmail()).isPresent())
            throw new ClientAlreadyExistsException("email", client.getEmail());
        if (repository.findByNumeroPermis(client.getNumeroPermis()).isPresent())
            throw new ClientAlreadyExistsException("numeroPermis", client.getNumeroPermis());

        client.setCategorieClient(CategorieClient.STANDARD);
        client.setDateInscription(LocalDate.now());
        return repository.save(client);
    }

    public Client update(Long id, Client updated) {
        Client existing = getById(id);
        repository.findByCin(updated.getCin()).ifPresent(c -> {
            if (!c.getId().equals(id))
                throw new ClientAlreadyExistsException("CIN", updated.getCin());
        });
        repository.findByEmail(updated.getEmail()).ifPresent(c -> {
            if (!c.getId().equals(id))
                throw new ClientAlreadyExistsException("email", updated.getEmail());
        });
        repository.findByNumeroPermis(updated.getNumeroPermis()).ifPresent(c -> {
            if (!c.getId().equals(id))
                throw new ClientAlreadyExistsException("numeroPermis", updated.getNumeroPermis());
        });

        existing.setCin(updated.getCin());
        existing.setNom(updated.getNom());
        existing.setPrenom(updated.getPrenom());
        existing.setDateNaissance(updated.getDateNaissance());
        existing.setEmail(updated.getEmail());
        existing.setTelephone(updated.getTelephone());
        existing.setAdresse(updated.getAdresse());
        existing.setNumeroPermis(updated.getNumeroPermis());
        existing.setDateExpirationPermis(updated.getDateExpirationPermis());
        return repository.save(existing);
    }

    public void delete(Long id) {
        String url = "http://location-service/locations/client/" + id + "/active";
        try {
            ActiveLocationResponse resp = restTemplate.getForObject(url, ActiveLocationResponse.class);
            if (resp != null && resp.isActive()) {
                throw new ClientHasActiveLocationException(id);
            }
        } catch (Exception e) {
            // Assume no active location if the call fails
        }
        repository.delete(id);
    }

    public boolean isEligible(Long id) {
        Client client = getById(id);
        boolean ageOk = Period.between(client.getDateNaissance(), LocalDate.now()).getYears() >= 21;
        boolean permisOk = !client.getDateExpirationPermis().isBefore(LocalDate.now());
        return ageOk && permisOk;
    }

    public void updateCategory(Long id, CategorieClient newCat) {
        Client client = getById(id);
        client.setCategorieClient(newCat);
        repository.save(client);
    }
}
