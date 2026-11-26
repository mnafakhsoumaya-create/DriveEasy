package tn.sesame.driveeasy.location.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tn.sesame.driveeasy.location.client.ClientServiceClient;
import tn.sesame.driveeasy.location.client.VehiculeServiceClient;
import tn.sesame.driveeasy.location.dto.*;
import tn.sesame.driveeasy.location.exception.BusinessRuleException;
import tn.sesame.driveeasy.location.exception.ConflictException;
import tn.sesame.driveeasy.location.exception.ResourceNotFoundException;
import tn.sesame.driveeasy.location.model.Location;
import tn.sesame.driveeasy.location.model.StatutLocation;
import tn.sesame.driveeasy.location.repository.LocationRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LocationService {

    private static final Logger log = LoggerFactory.getLogger(LocationService.class);

    private final LocationRepository repository;
    private final VehiculeServiceClient vehiculeClient;
    private final ClientServiceClient clientClient;

    public LocationService(LocationRepository repository,
                           VehiculeServiceClient vehiculeClient,
                           ClientServiceClient clientClient) {
        this.repository = repository;
        this.vehiculeClient = vehiculeClient;
        this.clientClient = clientClient;
    }

    public List<LocationResponseDto> getLocations(StatutLocation statut,
                                                  Long clientId,
                                                  Long vehiculeId,
                                                  LocalDate dateDebut,
                                                  LocalDate dateFin,
                                                  int page,
                                                  int size) {
        List<Location> filtered = repository.findAll().stream()
                .filter(l -> statut == null || l.getStatut() == statut)
                .filter(l -> clientId == null || l.getClientId().equals(clientId))
                .filter(l -> vehiculeId == null || l.getVehiculeId().equals(vehiculeId))
                .filter(l -> dateDebut == null || !l.getDateDebut().isBefore(dateDebut))
                .filter(l -> dateFin == null || !l.getDateFinPrevue().isAfter(dateFin))
                .sorted(Comparator.comparing(Location::getDateCreation, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        int fromIndex = Math.min(page * size, filtered.size());
        int toIndex = Math.min(fromIndex + size, filtered.size());

        return filtered.subList(fromIndex, toIndex).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public LocationDetailDto getLocationDetail(Long id) {
        Location location = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location introuvable avec l'identifiant : " + id));

        ClientRemoteDto client = null;
        VehiculeRemoteDto vehicule = null;

        try {
            client = clientClient.getClient(location.getClientId());
        } catch (Exception e) {
            log.warn("Impossible d'agréger les informations du client {} : {}", location.getClientId(), e.getMessage());
        }

        try {
            vehicule = vehiculeClient.getVehicule(location.getVehiculeId());
        } catch (Exception e) {
            log.warn("Impossible d'agréger les informations du véhicule {} : {}", location.getVehiculeId(), e.getMessage());
        }

        return new LocationDetailDto(
                location.getId(),
                location.getClientId(),
                location.getVehiculeId(),
                location.getDateDebut(),
                location.getDateFinPrevue(),
                location.getDateRetourEffectif(),
                location.getKmDepart(),
                location.getKmRetour(),
                location.getPrixJournalierApplique(),
                location.getMontantTotal(),
                location.getPenalite(),
                location.getStatut(),
                location.getDateCreation(),
                client,
                vehicule
        );
    }

    public boolean hasActiveLocationForClient(Long clientId) {
        return repository.findByClientId(clientId).stream()
                .anyMatch(l -> l.getStatut() == StatutLocation.RESERVEE
                        || l.getStatut() == StatutLocation.EN_COURS);
    }

    public LocationResponseDto createReservation(LocationRequestDto dto) {
        validateDates(dto.dateDebut(), dto.dateFinPrevue());

        EligibiliteRemoteDto eligibilite = clientClient.checkEligibilite(dto.clientId());
        if (eligibilite == null || !eligibilite.eligible()) {
            String motif = (eligibilite != null && eligibilite.motif() != null) ? eligibilite.motif() : "Client non éligible";
            throw new BusinessRuleException("Création impossible : " + motif);
        }

        VehiculeRemoteDto vehicule = vehiculeClient.getVehicule(dto.vehiculeId());
        if (vehicule == null) {
            throw new ResourceNotFoundException("Véhicule introuvable avec l'identifiant : " + dto.vehiculeId());
        }

        if ("MAINTENANCE".equalsIgnoreCase(vehicule.statut()) || "LOUE".equalsIgnoreCase(vehicule.statut())) {
            throw new BusinessRuleException("Le véhicule " + vehicule.immatriculation() + " est actuellement au statut '"
                    + vehicule.statut() + "' et ne peut pas être réservé.");
        }

        boolean chevauchement = repository.findByVehiculeId(dto.vehiculeId()).stream()
                .filter(l -> l.getStatut() == StatutLocation.RESERVEE || l.getStatut() == StatutLocation.EN_COURS)
                .anyMatch(l -> datesOverlap(dto.dateDebut(), dto.dateFinPrevue(), l.getDateDebut(), l.getDateFinPrevue()));

        if (chevauchement) {
            throw new ConflictException("Le véhicule fait déjà l'objet d'une réservation active sur cette période.");
        }

        ClientRemoteDto client = clientClient.getClient(dto.clientId());
        String categorieClient = client != null ? client.categorieClient() : "STANDARD";
        String categorieVehicule = vehicule.categorie() != null ? vehicule.categorie() : "ECONOMIQUE";

        long nbJours = calculateRentalDays(dto.dateDebut(), dto.dateFinPrevue());
        BigDecimal coeff = getCategoryCoefficient(categorieVehicule);
        BigDecimal discountRate = getLoyaltyDiscountRate(categorieClient);

        BigDecimal montantBrut = vehicule.prixJournalier()
                .multiply(BigDecimal.valueOf(nbJours))
                .multiply(coeff)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal montantRemise = montantBrut.multiply(discountRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal montantTotal = montantBrut.subtract(montantRemise);

        Location location = new Location(
                null,
                dto.clientId(),
                dto.vehiculeId(),
                dto.dateDebut(),
                dto.dateFinPrevue(),
                null,
                dto.kmDepart(),
                null,
                vehicule.prixJournalier(),
                montantTotal,
                BigDecimal.ZERO,
                StatutLocation.RESERVEE,
                LocalDateTime.now()
        );

        Location saved = repository.save(location);
        return mapToDto(saved);
    }

    public SimulationResponseDto simulatePricing(SimulationRequestDto dto) {
        validateDates(dto.dateDebut(), dto.dateFinPrevue());

        ClientRemoteDto client = clientClient.getClient(dto.clientId());
        VehiculeRemoteDto vehicule = vehiculeClient.getVehicule(dto.vehiculeId());

        String categorieClient = client != null ? client.categorieClient() : "STANDARD";
        String categorieVehicule = vehicule != null && vehicule.categorie() != null ? vehicule.categorie() : "ECONOMIQUE";
        BigDecimal prixJour = vehicule != null && vehicule.prixJournalier() != null ? vehicule.prixJournalier() : new BigDecimal("70.00");

        long nbJours = calculateRentalDays(dto.dateDebut(), dto.dateFinPrevue());
        BigDecimal coeff = getCategoryCoefficient(categorieVehicule);
        BigDecimal discountRate = getLoyaltyDiscountRate(categorieClient);

        BigDecimal montantBrut = prixJour
                .multiply(BigDecimal.valueOf(nbJours))
                .multiply(coeff)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal montantRemise = montantBrut.multiply(discountRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal montantTotalEstime = montantBrut.subtract(montantRemise);

        return new SimulationResponseDto(
                dto.clientId(),
                dto.vehiculeId(),
                dto.dateDebut(),
                dto.dateFinPrevue(),
                nbJours,
                prixJour,
                coeff,
                montantBrut,
                discountRate,
                montantRemise,
                montantTotalEstime,
                categorieClient,
                categorieVehicule
        );
    }

    public LocationResponseDto startRental(Long id) {
        Location location = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location introuvable avec l'identifiant : " + id));

        if (location.getStatut() != StatutLocation.RESERVEE) {
            throw new BusinessRuleException("Seule une réservation au statut RESERVEE peut être démarrée (statut actuel : " + location.getStatut() + ").");
        }

        try {
            vehiculeClient.updateStatut(location.getVehiculeId(), "LOUE");
        } catch (Exception e) {
            log.error("Échec du passage du véhicule à LOUE : {}", e.getMessage());
            throw new BusinessRuleException("Impossible de démarrer la location : échec de mise à jour du statut du véhicule.");
        }

        location.setStatut(StatutLocation.EN_COURS);
        Location updated = repository.save(location);
        return mapToDto(updated);
    }

    public LocationResponseDto returnRental(Long id, RetourLocationDto dto) {
        Location location = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location introuvable avec l'identifiant : " + id));

        if (location.getStatut() != StatutLocation.EN_COURS) {
            throw new BusinessRuleException("Seule une location EN_COURS peut faire l'objet d'un retour (statut actuel : " + location.getStatut() + ").");
        }

        if (dto.kmRetour() < location.getKmDepart()) {
            throw new BusinessRuleException("Le kilométrage de retour (" + dto.kmRetour() + ") ne peut pas être inférieur au kilométrage de départ (" + location.getKmDepart() + ").");
        }

        LocalDate dateRetour = dto.dateRetourEffectif() != null ? dto.dateRetourEffectif() : LocalDate.now();
        location.setDateRetourEffectif(dateRetour);
        location.setKmRetour(dto.kmRetour());

        BigDecimal penalite = BigDecimal.ZERO;
        if (dateRetour.isAfter(location.getDateFinPrevue())) {
            long joursRetard = ChronoUnit.DAYS.between(location.getDateFinPrevue(), dateRetour);
            penalite = location.getPrixJournalierApplique()
                    .multiply(new BigDecimal("1.5"))
                    .multiply(BigDecimal.valueOf(joursRetard))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        location.setPenalite(penalite);
        location.setMontantTotal(location.getMontantTotal().add(penalite));
        location.setStatut(StatutLocation.TERMINEE);

        try {
            vehiculeClient.updateStatut(location.getVehiculeId(), "DISPONIBLE");
        } catch (Exception e) {
            log.error("Échec du passage du véhicule à DISPONIBLE lors du retour : {}", e.getMessage());
        }

        Location saved = repository.save(location);

        try {
            long totalCompleted = repository.countCompletedRentalsByClientId(location.getClientId());
            if (totalCompleted >= 15) {
                clientClient.updateCategorie(location.getClientId(), "VIP");
            } else if (totalCompleted >= 5) {
                clientClient.updateCategorie(location.getClientId(), "FIDELE");
            }
        } catch (Exception e) {
            log.warn("Mise à jour du statut fidélité échouée pour le client {} : {}", location.getClientId(), e.getMessage());
        }

        return mapToDto(saved);
    }

    public LocationResponseDto cancelReservation(Long id) {
        Location location = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location introuvable avec l'identifiant : " + id));

        if (location.getStatut() == StatutLocation.TERMINEE) {
            throw new BusinessRuleException("Une location déjà terminée ne peut pas être annulée.");
        }

        if (location.getStatut() == StatutLocation.EN_COURS) {
            try {
                vehiculeClient.updateStatut(location.getVehiculeId(), "DISPONIBLE");
            } catch (Exception e) {
                log.warn("Impossible de remettre le véhicule à DISPONIBLE suite à l'annulation : {}", e.getMessage());
            }
        }

        location.setStatut(StatutLocation.ANNULEE);
        Location updated = repository.save(location);
        return mapToDto(updated);
    }

    public StatistiquesDto getStatistiques() {
        List<Location> all = repository.findAll();

        BigDecimal caTotal = all.stream()
                .filter(l -> l.getStatut() == StatutLocation.TERMINEE || l.getStatut() == StatutLocation.EN_COURS)
                .map(Location::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        YearMonth currentMonth = YearMonth.now();
        BigDecimal caMois = all.stream()
                .filter(l -> l.getStatut() == StatutLocation.TERMINEE || l.getStatut() == StatutLocation.EN_COURS)
                .filter(l -> l.getDateDebut() != null && YearMonth.from(l.getDateDebut()).equals(currentMonth))
                .map(Location::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long countEnCours = all.stream().filter(l -> l.getStatut() == StatutLocation.EN_COURS).count();
        long countTerminees = all.stream().filter(l -> l.getStatut() == StatutLocation.TERMINEE).count();
        long countReservees = all.stream().filter(l -> l.getStatut() == StatutLocation.RESERVEE).count();
        long countAnnulees = all.stream().filter(l -> l.getStatut() == StatutLocation.ANNULEE).count();

        // Count distinct vehicles in the fleet from the vehicle service. A fixed
        // denominator makes this indicator wrong as soon as the fleet changes.
        double tauxOccupation = 0.0;
        try {
            long tailleParc = vehiculeClient.getVehicules().size();
            if (tailleParc > 0) {
                tauxOccupation = (double) countEnCours / tailleParc * 100.0;
            }
        } catch (Exception e) {
            log.warn("Impossible de calculer le taux d'occupation sans le parc véhicules : {}", e.getMessage());
        }

        Map<Long, Long> countsByVehicule = all.stream()
                .filter(l -> l.getStatut() != StatutLocation.ANNULEE)
                .collect(Collectors.groupingBy(Location::getVehiculeId, Collectors.counting()));

        Map<Long, BigDecimal> caByVehicule = all.stream()
                .filter(l -> l.getStatut() != StatutLocation.ANNULEE)
                .collect(Collectors.groupingBy(Location::getVehiculeId,
                        Collectors.reducing(BigDecimal.ZERO, Location::getMontantTotal, BigDecimal::add)));

        List<StatistiquesDto.TopVehiculeDto> topVehicules = countsByVehicule.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> new StatistiquesDto.TopVehiculeDto(
                        entry.getKey(),
                        "Véhicule #" + entry.getKey(),
                        entry.getValue(),
                        caByVehicule.getOrDefault(entry.getKey(), BigDecimal.ZERO)
                ))
                .toList();

        return new StatistiquesDto(
                caTotal,
                caMois,
                all.size(),
                countEnCours,
                countTerminees,
                countReservees,
                countAnnulees,
                Math.round(tauxOccupation * 10.0) / 10.0,
                topVehicules
        );
    }

    private void validateDates(LocalDate debut, LocalDate fin) {
        if (debut == null || fin == null) {
            throw new BusinessRuleException("Les dates de début et de fin sont obligatoires.");
        }
        if (fin.isBefore(debut)) {
            throw new BusinessRuleException("La date de fin ne peut pas être antérieure à la date de début.");
        }
    }

    private boolean datesOverlap(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        return !start1.isAfter(end2) && !start2.isAfter(end1);
    }

    private long calculateRentalDays(LocalDate start, LocalDate end) {
        long days = ChronoUnit.DAYS.between(start, end);
        return days <= 0 ? 1 : days;
    }

    private BigDecimal getCategoryCoefficient(String category) {
        if (category == null) return BigDecimal.ONE;
        return switch (category.toUpperCase()) {
            case "BERLINE" -> new BigDecimal("1.2");
            case "SUV" -> new BigDecimal("1.3");
            case "LUXE" -> new BigDecimal("1.5");
            case "UTILITAIRE" -> new BigDecimal("1.1");
            default -> BigDecimal.ONE;
        };
    }

    private BigDecimal getLoyaltyDiscountRate(String categoryClient) {
        if (categoryClient == null) return BigDecimal.ZERO;
        return switch (categoryClient.toUpperCase()) {
            case "VIP" -> new BigDecimal("0.10");
            case "FIDELE" -> new BigDecimal("0.05");
            default -> BigDecimal.ZERO;
        };
    }

    private LocationResponseDto mapToDto(Location l) {
        return new LocationResponseDto(
                l.getId(),
                l.getClientId(),
                l.getVehiculeId(),
                l.getDateDebut(),
                l.getDateFinPrevue(),
                l.getDateRetourEffectif(),
                l.getKmDepart(),
                l.getKmRetour(),
                l.getPrixJournalierApplique(),
                l.getMontantTotal(),
                l.getPenalite(),
                l.getStatut(),
                l.getDateCreation()
        );
    }
}
