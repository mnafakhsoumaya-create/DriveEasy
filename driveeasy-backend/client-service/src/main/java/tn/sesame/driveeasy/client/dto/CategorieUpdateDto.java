package tn.sesame.driveeasy.client.dto;

import jakarta.validation.constraints.NotNull;
import tn.sesame.driveeasy.client.model.CategorieClient;

public record CategorieUpdateDto(
        @NotNull(message = "La catégorie de client est obligatoire")
        CategorieClient categorie
) {}
