package tn.sesame.driveeasy.vehicule.dto;

import jakarta.validation.constraints.NotNull;
import tn.sesame.driveeasy.vehicule.model.StatutVehicule;

public record StatutUpdateDto(
        @NotNull(message = "Le statut est obligatoire")
        StatutVehicule statut
) {}
