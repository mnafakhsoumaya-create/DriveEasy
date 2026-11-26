package tn.sesame.driveeasy.vehicule.dto;

import jakarta.validation.constraints.*;
import tn.sesame.driveeasy.vehicule.model.BoiteVitesse;
import tn.sesame.driveeasy.vehicule.model.Carburant;
import tn.sesame.driveeasy.vehicule.model.CategorieVehicule;
import tn.sesame.driveeasy.vehicule.model.StatutVehicule;

import java.math.BigDecimal;

public record VehiculeRequestDto(
        @NotBlank(message = "L'immatriculation est obligatoire")
        String immatriculation,

        @NotBlank(message = "La marque est obligatoire")
        String marque,

        @NotBlank(message = "Le modèle est obligatoire")
        String modele,

        @Min(value = 1990, message = "L'année doit être supérieure ou égale à 1990")
        int annee,

        @NotBlank(message = "La couleur est obligatoire")
        String couleur,

        @NotNull(message = "Le carburant est obligatoire")
        Carburant carburant,

        @NotNull(message = "Le type de boîte est obligatoire")
        BoiteVitesse boite,

        @Min(value = 1, message = "Le nombre de places doit être au moins de 1")
        int nbPlaces,

        @Min(value = 0, message = "Le kilométrage ne peut pas être négatif")
        int kilometrage,

        @NotNull(message = "Le prix journalier est obligatoire")
        @DecimalMin(value = "0.01", inclusive = true, message = "Le prix journalier doit être strictement positif")
        BigDecimal prixJournalier,

        StatutVehicule statut,

        String imageUrl,

        @NotNull(message = "La catégorie est obligatoire")
        CategorieVehicule categorie
) {}
