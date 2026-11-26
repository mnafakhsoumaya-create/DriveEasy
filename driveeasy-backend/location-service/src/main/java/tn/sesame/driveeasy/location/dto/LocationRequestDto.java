package tn.sesame.driveeasy.location.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record LocationRequestDto(
        @NotNull(message = "L'identifiant du client est obligatoire")
        Long clientId,

        @NotNull(message = "L'identifiant du véhicule est obligatoire")
        Long vehiculeId,

        @NotNull(message = "La date de début est obligatoire")
        LocalDate dateDebut,

        @NotNull(message = "La date de fin prévue est obligatoire")
        LocalDate dateFinPrevue,

        @Min(value = 0, message = "Le kilométrage de départ ne peut pas être négatif")
        int kmDepart
) {}
