"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useSession } from "@/components/session-provider";
import { useCatalogue } from "@/components/catalogue-provider";
import { searchProducts, idleSuggestions, resultCategories, trendingTerms } from "@/lib/search";
import { ProductPlate } from "@/components/product-plate";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { itemCount, items, removeItem, updateQuantity } = useCart();
  const { isAuthenticated, logout } = useSession();
  const { products, categories: catalogueCategories } = useCatalogue();
  const router = useRouter();
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  useEffect(() => {
    if (mobileOpen || cartOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const handleOpenSearch = () => setSearchOpen(true);
    const handleOpenCart = () => setCartOpen(true);
    document.addEventListener('open-search', handleOpenSearch);
    document.addEventListener('open-cart', handleOpenCart);

    return () => { 
      document.body.style.overflow = ""; 
      document.removeEventListener('open-search', handleOpenSearch);
      document.removeEventListener('open-cart', handleOpenCart);
    };
  }, [mobileOpen, cartOpen, searchOpen]);

  const query = searchQuery.trim();
  const results = query ? searchProducts(products, query) : idleSuggestions(products);
  const categories = resultCategories(results);
  const trending = trendingTerms(products);

  const closeAll = () => {
    setMobileOpen(false);
    setCartOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <div id="ann">
        <span>FREE SHIPPING ABOVE ₹999</span>
      </div>

      <header id="hdr">
        <div className="wrap hdr-in">
          <button className="icobtn only-m" aria-label="Menu" onClick={() => setMobileOpen(true)}>
            <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"></path></svg>
          </button>
          
          <Link href="/" className="logo" aria-label="Berozgar home" onClick={closeAll}>
            BEROZGAR
          </Link>
          
          <nav className="nav only-d" aria-label="Main">
            <Link href="/shop" data-nav="shop">SHOP</Link>
            <Link href="/collections" data-nav="collections">COLLECTIONS</Link>
            <Link href="/collections/drop-001" data-nav="drops">DROPS</Link>
            <Link href="/lookbook" data-nav="lookbook">LOOKBOOK</Link>
            <Link href="/journal" data-nav="journal">JOURNAL</Link>
          </nav>
          
          {/*
            Search, wishlist and account are desktop-only here because the mobile
            bottom nav already carries all three. Showing both put two search
            buttons on screen at once. The bag stays at every width: it is the
            only control the bottom nav does not have, and it carries the count.
          */}
          <div className="hicons">
            <button className="icobtn only-d" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.5-4.5"></path></svg>
            </button>
            <Link className="icobtn only-d" href="/account/wishlist" aria-label="Wishlist">
              <svg viewBox="0 0 24 24"><path d="M12 21C7 16.5 3 13.2 3 9.1 3 6.3 5.2 4 8 4c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.3 5 5.1 0 4.1-4 7.4-9 11.9z"></path></svg>
            </Link>
            <Link className="icobtn only-d" href={isAuthenticated ? "/account" : "/login"} aria-label="Account">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"></path></svg>
            </Link>
            <button className="icobtn" aria-label={itemCount > 0 ? `Bag, ${itemCount} items` : "Bag"} onClick={() => setCartOpen(true)}>
              <svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path></svg>
              {itemCount > 0 && <span className="cnt">{itemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mega Menu - desktop only */}
      <div id="mega" className="only-d">
        <div className="mega-in">
          <div>
            <h4>CATEGORIES</h4>
            {catalogueCategories.map((category) => (
              <Link key={category.slug} className="mg" href={`/shop?cat=${category.slug}`}>{category.name}</Link>
            ))}
          </div>
          <div>
            <h4>FEATURED</h4>
            <Link className="mg" href="/shop?sort=newest">NEW ARRIVALS</Link>
            <Link className="mg" href="/shop?sort=best">BEST SELLERS</Link>
            <Link className="mg" href="/collections/drop-001">DROP 001</Link>
            {products.some((p) => p.compareAt) && <Link className="mg" href="/shop?cat=sale">SALE</Link>}
          </div>
          <Link href="/collections/drop-001" className="mega-plate" aria-label="Shop Drop 001">
            <div className="plate t2" role="img" aria-label="Drop 001">
              <span className="pl-num">64</span>
              <span className="pl-word">DROP 001</span>
              <span className="pl-tag">UNEMPLOYED</span>
              <span className="pl-vert">BEROZGAR</span>
            </div>
            <span className="pl-tag" style={{ zIndex: 2 }}>SHOP DROP 001 →</span>
          </Link>
        </div>
      </div>

      {/* Overlays Scrim */}
      <div id="scrim" className={mobileOpen || cartOpen || searchOpen ? "open" : ""} onClick={closeAll}></div>

      {/* Mobile Nav Drawer */}
      <aside id="mnav" className={`ovl ${mobileOpen ? "open" : ""}`} aria-label="Mobile menu" style={{ left: 0, right: 'auto', transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', borderLeft: 'none', borderRight: '1px solid var(--gy)' }}>
        <div className="ovl-head">
          <b>BEROZGAR</b>
          <button className="xbtn" aria-label="Close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>
        <nav className="mnav-list" onClick={closeAll}>
          <Link href="/shop">SHOP</Link>
          <Link href="/shop?sort=newest">NEW ARRIVALS</Link>
          <Link href="/shop?sort=best">BEST SELLERS</Link>
          <Link href="/collections/drop-001">DROPS</Link>
          <Link href="/collections">COLLECTIONS</Link>
          <Link href="/lookbook">LOOKBOOK</Link>
          <Link href="/journal">JOURNAL</Link>
          <Link href="/about">ABOUT</Link>
        </nav>
        <div className="mnav-sub" onClick={closeAll}>
          <Link href="/account">ACCOUNT</Link>
          <Link href="/account/wishlist">WISHLIST</Link>
          <Link href="/track-order">TRACK ORDER</Link>
          <Link href="/help/contact">CONTACT</Link>
          {isAuthenticated ? (
            <Link href="/" onClick={() => logout()}>LOG OUT</Link>
          ) : (
            <Link href="/login">LOG IN</Link>
          )}
        </div>
      </aside>

      {/* Cart Drawer */}
      <aside id="cart-drawer" className={`ovl ${cartOpen ? "open" : ""}`} aria-label="Bag">
        <div className="ovl-head">
          <b>YOUR BAG</b>
          <button className="xbtn" aria-label="Close" onClick={() => setCartOpen(false)}>✕</button>
        </div>
        <div id="cd-body" style={{ flex: 1, overflowY: 'auto', padding: '0 22px', display: 'flex', flexDirection: 'column' }}>
          {items.length === 0 ? (
            <div className="empty" style={{ padding: '70px 10px' }}>
              <h2 className="h3">YOUR BAG IS EMPTY.</h2>
              <p className="small mut">NOTHING HERE YET.</p>
              <button className="btn btn-o" style={{ marginTop: '20px' }} onClick={() => { setCartOpen(false); }}>START SHOPPING</button>
            </div>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                {items.map((item) => (
                  <div key={item.variantId} className="ci">
                    <Link href={`/shop/${item.product.slug}`} className="th" onClick={closeAll}>
                      <ProductPlate product={item.product} variant={0} />
                    </Link>
                    <div style={{ display: "flex", flexDirection: "column", padding: "4px 0" }}>
                      <Link href={`/shop/${item.product.slug}`} className="nm" onClick={closeAll}>{item.product.name}</Link>
                      <div className="mt">SIZE: {item.size} · {item.colour}</div>
                      <div className="qty">
                        <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>-</button>
                        <b>{item.quantity}</b>
                        <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.variantId)} className="rm" style={{ alignSelf: "flex-start", marginTop: "auto" }}>REMOVE</button>
                    </div>
                    <div style={{ padding: "4px 0", fontWeight: 700, fontSize: "14px" }}>
                      ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: '24px', paddingBottom: '24px', borderTop: '1px solid var(--gy)', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 800 }}>
                  <span>SUBTOTAL</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <p className="small mut" style={{ marginTop: "-8px", marginBottom: "16px" }}>+ GST and shipping at checkout</p>
                <Link href="/checkout" className="btn btn-bk btn-full" onClick={closeAll}>CHECKOUT</Link>
                <Link href="/cart" className="btn btn-o btn-full" style={{ marginTop: '12px' }} onClick={closeAll}>VIEW BAG</Link>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Search Overlay */}
      <div id="search" role="dialog" aria-label="Search" className={searchOpen ? "open" : ""}>
        <div className="s-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="cap">SEARCH BEROZGAR</span>
            <button className="xbtn" aria-label="Close" onClick={closeAll}>✕</button>
          </div>
          <div className="s-input">
            <svg viewBox="0 0 24 24" style={{ width: '26px', height: '26px', stroke: 'var(--bk)', fill: 'none', strokeWidth: 1.6 }}>
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M21 21l-4.5-4.5"></path>
            </svg>
            <input 
              id="s-q" 
              type="text" 
              placeholder="oversized black tee" 
              autoComplete="off" 
              autoFocus={searchOpen} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query) {
                  closeAll();
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
            />
          </div>
          
          {!query && (
            <div className="s-sec">
              <h4>TRENDING</h4>
              <div className="s-trend">
                {trending.map(term => (
                  <button key={term} className="chip" onClick={() => setSearchQuery(term)}>
                    {term.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="s-sec s-res">
            {query && results.length === 0 ? (
              <>
                <h4>PRODUCTS</h4>
                <p className="s-none">NO RESULTS FOR &quot;{searchQuery.toUpperCase()}&quot;</p>
                {trending.length > 0 && <p className="small mut">Try: {trending.join(" · ")}</p>}
              </>
            ) : (
              <>
                {categories.length > 0 && (
                  <>
                    <h4>CATEGORIES</h4>
                    <div className="s-trend" style={{ marginBottom: '22px' }}>
                      {categories.map(([slug, label]) => (
                        <Link key={slug} className="chip" href={`/shop?cat=${slug}`} onClick={closeAll}>
                          {label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h4>PRODUCTS</h4>
                  {query && (
                    <Link
                      className="tlink"
                      style={{ border: 0 }}
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={closeAll}
                    >
                      ALL RESULTS →
                    </Link>
                  )}
                </div>
                {results.map(product => (
                  <Link key={product.id} href={`/shop/${product.slug}`} onClick={closeAll}>
                    <span className="th"><ProductPlate product={product} variant={0} /></span>
                    <span>
                      <b>{product.name}</b>
                      <br />
                      <span className="price small">₹{product.price.toLocaleString("en-IN")}</span>
                    </span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
