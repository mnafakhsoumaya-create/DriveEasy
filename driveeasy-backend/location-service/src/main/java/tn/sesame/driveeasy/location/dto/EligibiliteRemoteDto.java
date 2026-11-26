package tn.sesame.driveeasy.location.dto;

public record EligibiliteRemoteDto(
        Long clientId,
        String nomComplet,
        boolean eligible,
        int age,
        boolean ageValide,
        boolean permisValide,
        String motif
) {}
