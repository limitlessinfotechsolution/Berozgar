"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { findVariant, sizeAvailable, type Product } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import { useCatalogue } from "@/components/catalogue-provider";
import { ProductCard } from "@/components/product-card";
import { PhotoPlate, Plate } from "@/components/product-plate";
import { RevealObserver } from "@/components/reveal-observer";
import { showToast } from "@/lib/ui-events";
import { SizeFinder, SizeChartTable, HowToMeasure } from "@/components/size-finder";
import { Swatch } from "@/components/swatch";
import { requestStockAlert } from "@/lib/audience";
import { PincodeCheck } from "@/components/pincode-check";
import { RecentlyViewed } from "@/components/recently-viewed";
import { ProductReviews } from "@/components/product-reviews";
import { useDialog } from "@/lib/use-dialog";
import { useShippingRule } from "@/components/store-settings-provider";
import { formatINR as inr } from "@/lib/money";

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { products } = useCatalogue();
  const freeFrom = inr(useShippingRule().freeFromMinor);

  const [size, setSize] = useState<string | null>(null);
  /* Start on a colour that can actually be bought. */
  const [color, setColor] = useState<string | null>(
    () => product.colors.find((c) => product.variants.some((v) => v.colour === c && v.stock > 0)) ?? product.colors[0] ?? null
  );
  const [qty, setQty] = useState(1);
  const [gallery, setGallery] = useState(0);
  const [openAcc, setOpenAcc] = useState(0);
  const [sizeGuide, setSizeGuide] = useState(false);
  const sizeDialog = useDialog<HTMLDivElement>(sizeGuide, () => setSizeGuide(false));
  const [stickyShown, setStickyShown] = useState(false);
  const mobTrack = useRef<HTMLDivElement>(null);

  /*
   * The dots follow the swipe. Slides are exactly one track wide, so the index is
   * the scroll offset over the track width — no observer needed, and it stays
   * correct mid-drag rather than only on snap.
   */
  function onMobScroll() {
    const track = mobTrack.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setGallery((current) => (index === current ? current : index));
  }

  /* Tapping a dot is the same movement as a swipe, so the handler above updates. */
  function goToSlide(index: number) {
    const track = mobTrack.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  const selected = size ? findVariant(product, size, color) : undefined;
  /* A size that exists in this colour but has none left: pickable, so the shopper
     can ask to be told when it's back. A size never made in this colour is not. */
  const selectedOut = Boolean(selected && selected.stock <= 0);
  const notifyMode = product.soldout || selectedOut;

  /* The sticky bar appears once the main add-to-bag button scrolls out of view. */
  useEffect(() => {
    const target = document.getElementById("pdp-atb");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyShown(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
    // Re-observe when the add-to-bag button is swapped for the notify form and back.
  }, [notifyMode]);

  /* globals.css hides the bottom nav while the buy bar is up. */
  useEffect(() => {
    const root = document.documentElement;
    if (stickyShown && !notifyMode) root.dataset.buybar = "";
    else delete root.dataset.buybar;
    return () => { delete root.dataset.buybar; };
  }, [stickyShown, notifyMode]);

  const hasPhotos = product.images.length > 0;
  const slides = hasPhotos ? product.images.length : 5;
  const alsoLike = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(products.filter((p) => p.id !== product.id && p.category !== product.category))
    .slice(0, 4);

  function pickColor(next: string) {
    setColor(next);
    /* Keep the size if it exists in the new colour — even sold out, for the alert. */
    if (size && !findVariant(product, size, next)) setSize(null);
  }

  function addToBag(openBag = true, buyNow = false) {
    if (!size || !selected) {
      showToast("SELECT A SIZE FIRST");
      document.getElementById("pdp-sizes")?.animate(
        [{ outline: "2px solid var(--ru)", outlineOffset: "4px" }, { outline: "0 transparent" }],
        { duration: 900 }
      );
      return;
    }
    if (selected.stock < qty) {
      showToast(`ONLY ${selected.stock} LEFT IN ${size}`);
      return;
    }
    addItem(product, selected, qty);
    showToast(`${product.name} ADDED TO BAG`);
    if (buyNow) router.push("/checkout");
    else if (openBag) document.dispatchEvent(new CustomEvent("open-cart"));
  }

  /* Only sections the ERP has data for — no invented fit or fabric copy. */
  const accordions: [string, React.ReactNode][] = [
    ...(product.description ? [["DESCRIPTION", <p key="d">{product.description}</p>] as [string, React.ReactNode]] : []),
    ...(product.fit ? [["FIT", <p key="f">{product.fit} FIT.</p>] as [string, React.ReactNode]] : []),
    ...(product.gsm || product.fabric
      ? [["FABRIC", <p key="b">{[product.gsm, product.fabric].filter(Boolean).join(" · ")}</p>] as [string, React.ReactNode]]
      : []),
    ["CARE", (
      <ul key="c" style={{ listStyle: "disc", paddingLeft: "18px" }}>
        <li>Machine wash cold</li>
        <li>Wash inside out</li>
        <li>Do not bleach</li>
        <li>Iron inside out</li>
      </ul>
    )],
    ["SHIPPING", <p key="s">Dispatched in 24h. Standard delivery 3–5 working days. FREE above {freeFrom}. Express available at checkout.</p>],
    /* Matches the Return, Replacement & Refund Policy: printed items are made to
       order, so claims cover damaged, defective or wrong items — not a change of
       mind or a size the customer chose. The window is an ERP setting, so it is
       linked rather than restated here. */
    ["RETURNS", (
      <p key="r">
        Damaged, defective or wrong item? Claim a free remake or a refund from your order page, shortly after
        delivery. Size changes aren&apos;t covered — check the size guide first.{" "}
        <Link href="/legal/refund" className="tlink">RETURN POLICY</Link>
      </p>
    )],
  ];

  const slide = (i: number) =>
    hasPhotos
      ? <PhotoPlate
          src={product.images[i]}
          label={`${product.name} — image ${i + 1}`}
          fallback={<Plate slug={product.slug} word={product.word} label={product.name} variant={i} />}
        />
      : <Plate slug={product.slug} word={product.word} label={product.name} variant={i} />;

  return (
    <div className="page-fade">
      <RevealObserver />
      <div className="wrap">
        {/* Desktop only: on a phone the first screen is for the product itself. */}
        <div className="crumb only-d">
          <Link href="/">HOME</Link> / <Link href="/shop">SHOP</Link> / {product.name}
        </div>

        <div className="pdp">
          <div className="pgal">
            <div className="pg-thumbs only-d">
              {Array.from({ length: slides }, (_, i) => (
                <button key={i} className={i === gallery ? "on" : ""} aria-label={`Image ${i + 1}`} onClick={() => setGallery(i)}>
                  {slide(i)}
                </button>
              ))}
            </div>
            <div className="pg-main" id="pg-main">
              {slide(Math.min(gallery, slides - 1))}
              {product.soldout ? <span className="badge sold">SOLD OUT</span>
                : product.compareAtMinor ? <span className="badge sale">SALE</span>
                : product.badges[0] ? <span className="badge">{product.badges[0]}</span>
                : null}
              {product.stock ? (
                <span className="badge low" style={{ top: "auto", bottom: "10px", left: "10px" }}>
                  ONLY {product.stock} LEFT
                </span>
              ) : null}
            </div>
          </div>

          {/*
            Mobile gallery. The wrapper carries only-m (and the badge and dots),
            so the track itself stays a plain flex scroller — putting them inside
            the scroller would drag them along with the swipe.
          */}
          <div className="pg-mobwrap only-m">
            <div
              className="pg-mob"
              ref={mobTrack}
              onScroll={onMobScroll}
              role="group"
              aria-label={`${product.name} gallery`}
            >
              {Array.from({ length: slides }, (_, i) => (
                <div className="slide" key={i}>{slide(i)}</div>
              ))}
            </div>

            {/* One badge only: a full-bleed image has no room to stack them. */}
            {product.soldout ? <span className="badge sold">SOLD OUT</span>
              : product.compareAtMinor ? <span className="badge sale">SALE</span>
              : product.badges[0] ? <span className="badge">{product.badges[0]}</span>
              : null}

            {/* Deliberately not role="tablist": these are jump controls, not tabs —
                there are no tab panels and no arrow-key handling, so claiming tabs
                would mislead a screen reader. aria-current marks the one in view. */}
            {slides > 1 && (
              <div className="pg-dots" role="group" aria-label="Gallery position">
                {Array.from({ length: slides }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={i === gallery ? "on" : ""}
                    aria-current={i === gallery}
                    aria-label={`Go to image ${i + 1} of ${slides}`}
                    onClick={() => goToSlide(i)}
                  >
                    <i />
                  </button>
                ))}
              </div>
            )}
          </div>

          {product.stock ? (
            <p className="cap mut pg-stock only-m">ONLY {product.stock} LEFT</p>
          ) : null}

          <div className="pinfo">
            <p className="eyebrow mut">{product.categoryName}</p>
            <h1 className="h1">{product.name}</h1>

            {product.compareAtMinor ? (
              <span className="price" style={{ fontSize: "22px" }}>
                <span className="sale-c">{inr(product.priceMinor)}</span>
                <s>{inr(product.compareAtMinor)}</s>
              </span>
            ) : (
              <span className="price" style={{ fontSize: "22px" }}>{inr(product.priceMinor)}</span>
            )}
            <p className="small mut" style={{ marginTop: "4px" }}>+ GST, calculated at checkout</p>
            {product.soldout && <p className="cap" style={{ color: "#999", marginTop: "8px" }}>SOLD OUT</p>}

            {product.colors.length > 0 && (
              <div className="sel-block">
                <div className="lbl"><span className="cap">COLOR</span></div>
                <div className="clrow">
                  {product.colors.map((c) => (
                    <button key={c} className={`cl ${color === c ? "on" : ""}`.trim()} onClick={() => pickColor(c)} aria-label={c}>
                      <Swatch name={c} />
                    </button>
                  ))}
                  <span className="cap" style={{ alignSelf: "center", marginLeft: "8px" }}>{color}</span>
                </div>
              </div>
            )}

            <div className="sel-block">
              <div className="lbl">
                <span className="cap">SIZE {product.fit ? `— ${product.fit}` : ""}</span>
                <button className="tlink" style={{ border: 0 }} onClick={() => setSizeGuide(true)}>SIZE GUIDE</button>
              </div>
              <div className="szrow" id="pdp-sizes">
                {product.sizes.map((s) => {
                  const oos = !sizeAvailable(product, s, color);
                  /* Not made in this colour at all — nothing to restock or ask for. */
                  const missing = color !== null && !findVariant(product, s, color);
                  return (
                    <button
                      key={s}
                      className={`sz ${oos ? "oos" : ""} ${size === s ? "on" : ""}`.replace(/\s+/g, " ").trim()}
                      disabled={missing}
                      aria-pressed={size === s}
                      aria-label={oos && !missing ? `${s}, sold out — choose to get a restock email` : s}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {selectedOut ? (
                <p className="pdp-note" role="status">{size} / {color} is sold out. Leave your email and we&apos;ll tell you when it&apos;s back.</p>
              ) : selected && selected.stock <= 5 ? (
                <p className="pdp-note">Hurry — only {selected.stock} left in {size} / {color}.</p>
              ) : product.stock ? (
                <p className="pdp-note">Hurry — only {product.stock} left in stock.</p>
              ) : null}
            </div>

            {!notifyMode && (
            <div className="sel-block">
              <div className="lbl"><span className="cap">QUANTITY</span></div>
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <b>{qty}</b>
                <button onClick={() => setQty((q) => Math.min(selected?.stock ?? 20, 20, q + 1))}>+</button>
              </div>
            </div>
            )}

            <div className="pdp-ctas">
              {notifyMode ? (
                <form
                  className="coupon"
                  id="pdp-notify"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const email = String(new FormData(form).get("email") ?? "").trim();
                    // Only promise an email once the ERP has stored the request. A sold-out
                    // size asks for that exact variant; a sold-out product for any of it.
                    const result = await requestStockAlert(email, product.id, selectedOut ? selected?.id : undefined);
                    if (result.ok) {
                      showToast("WE'LL EMAIL YOU WHEN IT'S BACK");
                      form.reset();
                    } else {
                      showToast(result.message);
                    }
                  }}
                >
                  <input type="email" name="email" required autoComplete="email" placeholder="YOUR EMAIL" aria-label="Email for a restock alert" />
                  <button type="submit">NOTIFY ME</button>
                </form>
              ) : (
                <>
                  <button className="btn btn-full" id="pdp-atb" onClick={() => addToBag(true)}>ADD TO BAG</button>
                  <button className="btn btn-o btn-full" onClick={() => addToBag(false, true)}>BUY NOW</button>
                </>
              )}
            </div>

            <p className="pdp-note">Dispatch in 24h · Free shipping above {freeFrom} · Free remake if it arrives damaged or wrong</p>

            <PincodeCheck />

            <div style={{ marginTop: "44px" }}>
              {accordions.map(([title, body], i) => (
                <div className={`acc ${openAcc === i ? "open" : ""}`.trim()} key={title}>
                  <button className="acc-h" onClick={() => setOpenAcc(openAcc === i ? -1 : i)}>
                    {title}<i>+</i>
                  </button>
                  <div className="acc-b">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Approved reviews from delivered orders; renders nothing until there is one. */}
        <ProductReviews slug={product.slug} />

        {alsoLike.length > 0 && (
          <section className="sec">
            <div className="wrap">
              <div className="sec-t"><h2 className="h2">YOU MAY ALSO LIKE</h2></div>
              <div className="grid4">
                {alsoLike.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        )}

        <RecentlyViewed record={product.id} exclude={product.id} />
      </div>

      {sizeGuide && (
        <div id="modal" className="open" onClick={(e) => { if (e.target === e.currentTarget) setSizeGuide(false); }}>
          <div className="modal-box" role="dialog" aria-label="Size guide" {...sizeDialog}>
            <button className="xbtn" style={{ position: "absolute", top: "10px", right: "10px" }} aria-label="Close" onClick={() => setSizeGuide(false)}>✕</button>
            <h3 className="h2" style={{ marginBottom: "20px" }}>SIZE GUIDE</h3>
            {/* The finder lives here, beside the size picker it answers — as a page
                section it sat between reviews and related products, far from both. */}
            <h4 className="cap" style={{ margin: "0 0 10px" }}>FIND YOUR SIZE</h4>
            <SizeFinder fit={(product.fit || "oversized").toLowerCase()} />
            <h4 className="cap" style={{ margin: "24px 0 10px" }}>SIZE CHART</h4>
            <SizeChartTable />
            <h4 className="cap" style={{ margin: "24px 0 10px" }}>HOW TO MEASURE</h4>
            <HowToMeasure />
          </div>
        </div>
      )}

      <div id="sticky-cta" aria-hidden={!stickyShown || notifyMode} className={stickyShown && !notifyMode ? "show" : ""}>
        <div>
          <span className="cap mut">{size ? `${product.name} / ${size}${color ? ` / ${color}` : ""}` : "SIZE REQUIRED"}</span>
          <br />
          <b className="price">{inr(product.priceMinor)}</b>
        </div>
        <button className="btn" onClick={() => addToBag(true)} aria-label="Add to bag">ADD TO BAG</button>
      </div>
    </div>
  );
}
