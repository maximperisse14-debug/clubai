'use client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Row {
  id: string
  date: string
  type_evenement: string
  dj_nom?: string | null
  freq_reelle?: number | null
  taux_remplissage?: number | null
  ca_total?: number | null
  panier_moyen?: number | null
  satisfaction?: number | null
}

export default function SoireesTable({ data }: { data: Row[] }) {
  if (!data.length) {
    return <p className="text-center text-muted-foreground py-8">Aucune soirée enregistrée</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>DJ</TableHead>
          <TableHead className="text-right">Fréq.</TableHead>
          <TableHead className="text-right">Taux</TableHead>
          <TableHead className="text-right">CA total</TableHead>
          <TableHead className="text-right">Panier</TableHead>
          <TableHead className="text-right">Satis.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{format(new Date(row.date), 'd MMM yyyy', { locale: fr })}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-xs">{row.type_evenement}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{row.dj_nom ?? '—'}</TableCell>
            <TableCell className="text-right">{row.freq_reelle ?? '—'}</TableCell>
            <TableCell className="text-right">
              {row.taux_remplissage != null
                ? <span className={row.taux_remplissage >= 80 ? 'text-emerald-500' : row.taux_remplissage >= 50 ? 'text-amber-500' : 'text-red-400'}>
                    {Math.round(row.taux_remplissage)}%
                  </span>
                : '—'}
            </TableCell>
            <TableCell className="text-right">{row.ca_total != null ? `${(row.ca_total / 1000).toFixed(1)}k €` : '—'}</TableCell>
            <TableCell className="text-right">{row.panier_moyen != null ? `${Number(row.panier_moyen).toFixed(1)} €` : '—'}</TableCell>
            <TableCell className="text-right">{row.satisfaction != null ? `★ ${Number(row.satisfaction).toFixed(1)}` : '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
