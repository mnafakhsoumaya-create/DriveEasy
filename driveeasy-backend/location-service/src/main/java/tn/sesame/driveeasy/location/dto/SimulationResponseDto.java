package tn.sesame.driveeasy.location.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SimulationResponseDto(
        Long clientId,
        Long vehiculeId,
        LocalDate dateDebut,
        LocalDate dateFinPrevue,
        long nombreJours,
        BigDecimal prixJournalier,
        BigDecimal coefficientCategorie,
        BigDecimal montantBrut,
        BigDecimal tauxRemiseFidelite,
        BigDecimal montantRemise,
        BigDecimal montantTotalEstime,
        String categorieClient,
        String categorieVehicule
) {}
