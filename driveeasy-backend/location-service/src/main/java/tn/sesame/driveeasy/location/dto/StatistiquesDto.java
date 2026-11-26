package tn.sesame.driveeasy.location.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record StatistiquesDto(
        BigDecimal chiffreAffairesTotal,
        BigDecimal chiffreAffairesMoisCourant,
        long totalLocations,
        long locationsEnCours,
        long locationsTerminees,
        long locationsReservees,
        long locationsAnnulees,
        double tauxOccupationParc,
        List<TopVehiculeDto> topVehicules
) {
    public record TopVehiculeDto(
            Long vehiculeId,
            String description,
            long nombreLocations,
            BigDecimal chiffreGenere
    ) {}
}
