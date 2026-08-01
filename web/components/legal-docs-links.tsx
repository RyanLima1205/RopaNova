import Link from "next/link"

const LEGAL_DOCS = [
  { href: "/terminos", label: "Términos y Condiciones" },
  { href: "/privacidad", label: "Política de Privacidad" },
  { href: "/devoluciones", label: "Política de Devoluciones" },
  { href: "/entrega", label: "Envío y Entrega" },
]

/** Enlaces cruzados entre los 4 documentos legales — se muestra al pie de cada uno. */
export function LegalDocsLinks({ current }: { current: string }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <p className="text-xs font-medium text-gray-500 mb-3">Otros documentos legales</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {LEGAL_DOCS.filter((doc) => doc.href !== current).map((doc) => (
          <Link key={doc.href} href={doc.href} className="text-emerald-600 hover:underline">
            {doc.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
