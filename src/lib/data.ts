/*
 * Editorial content — journal articles and lookbook looks.
 *
 * Intentionally local: this is brand storytelling with no ERP process behind it
 * (docs/INTEGRATION.md §3). Unlike products and orders, it is not a seam.
 *
 * Products are referenced by SLUG, not by id.
 *
 * ERP product ids are cuids — opaque, generated, and impossible to curate by
 * hand. These lists used to hold ids like "tee-black" that matched nothing, so
 * "SHOP THE STORY" and "IN THIS LOOK" silently rendered empty. A slug is the
 * lower-cased SKU, which is stable, human-readable and already the URL key, so
 * whoever writes the editorial can pick products without touching the database.
 *
 * A slug that no longer exists is skipped rather than rendered as a gap.
 */
export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  featured: boolean;
  body: string[];
  relatedSlugs: string[];
};

export type Look = {
  slug: string;
  name: string;
  itemSlugs: string[];
  size: string;    // Grid span class: look-a | look-b
};

export const articles: Article[] = [
  {
    slug: "the-culture-behind-the-clothes",
    title: "THE CULTURE BEHIND THE CLOTHES",
    category: "CULTURE",
    date: "12 AUG",
    readTime: "6 MIN",
    featured: true,
    body: ["Streetwear in India stopped being a borrowed language the moment it started speaking about our own reality. Berozgar — unemployed — was a word people whispered. We put it on a shirt.", "Drop 001 is not a moodboard of New York or Tokyo. It is a statement made on our streets, in our traffic, against our expectations.", "The culture behind the clothes is simple: you don't need permission to build something. You need a reason. And \"Unemployed For A Reason\" is ours."],
    relatedSlugs: ["bz-ts-classic", "bz-ts-oversized"]
  },
  {
    slug: "how-streetwear-changed-india",
    title: "HOW STREETWEAR CHANGED INDIA",
    category: "STREETWEAR",
    date: "28 JUL",
    readTime: "8 MIN",
    featured: false,
    body: ["From college canteens to metro stations, a uniform emerged — oversized, heavy, unhurried.", "The new Indian streetwear customer doesn't want logos of someone else's dream. They want clothes that say something about their own.", "That shift is why Drop 001 exists."],
    relatedSlugs: ["bz-ts-oversized", "bz-ts-premium"]
  },
  {
    slug: "240-gsm-why-fabric-weight-matters",
    title: "240 GSM: WHY FABRIC WEIGHT MATTERS",
    category: "FASHION",
    date: "14 JUL",
    readTime: "4 MIN",
    featured: false,
    body: ["GSM — grams per square metre — is the difference between a tee that drapes and a tee that disappears.", "Under 180 GSM, a shirt clings. Over 220, it stands. Our oversized system starts at 240 and goes up from there.", "Weight is not luxury for its own sake. It is structure. It is silhouette. It is the shirt you reach for without thinking."],
    relatedSlugs: ["bz-ts-premium", "bz-ts-classic"]
  },
  {
    slug: "inside-drop-001",
    title: "INSIDE DROP 001",
    category: "BRAND STORIES",
    date: "02 JUL",
    readTime: "5 MIN",
    featured: false,
    body: ["Everything in Drop 001 was argued over. The cargo pocket count. The hood weight. The exact black.", "We rejected 14 samples before the first tee was right.", "THE SYSTEM DOESN'T DEFINE YOU. So we built our own."],
    relatedSlugs: ["bz-ts-oversized", "bz-ts-dryfit"]
  }
];

export const looks: Look[] = [
  {
    slug: "look-01",
    name: "LOOK 01",
    itemSlugs: ["bz-ts-classic", "bz-ts-oversized"],
    size: "look-a"
  },
  {
    slug: "look-02",
    name: "LOOK 02",
    itemSlugs: ["bz-ts-premium", "bz-ts-oversized"],
    size: "look-b"
  },
  {
    slug: "look-03",
    name: "LOOK 03",
    itemSlugs: ["bz-ts-oversized", "bz-ts-dryfit"],
    size: "look-b"
  },
  {
    slug: "look-04",
    name: "LOOK 04",
    itemSlugs: ["bz-ts-polo", "bz-ts-classic"],
    size: "look-a"
  }
];

/* Journal filter chips, in the order the reference shows them. */
export const journalCategories = ["ALL", "FASHION", "CULTURE", "MUSIC", "ART", "STREETWEAR", "BRAND STORIES"];

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function getLook(slug: string) {
  return looks.find((l) => l.slug === slug);
}
