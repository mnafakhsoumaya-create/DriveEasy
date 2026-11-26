export type StatutLocation = 'RESERVEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Location {
  id: number;
  clientId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFinPrevue: string;
  dateRetourEffectif?: string | null;
  kmDepart: number;
  kmRetour?: number | null;
  prixJournalierApplique: number;
  montantTotal: number;
  penalite: number;
  statut: StatutLocation;
  dateCreation?: string;
}

export interface ClientRemote {
  id: number;
  nom: string;
  prenom: string;
  cin: string;
  email: string;
  telephone?: string;
  categorieClient: string;
  eligible?: boolean;
}

export interface VehiculeRemote {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  categorie: string;
  prixJournalier: number;
  statut: string;
  imageUrl?: string;
}

export interface LocationDetail extends Location {
  client?: ClientRemote | null;
  vehicule?: VehiculeRemote | null;
}

export interface LocationRequest {
  clientId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFinPrevue: string;
  kmDepart: number;
}

export interface SimulationRequest {
  clientId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFinPrevue: string;
}

export interface SimulationResponse {
  clientId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFinPrevue: string;
  nombreJours: number;
  prixJournalier: number;
  coefficientCategorie: number;
  montantBrut: number;
  tauxRemiseFidelite: number;
  montantRemise: number;
  montantTotalEstime: number;
  categorieClient: string;
  categorieVehicule: string;
}

export interface RetourLocationRequest {
  kmRetour: number;
  dateRetourEffectif: string;
}

export interface TopVehicule {
  vehiculeId: number;
  description: string;
  nombreLocations: number;
  chiffreGenere: number;
}

export interface Statistiques {
  chiffreAffairesTotal: number;
  chiffreAffairesMoisCourant: number;
  totalLocations: number;
  locationsEnCours: number;
  locationsTerminees: number;
  locationsReservees: number;
  locationsAnnulees: number;
  tauxOccupationParc: number;
  topVehicules: TopVehicule[];
}
