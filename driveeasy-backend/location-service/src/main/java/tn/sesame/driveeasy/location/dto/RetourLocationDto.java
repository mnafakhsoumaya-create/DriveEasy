package tn.sesame.driveeasy.location.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RetourLocationDto(
        @NotNull(message = "Le kilométrage de retour est obligatoire")
        @Min(value = 0, message = "Le kilométrage doit être positif")
        Integer kmRetour,

        LocalDate dateRetourEffectif
) {}
