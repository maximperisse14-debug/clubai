export interface CoeffMeteo { pluie: number; vent: number; soleil: number }

export const COEFF_METEO_REGION: Record<string, CoeffMeteo> = {
  'PACA':                    { pluie: 1.40, vent: 1.20, soleil: 1.15 },
  'Occitanie':               { pluie: 1.25, vent: 1.10, soleil: 1.10 },
  'Normandie':               { pluie: 0.75, vent: 0.95, soleil: 0.90 },
  'Bretagne':                { pluie: 0.80, vent: 1.10, soleil: 1.00 },
  'Île-de-France':           { pluie: 1.00, vent: 0.90, soleil: 0.95 },
  'Auvergne-Rhône-Alpes':    { pluie: 1.00, vent: 1.00, soleil: 1.00 },
  'Nouvelle-Aquitaine':      { pluie: 1.10, vent: 1.00, soleil: 1.05 },
  'Pays de la Loire':        { pluie: 0.95, vent: 1.00, soleil: 1.00 },
  'Grand Est':               { pluie: 0.95, vent: 0.95, soleil: 0.95 },
  'Hauts-de-France':         { pluie: 0.90, vent: 1.05, soleil: 0.90 },
  'Bourgogne-Franche-Comté': { pluie: 0.95, vent: 0.95, soleil: 0.95 },
  'Centre-Val de Loire':     { pluie: 0.98, vent: 0.98, soleil: 0.98 },
  'Corse':                   { pluie: 1.30, vent: 1.30, soleil: 1.20 },
}

export const COEFF_METEO_TYPE_LIEU: Record<string, CoeffMeteo> = {
  'bar_interieur':       { pluie: 0.60, vent: 0.60, soleil: 0.85 },
  'bar_avec_terrasse':   { pluie: 1.30, vent: 1.10, soleil: 1.30 },
  'bar_rooftop':         { pluie: 1.80, vent: 1.80, soleil: 1.60 },
  'club_interieur':      { pluie: 0.40, vent: 0.50, soleil: 0.70 },
  'club_avec_terrasse':  { pluie: 1.40, vent: 1.20, soleil: 1.35 },
  'club_rooftop':        { pluie: 1.80, vent: 1.80, soleil: 1.60 },
}

export const COEFF_METEO_ACCESSIBILITE: Record<string, CoeffMeteo> = {
  'centre_ville':      { pluie: 0.80, vent: 0.85, soleil: 1.00 },
  'hors_centre_ville': { pluie: 1.20, vent: 1.15, soleil: 0.95 },
}
