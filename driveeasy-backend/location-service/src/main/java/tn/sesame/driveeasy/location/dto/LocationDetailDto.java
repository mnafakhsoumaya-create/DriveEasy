package tn.sesame.driveeasy.location.dto;

import tn.sesame.driveeasy.location.model.StatutLocation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LocationDetailDto(
        Long id,
        Long clientId,
        Long vehiculeId,
        LocalDate dateDebut,
        LocalDate dateFinPrevue,
        LocalDate dateRetourEffectif,
        int kmDepart,
        Integer kmRetour,
        BigDecimal prixJournalierApplique,
        BigDecimal montantTotal,
        BigDecimal penalite,
        StatutLocation statut,
        LocalDateTime dateCreation,
        ClientRemoteDto client,
        VehiculeRemoteDto vehicule
) {}
