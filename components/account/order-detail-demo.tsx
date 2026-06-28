import { SafeImage } from "@/components/shared/safe-image";
import { formatProductPrice } from "@/lib/data/products";
import type { DemoOrder } from "@/lib/types/skxnz-data";
import { skxnzFallbackAssets } from "@/src/lib/assets";

export function OrderDetailDemo({ order }: { order: DemoOrder }) {
  return (
    <div className="border-t border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="grid min-w-0 gap-4 rounded-[26px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-surface)] p-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_7rem]"
            >
              <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[var(--skxnz-card)]">
                <SafeImage
                  src={item.image || skxnzFallbackAssets.product}
                  fallbackSrc={skxnzFallbackAssets.product}
                  alt={item.productName}
                  fill
                  sizes="88px"
                  className="object-cover object-center"
                />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-sangria">
                  {item.brandName || "SKXNZ Demo"}
                </p>
                <h4 className="mt-2 line-clamp-2 break-words text-base font-black text-midnightbrown">
                  {item.productName}
                </h4>
                <p className="mt-2 text-sm text-stone">
                  {item.selectedSize || "One Size"} ·{" "}
                  {item.selectedColor || "Default"} · Qty {item.quantity}
                </p>
              </div>
              <div className="min-w-0 text-left sm:text-right">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-stone">
                  Line total
                </p>
                <p className="mt-2 font-black text-sangria">
                  {formatProductPrice(item.lineTotal)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <aside className="min-w-0 rounded-[26px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-surface)] p-5 text-sm leading-7 text-stone">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-sangria">
            Demo order details
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="font-black uppercase tracking-[0.12em] text-midnightbrown">
                Ship to
              </p>
              <p className="mt-2">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 ? (
                <p>{order.shippingAddress.line2}</p>
              ) : null}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
            </div>
            <div className="rounded-[22px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-maroon-deep)] p-4 text-[var(--skxnz-text-light)]">
              <p className="flex justify-between gap-3">
                <span>Subtotal</span>
                <span>{formatProductPrice(order.subtotal)}</span>
              </p>
              <p className="mt-2 flex justify-between gap-3">
                <span>Delivery</span>
                <span>Demo estimate only</span>
              </p>
              <p className="mt-3 flex justify-between gap-3 text-base font-black">
                <span>Total</span>
                <span>{formatProductPrice(order.total)}</span>
              </p>
            </div>
            <p className="rounded-[20px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-midnightbrown">
              {order.note}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
