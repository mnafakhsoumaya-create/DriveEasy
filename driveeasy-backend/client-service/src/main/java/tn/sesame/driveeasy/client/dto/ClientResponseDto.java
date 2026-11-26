package tn.sesame.driveeasy.client.dto;

import tn.sesame.driveeasy.client.model.CategorieClient;

import java.time.LocalDate;

public record ClientResponseDto(
        Long id,
        String cin,
        String nom,
        String prenom,
        LocalDate dateNaissance,
        String email,
        String telephone,
        String adresse,
        String numeroPermis,
        LocalDate dateExpirationPermis,
        CategorieClient categorieClient,
        LocalDate dateInscription,
        boolean eligible
) {}
