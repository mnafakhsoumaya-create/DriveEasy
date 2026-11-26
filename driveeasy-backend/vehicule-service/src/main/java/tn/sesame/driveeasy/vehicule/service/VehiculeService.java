package tn.sesame.driveeasy.vehicule.service;

import org.springframework.stereotype.Service;
import tn.sesame.driveeasy.vehicule.dto.StatutUpdateDto;
import tn.sesame.driveeasy.vehicule.dto.VehiculeRequestDto;
import tn.sesame.driveeasy.vehicule.dto.VehiculeResponseDto;
import tn.sesame.driveeasy.vehicule.exception.BusinessRuleException;
import tn.sesame.driveeasy.vehicule.exception.DuplicateResourceException;
import tn.sesame.driveeasy.vehicule.exception.ResourceNotFoundException;
import tn.sesame.driveeasy.vehicule.model.*;
import tn.sesame.driveeasy.vehicule.repository.VehiculeRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehiculeService {

    private final VehiculeRepository repository;

    public VehiculeService(VehiculeRepository repository) {
        this.repository = repository;
    }

    public List<VehiculeResponseDto> getAllVehicules(CategorieVehicule categorie,
                                                     Carburant carburant,
                                                     StatutVehicule statut,
                                                     BigDecimal prixMax) {
        return repository.findAll().stream()
                .filter(v -> categorie == null || v.getCategorie() == categorie)
                .filter(v -> carburant == null || v.getCarburant() == carburant)
                .filter(v -> statut == null || v.getStatut() == statut)
                .filter(v -> prixMax == null || v.getPrixJournalier().compareTo(prixMax) <= 0)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public VehiculeResponseDto getVehiculeById(Long id) {
        Vehicule vehicule = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable avec l'identifiant : " + id));
        return mapToDto(vehicule);
    }

    public VehiculeResponseDto createVehicule(VehiculeRequestDto dto) {
        int currentYear = Year.now().getValue();
        if (dto.annee() > currentYear) {
            throw new BusinessRuleException("L'année du véhicule (" + dto.annee() + ") ne peut pas dépasser l'année courante (" + currentYear + ").");
        }

        if (dto.prixJournalier() == null || dto.prixJournalier().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Le prix journalier doit être strictement positif.");
        }

        if (repository.existsByImmatriculation(dto.immatriculation())) {
            throw new DuplicateResourceException("Un véhicule avec l'immatriculation '" + dto.immatriculation() + "' existe déjà.");
        }

        Vehicule vehicule = new Vehicule(
                null,
                dto.immatriculation().trim().toUpperCase(),
                dto.marque(),
                dto.modele(),
                dto.annee(),
                dto.couleur(),
                dto.carburant(),
                dto.boite(),
                dto.nbPlaces(),
                dto.kilometrage(),
                dto.prixJournalier(),
                dto.statut() != null ? dto.statut() : StatutVehicule.DISPONIBLE,
                dto.imageUrl() != null && !dto.imageUrl().isBlank() ? dto.imageUrl() : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600",
                dto.categorie()
        );

        Vehicule saved = repository.save(vehicule);
        return mapToDto(saved);
    }

    public VehiculeResponseDto updateVehicule(Long id, VehiculeRequestDto dto) {
        Vehicule existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable avec l'identifiant : " + id));

        int currentYear = Year.now().getValue();
        if (dto.annee() > currentYear) {
            throw new BusinessRuleException("L'année du véhicule (" + dto.annee() + ") ne peut pas dépasser l'année courante (" + currentYear + ").");
        }

        if (dto.prixJournalier() == null || dto.prixJournalier().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Le prix journalier doit être strictement positif.");
        }

        // Si l'immatriculation a changé, vérifier qu'elle n'est pas déjà prise
        if (!existing.getImmatriculation().equalsIgnoreCase(dto.immatriculation())) {
            if (repository.existsByImmatriculation(dto.immatriculation())) {
                throw new DuplicateResourceException("Un véhicule avec l'immatriculation '" + dto.immatriculation() + "' existe déjà.");
            }
        }

        existing.setImmatriculation(dto.immatriculation().trim().toUpperCase());
        existing.setMarque(dto.marque());
        existing.setModele(dto.modele());
        existing.setAnnee(dto.annee());
        existing.setCouleur(dto.couleur());
        existing.setCarburant(dto.carburant());
        existing.setBoite(dto.boite());
        existing.setNbPlaces(dto.nbPlaces());
        existing.setKilometrage(dto.kilometrage());
        existing.setPrixJournalier(dto.prixJournalier());
        if (dto.statut() != null) {
            existing.setStatut(dto.statut());
        }
        if (dto.imageUrl() != null && !dto.imageUrl().isBlank()) {
            existing.setImageUrl(dto.imageUrl());
        }
        existing.setCategorie(dto.categorie());

        Vehicule updated = repository.save(existing);
        return mapToDto(updated);
    }

    public void deleteVehicule(Long id) {
        Vehicule vehicule = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable avec l'identifiant : " + id));

        // Règle métier : refus de suppression si loué
        if (vehicule.getStatut() == StatutVehicule.LOUE) {
            throw new BusinessRuleException("Impossible de supprimer le véhicule car il est actuellement loué.");
        }

        repository.deleteById(id);
    }

    public VehiculeResponseDto updateStatut(Long id, StatutUpdateDto dto) {
        Vehicule vehicule = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable avec l'identifiant : " + id));

        vehicule.setStatut(dto.statut());
        Vehicule updated = repository.save(vehicule);
        return mapToDto(updated);
    }

    public List<VehiculeResponseDto> getVehiculesDisponiblesPourPeriode(LocalDate dateDebut, LocalDate dateFin) {
        // En mémoire, un véhicule disponible pour une réservation immédiate doit être au statut DISPONIBLE
        // (les contrôles croisés de dates de réservation sont également consolidés par location-service)
        return repository.findAll().stream()
                .filter(v -> v.getStatut() == StatutVehicule.DISPONIBLE)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private VehiculeResponseDto mapToDto(Vehicule v) {
        return new VehiculeResponseDto(
                v.getId(),
                v.getImmatriculation(),
                v.getMarque(),
                v.getModele(),
                v.getAnnee(),
                v.getCouleur(),
                v.getCarburant(),
                v.getBoite(),
                v.getNbPlaces(),
                v.getKilometrage(),
                v.getPrixJournalier(),
                v.getStatut(),
                v.getImageUrl(),
                v.getCategorie()
        );
    }
}
