package tn.sesame.driveeasy.location.dto;

import java.math.BigDecimal;

public record VehiculeRemoteDto(
        Long id,
        String immatriculation,
        String marque,
        String modele,
        BigDecimal prixJournalier,
        String statut,
        String categorie,
        String imageUrl,
        int kilometrage
) {}
