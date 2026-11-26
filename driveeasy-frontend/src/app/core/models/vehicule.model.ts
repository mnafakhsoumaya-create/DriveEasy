export type Carburant = 'ESSENCE' | 'DIESEL' | 'HYBRIDE' | 'ELECTRIQUE';
export type BoiteVitesse = 'MANUELLE' | 'AUTOMATIQUE';
export type CategorieVehicule = 'ECONOMIQUE' | 'BERLINE' | 'SUV' | 'LUXE' | 'UTILITAIRE';
export type StatutVehicule = 'DISPONIBLE' | 'LOUE' | 'MAINTENANCE';

export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  couleur: string;
  carburant: Carburant;
  boite: BoiteVitesse;
  nbPlaces: number;
  kilometrage: number;
  prixJournalier: number;
  statut: StatutVehicule;
  imageUrl?: string;
  categorie: CategorieVehicule;
}

export interface VehiculeRequest {
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  couleur: string;
  carburant: Carburant;
  boite: BoiteVitesse;
  nbPlaces: number;
  kilometrage: number;
  prixJournalier: number;
  statut?: StatutVehicule;
  imageUrl?: string;
  categorie: CategorieVehicule;
}

export interface VehiculeFilters {
  categorie?: CategorieVehicule | '';
  carburant?: Carburant | '';
  statut?: StatutVehicule | '';
  prixMax?: number | null;
}
