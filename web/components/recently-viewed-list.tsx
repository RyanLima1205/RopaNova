"use client"

import Link from "next/link"
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed"
import { formatPrice } from "@/lib/formatters"

export function RecentlyViewedList() {
  const { recentlyViewed, getTimeAgo } = useRecentlyViewed()

  if (!recentlyViewed.length) return null

  return (
    <div className="my-2 mb-4">
      <h3 className="font-bold text-base text-gray-900 ml-2 mb-1">Vistos Recientemente</h3>
      <div className="flex overflow-x-auto gap-1.5 px-2 py-2 scrollbar-hide">
        {recentlyViewed.map((item) => (
          <Link
            key={item.id}
            href={`/producto/${item.id}`}
            className="w-[120px] shrink-0 bg-white rounded-lg p-2 shadow-sm flex flex-col items-center"
          >
            <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-20 h-20 rounded-md object-cover bg-gray-100 mb-1.5" />
            <p className="text-xs text-gray-700 font-medium w-full truncate">{item.title}</p>
            <p className="text-brand-ui font-bold text-sm w-full truncate">{formatPrice(item.price)}</p>
            <p className="text-[11px] text-gray-500 w-full truncate">{getTimeAgo(item.viewedAt)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
