package tn.sesame.driveeasy.client.dto;

import java.time.LocalDate;

public record EligibiliteResponseDto(
        Long clientId,
        String nomComplet,
        boolean eligible,
        int age,
        boolean ageValide,
        LocalDate dateExpirationPermis,
        boolean permisValide,
        String motif
) {}
