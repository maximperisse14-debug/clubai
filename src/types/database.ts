export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: { id: string; nom: string; capacite: number; ville: string | null; adresse: string | null; created_at: string; owner_id: string }
        Insert: { id?: string; nom: string; capacite?: number; ville?: string; adresse?: string; owner_id: string }
        Update: { nom?: string; capacite?: number; ville?: string; adresse?: string }
      }
      djs: {
        Row: { id: string; club_id: string; nom: string; cout_base: number; actif: boolean; created_at: string }
        Insert: { club_id: string; nom: string; cout_base?: number; actif?: boolean }
        Update: { nom?: string; cout_base?: number; actif?: boolean }
      }
      soirees: {
        Row: {
          id: string; club_id: string; dj_id: string | null; date: string
          jour: string; mois: number; semaine: number; type_evenement: string
          nom_evenement: string | null; meteo: string | null; temperature_c: number | null
          concurrence: string; vacances_scolaires: boolean; veille_ferie: boolean
          evenement_local: boolean; prix_entree: number
          budget_com: number; staff: number; heure_ouverture: string; heure_fermeture: string
          canal_acquisition: string; created_at: string
        }
        Insert: {
          club_id: string; dj_id?: string; date: string; jour: string
          type_evenement: string; nom_evenement?: string; meteo?: string
          temperature_c?: number; concurrence?: string; vacances_scolaires?: boolean
          veille_ferie?: boolean; evenement_local?: boolean
          prix_entree?: number; budget_com?: number; staff?: number
          heure_ouverture?: string; heure_fermeture?: string; canal_acquisition?: string
        }
        Update: Partial<Database['public']['Tables']['soirees']['Insert']>
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
          ca_bar?: number; ca_entrees?: number; panier_moyen?: number
          charges_variables?: number; satisfaction?: number
          nb_avis_google?: number; nb_stories_ig?: number; reach_ig?: number
        }
        Update: Partial<Database['public']['Tables']['resultats']['Insert']>
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
      }
    }
    Views: {
      soirees_completes: { Row: Record<string, unknown> }
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
