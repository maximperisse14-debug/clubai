export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: { id: string; nom: string; capacite: number; ville: string | null; adresse: string | null; created_at: string; owner_id: string }
        Insert: { id?: string; nom: string; capacite?: number; ville?: string; adresse?: string; owner_id: string }
        Update: { nom?: string; capacite?: number; ville?: string; adresse?: string }
        Relationships: []
      }
      djs: {
        Row: { id: string; club_id: string; nom: string; cout_base: number; actif: boolean; created_at: string }
        Insert: { club_id: string; nom: string; cout_base?: number; actif?: boolean }
        Update: { nom?: string; cout_base?: number; actif?: boolean }
        Relationships: [
          { foreignKeyName: 'djs_club_id_fkey'; columns: ['club_id']; referencedRelation: 'clubs'; referencedColumns: ['id'] }
        ]
      }
      soirees: {
        Row: {
          id: string; club_id: string; dj_id: string | null; date: string
          jour: string; mois: number; semaine: number; type_evenement: string
          nom_evenement: string | null; meteo: string | null; temperature_c: number | null
          concurrence: string; vacances_scolaires: boolean; veille_ferie: boolean
          evenement_local: boolean; prix_entree: number
          budget_com: number; staff: number; heure_ouverture: string; heure_fermeture: string
          canal_acquisition: string
          promotion: string | null; offre_categorie: string | null
          prediction_freq: number | null; prediction_ca: number | null
          prediction_score_global: number | null; prediction_calculee_le: string | null
          prediction_freq_initiale: number | null; prediction_ca_initiale: number | null
          variation_freq_24h: number | null; variation_ca_24h: number | null
          created_at: string
        }
        Insert: {
          club_id: string; dj_id?: string | null; date: string; jour: string
          type_evenement: string; nom_evenement?: string | null; meteo?: string | null
          temperature_c?: number | null; concurrence?: string | null; vacances_scolaires?: boolean
          veille_ferie?: boolean; evenement_local?: boolean
          prix_entree?: number | null; budget_com?: number | null; staff?: number | null
          heure_ouverture?: string | null; heure_fermeture?: string | null; canal_acquisition?: string | null
          promotion?: string | null
          prediction_freq?: number | null; prediction_ca?: number | null
          prediction_score_global?: number; prediction_calculee_le?: string
        }
        Update: Partial<Database['public']['Tables']['soirees']['Insert']>
        Relationships: [
          { foreignKeyName: 'soirees_club_id_fkey'; columns: ['club_id']; referencedRelation: 'clubs'; referencedColumns: ['id'] },
          { foreignKeyName: 'soirees_dj_id_fkey'; columns: ['dj_id']; referencedRelation: 'djs'; referencedColumns: ['id'] }
        ]
      }
      resultats: {
        Row: {
          id: string; soiree_id: string; club_id: string
          freq_reelle: number | null; taux_remplissage: number | null
          ca_bar: number | null; ca_entrees: number | null; ca_total: number | null
          panier_moyen: number | null; charges_variables: number | null; marge_nette: number | null
          satisfaction: number | null; nb_avis_google: number; nb_stories_ig: number
          reach_ig: number; created_at: string
        }
        Insert: {
          soiree_id: string; club_id: string; freq_reelle?: number
          ca_bar?: number | null; ca_entrees?: number; panier_moyen?: number | null
          charges_variables?: number | null; satisfaction?: number | null
          nb_avis_google?: number; nb_stories_ig?: number; reach_ig?: number
        }
        Update: Partial<Database['public']['Tables']['resultats']['Insert']>
        Relationships: [
          { foreignKeyName: 'resultats_soiree_id_fkey'; columns: ['soiree_id']; referencedRelation: 'soirees'; referencedColumns: ['id'] }
        ]
      }
      coefficients: {
        Row: {
          id: string; club_id: string; dimension: string; valeur: string
          coef_freq: number | null; coef_ca: number | null; coef_panier: number | null
          impact_pct_freq: number | null; impact_pct_ca: number | null; impact_pct_panier: number | null
          freq_brute_moy: number | null; ca_brut_moy: number | null; panier_brut_moy: number | null
          nb_soirees: number | null; brut_rank_freq: number | null; brut_rank_ca: number | null
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      club_settings: {
        Row: {
          club_id: string
          type_etablissement: 'bar' | 'discotheque'; type_lieu: string; accessibilite: 'centre_ville' | 'hors_centre_ville'
          region: string; ville: string | null; adresse: string | null
          lat: number | null; lon: number | null
          zone_vacances: 'A' | 'B' | 'C' | null; idx_population: number
          pct_etudiants: number; pct_jeunes_actifs: number; pct_adultes: number
          panier_base: number
          jours_ouverture: string[] | null
          seuil_alerte_variation: number
          horaires_preferentiels: Json
          updated_at: string | null
        }
        Insert: {
          club_id: string
          type_etablissement?: 'bar' | 'discotheque'; type_lieu?: string; accessibilite?: 'centre_ville' | 'hors_centre_ville'
          region?: string; ville?: string | null; adresse?: string | null
          lat?: number | null; lon?: number | null
          zone_vacances?: 'A' | 'B' | 'C' | null; idx_population?: number
          pct_etudiants?: number; pct_jeunes_actifs?: number; pct_adultes?: number
          panier_base?: number
          jours_ouverture?: string[]
          seuil_alerte_variation?: number
          horaires_preferentiels?: Json
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['club_settings']['Insert']>
        Relationships: [
          { foreignKeyName: 'club_settings_club_id_fkey'; columns: ['club_id']; referencedRelation: 'clubs'; referencedColumns: ['id'] }
        ]
      }
      profiles: {
        Row: { id: string; role: string; created_at: string | null }
        Insert: { id: string; role?: string }
        Update: { role?: string }
        Relationships: []
      }
      concurrence_calendrier: {
        Row: {
          id: string; club_id: string | null; date: string
          directs_petites: number; directs_moyennes: number; directs_grosses: number
          lointains_petites: number; lointains_moyennes: number; lointains_grosses: number
          notes: string | null; updated_by: string | null; updated_at: string | null
        }
        Insert: {
          club_id: string; date: string
          directs_petites?: number; directs_moyennes?: number; directs_grosses?: number
          lointains_petites?: number; lointains_moyennes?: number; lointains_grosses?: number
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['concurrence_calendrier']['Insert']>
        Relationships: [
          { foreignKeyName: 'concurrence_calendrier_club_id_fkey'; columns: ['club_id']; referencedRelation: 'clubs'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: {
      soirees_completes: {
        Row: {
          id: string; club_id: string; dj_id: string | null; date: string
          jour: string; mois: number; semaine: number; type_evenement: string
          nom_evenement: string | null; meteo: string | null; temperature_c: number | null
          concurrence: string | null; vacances_scolaires: boolean | null; veille_ferie: boolean | null
          evenement_local: boolean | null; prix_entree: number | null
          budget_com: number | null; staff: number | null; heure_ouverture: string | null; heure_fermeture: string | null
          canal_acquisition: string | null
          prediction_freq: number | null; prediction_ca: number | null
          prediction_score_global: number | null; prediction_calculee_le: string | null
          created_at: string | null
          promotion: string | null; offre_categorie: string | null
          dj_nom: string | null; dj_cout_base: number | null
          freq_reelle: number | null; taux_remplissage: number | null
          ca_bar: number | null; ca_entrees: number | null; ca_total: number | null
          panier_moyen: number | null; charges_variables: number | null; marge_nette: number | null
          satisfaction: number | null; nb_avis_google: number | null; nb_stories_ig: number | null
          reach_ig: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      recalcul_coefficients: { Args: { p_club_id: string }; Returns: void }
    }
  }
}

export type Club = Database['public']['Tables']['clubs']['Row']
export type DJ = Database['public']['Tables']['djs']['Row']
export type Soiree = Database['public']['Tables']['soirees']['Row']
export type Resultat = Database['public']['Tables']['resultats']['Row']
export type Coefficient = Database['public']['Tables']['coefficients']['Row']
export type ClubSettingsRow = Database['public']['Tables']['club_settings']['Row']
export type SoireeComplete = Database['public']['Views']['soirees_completes']['Row']
