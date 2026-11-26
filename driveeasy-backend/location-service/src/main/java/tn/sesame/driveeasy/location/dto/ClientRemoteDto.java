package tn.sesame.driveeasy.location.dto;

public record ClientRemoteDto(
        Long id,
        String cin,
        String nom,
        String prenom,
        String email,
        String telephone,
        String categorieClient
) {}
