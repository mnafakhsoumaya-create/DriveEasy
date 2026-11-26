package tn.sesame.driveeasy.client.dto;

import jakarta.validation.constraints.*;
import tn.sesame.driveeasy.client.model.CategorieClient;

import java.time.LocalDate;

public record ClientRequestDto(
        @NotBlank(message = "Le CIN est obligatoire")
        String cin,

        @NotBlank(message = "Le nom est obligatoire")
        String nom,

        @NotBlank(message = "Le prénom est obligatoire")
        String prenom,

        @NotNull(message = "La date de naissance est obligatoire")
        @Past(message = "La date de naissance doit être dans le passé")
        LocalDate dateNaissance,

        @NotBlank(message = "L'adresse email est obligatoire")
        @Email(message = "Format d'adresse email invalide")
        String email,

        @NotBlank(message = "Le numéro de téléphone est obligatoire")
        String telephone,

        @NotBlank(message = "L'adresse est obligatoire")
        String adresse,

        @NotBlank(message = "Le numéro de permis est obligatoire")
        String numeroPermis,

        @NotNull(message = "La date d'expiration du permis est obligatoire")
        LocalDate dateExpirationPermis,

        CategorieClient categorieClient
) {}
