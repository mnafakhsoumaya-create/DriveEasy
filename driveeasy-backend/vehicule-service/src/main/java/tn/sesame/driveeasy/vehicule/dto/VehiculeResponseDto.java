package tn.sesame.driveeasy.vehicule.dto;

import tn.sesame.driveeasy.vehicule.model.BoiteVitesse;
import tn.sesame.driveeasy.vehicule.model.Carburant;
import tn.sesame.driveeasy.vehicule.model.CategorieVehicule;
import tn.sesame.driveeasy.vehicule.model.StatutVehicule;

import java.math.BigDecimal;

public record VehiculeResponseDto(
        Long id,
        String immatriculation,
        String marque,
        String modele,
        int annee,
        String couleur,
        Carburant carburant,
        BoiteVitesse boite,
        int nbPlaces,
        int kilometrage,
        BigDecimal prixJournalier,
        StatutVehicule statut,
        String imageUrl,
        CategorieVehicule categorie
) {}
