package tn.sesame.driveeasy.location.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SimulationRequestDto(
        @NotNull(message = "L'identifiant du client est obligatoire")
        Long clientId,

        @NotNull(message = "L'identifiant du véhicule est obligatoire")
        Long vehiculeId,

        @NotNull(message = "La date de début est obligatoire")
        LocalDate dateDebut,

        @NotNull(message = "La date de fin prévue est obligatoire")
        LocalDate dateFinPrevue
) {}
