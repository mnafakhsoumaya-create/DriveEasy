package tn.sesame.driveeasy.client.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tn.sesame.driveeasy.client.dto.*;
import tn.sesame.driveeasy.client.exception.BusinessRuleException;
import tn.sesame.driveeasy.client.exception.DuplicateResourceException;
import tn.sesame.driveeasy.client.exception.ResourceNotFoundException;
import tn.sesame.driveeasy.client.model.CategorieClient;
import tn.sesame.driveeasy.client.model.Client;
import tn.sesame.driveeasy.client.repository.ClientRepository;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClientService {

    private final ClientRepository repository;

    @Value("${driveeasy.client.min-age-eligibility:21}")
    private int minAgeEligibility;

    public ClientService(ClientRepository repository) {
        this.repository = repository;
    }

    public List<ClientResponseDto> searchClients(String query) {
        return repository.findAll().stream()
                .filter(c -> {
                    if (query == null || query.isBlank()) return true;
                    String q = query.trim().toLowerCase();
                    return c.getNom().toLowerCase().contains(q)
                            || c.getPrenom().toLowerCase().contains(q)
                            || c.getCin().toLowerCase().contains(q)
                            || c.getEmail().toLowerCase().contains(q);
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ClientResponseDto getClientById(Long id) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'identifiant : " + id));
        return mapToDto(client);
    }

    public ClientResponseDto createClient(ClientRequestDto dto) {
        // Unicité CIN
        if (repository.findByCin(dto.cin()).isPresent()) {
            throw new DuplicateResourceException("Un client avec le CIN '" + dto.cin() + "' existe déjà.");
        }

        // Unicité Email
        if (repository.findByEmail(dto.email()).isPresent()) {
            throw new DuplicateResourceException("Un client avec l'email '" + dto.email() + "' existe déjà.");
        }

        // Unicité Permis
        if (repository.findByNumeroPermis(dto.numeroPermis()).isPresent()) {
            throw new DuplicateResourceException("Un client avec le numéro de permis '" + dto.numeroPermis() + "' existe déjà.");
        }

        Client client = new Client(
                null,
                dto.cin().trim(),
                dto.nom().trim(),
                dto.prenom().trim(),
                dto.dateNaissance(),
                dto.email().trim().toLowerCase(),
                dto.telephone().trim(),
                dto.adresse().trim(),
                dto.numeroPermis().trim(),
                dto.dateExpirationPermis(),
                dto.categorieClient() != null ? dto.categorieClient() : CategorieClient.STANDARD,
                LocalDate.now()
        );

        Client saved = repository.save(client);
        return mapToDto(saved);
    }

    public ClientResponseDto updateClient(Long id, ClientRequestDto dto) {
        Client existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'identifiant : " + id));

        // Vérification unicité CIN
        repository.findByCin(dto.cin()).ifPresent(c -> {
            if (!c.getId().equals(id)) {
                throw new DuplicateResourceException("Un client avec le CIN '" + dto.cin() + "' existe déjà.");
            }
        });

        // Vérification unicité Email
        repository.findByEmail(dto.email()).ifPresent(c -> {
            if (!c.getId().equals(id)) {
                throw new DuplicateResourceException("Un client avec l'email '" + dto.email() + "' existe déjà.");
            }
        });

        // Vérification unicité Numéro de Permis
        repository.findByNumeroPermis(dto.numeroPermis()).ifPresent(c -> {
            if (!c.getId().equals(id)) {
                throw new DuplicateResourceException("Un client avec le numéro de permis '" + dto.numeroPermis() + "' existe déjà.");
            }
        });

        existing.setCin(dto.cin().trim());
        existing.setNom(dto.nom().trim());
        existing.setPrenom(dto.prenom().trim());
        existing.setDateNaissance(dto.dateNaissance());
        existing.setEmail(dto.email().trim().toLowerCase());
        existing.setTelephone(dto.telephone().trim());
        existing.setAdresse(dto.adresse().trim());
        existing.setNumeroPermis(dto.numeroPermis().trim());
        existing.setDateExpirationPermis(dto.dateExpirationPermis());
        if (dto.categorieClient() != null) {
            existing.setCategorieClient(dto.categorieClient());
        }

        Client updated = repository.save(existing);
        return mapToDto(updated);
    }

    public void deleteClient(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Client introuvable avec l'identifiant : " + id);
        }
        repository.deleteById(id);
    }

    public EligibiliteResponseDto checkEligibilite(Long id) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'identifiant : " + id));

        int age = Period.between(client.getDateNaissance(), LocalDate.now()).getYears();
        boolean ageValide = age >= minAgeEligibility;
        boolean permisValide = client.getDateExpirationPermis() != null && !client.getDateExpirationPermis().isBefore(LocalDate.now());

        boolean eligible = ageValide && permisValide;

        StringBuilder motif = new StringBuilder();
        if (eligible) {
            motif.append("Client éligible à la location.");
        } else {
            if (!ageValide) {
                motif.append("Âge insuffisant (").append(age).append(" ans, minimum requis : ").append(minAgeEligibility).append(" ans). ");
            }
            if (!permisValide) {
                motif.append("Permis de conduire expiré depuis le ").append(client.getDateExpirationPermis()).append(". ");
            }
        }

        return new EligibiliteResponseDto(
                client.getId(),
                client.getPrenom() + " " + client.getNom(),
                eligible,
                age,
                ageValide,
                client.getDateExpirationPermis(),
                permisValide,
                motif.toString().trim()
        );
    }

    public ClientResponseDto updateCategorie(Long id, CategorieUpdateDto dto) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'identifiant : " + id));

        client.setCategorieClient(dto.categorie());
        Client updated = repository.save(client);
        return mapToDto(updated);
    }

    private boolean isClientEligible(Client client) {
        int age = Period.between(client.getDateNaissance(), LocalDate.now()).getYears();
        boolean ageValide = age >= minAgeEligibility;
        boolean permisValide = client.getDateExpirationPermis() != null && !client.getDateExpirationPermis().isBefore(LocalDate.now());
        return ageValide && permisValide;
    }

    private ClientResponseDto mapToDto(Client c) {
        return new ClientResponseDto(
                c.getId(),
                c.getCin(),
                c.getNom(),
                c.getPrenom(),
                c.getDateNaissance(),
                c.getEmail(),
                c.getTelephone(),
                c.getAdresse(),
                c.getNumeroPermis(),
                c.getDateExpirationPermis(),
                c.getCategorieClient(),
                c.getDateInscription(),
                isClientEligible(c)
        );
    }
}
