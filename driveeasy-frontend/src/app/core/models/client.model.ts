export type CategorieClient = 'STANDARD' | 'FIDELE' | 'VIP';

export interface Client {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  email: string;
  telephone: string;
  adresse: string;
  numeroPermis: string;
  dateExpirationPermis: string;
  categorieClient: CategorieClient;
  dateInscription?: string;
  eligible: boolean;
}

export interface ClientRequest {
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  email: string;
  telephone: string;
  adresse: string;
  numeroPermis: string;
  dateExpirationPermis: string;
}

export interface EligibiliteResponse {
  clientId: number;
  nomComplet: string;
  eligible: boolean;
  age: number;
  ageValide: boolean;
  dateExpirationPermis: string;
  permisValide: boolean;
  motif: string;
}
