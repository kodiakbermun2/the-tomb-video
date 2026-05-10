import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="space-y-5 pb-8">
      <header className="noise-panel rounded-xl p-5 sm:p-7">
        <p className="text-sm uppercase tracking-[0.22em] text-zinc-300">The Tomb Video</p>
        <h1 className="tomb-title mt-2 text-4xl !text-[#c9ff37] sm:text-6xl">About Us</h1>
        <div className="mt-3 max-w-3xl space-y-3 text-sm text-zinc-200 sm:text-base">
          <p>
            The Tomb Video is an owner-operated physical media storefront focused on horror,
            sci-fi, cult, and oddball cinema. We hand-source every title and document condition
            details so buyers know exactly what they are getting.
          </p>
          <p>
            Many of these items are from our personal collections. Others are secondhand thrifted
            goods saved from a fate of rotting in a basement for decades or getting tossed into a
            trash compactor. Because of this, the conditions of items in stock vary greatly. Some
            are new or gently used. Some are in dire states from being passed down, thrown around,
            and packed and unpacked time and time again. We believe that well-loved items deserve
            a second chance just as much as shrink-wrapped ones. They have earned their tattered
            covers and banged-up corners. Every dog-eared page tells a story of its own. Every
            scratched disc comes from somebody that rocked it till the wheels came off.
          </p>
          <p>
            Our goal is to keep physical media in circulation, put these pieces into the hands of
            people who will appreciate them, and make sure each listing tells the truth before it
            reaches your shelf.
          </p>
        </div>
      </header>

      <section className="noise-panel rounded-xl p-5 sm:p-6">
        <h2 className="tomb-title text-4xl !text-[#c9ff37] sm:text-6xl">Store & Owners</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-200 sm:text-base">
          We run this shop directly, from intake and grading to listing and shipping. Every product
          listing is reviewed manually with notes on condition, format, and region compatibility.
          The Tomb Video is operated out of northern California and co-owned by two life-long
          physical media collectors. Over the years our collections have gotten so big that we
          have to cull some of the doubles and triples of things we have accumulated to make shelf
          space. We are also avid thrifters who love finding treasures out in the wild. You will
          see a little bit of both here on the site. We are also interested in purchasing
          collections or lots: if you have physical media to sell, we might be interested. You can
          contact us directly at thetombvideo@gmail.com for inquiries.
        </p>
      </section>

      <section className="noise-panel rounded-xl p-5 sm:p-6">
        <h2 className="tomb-title text-4xl !text-[#c9ff37] sm:text-6xl">Policies</h2>
        <div className="mt-2 space-y-3 text-sm leading-relaxed text-zinc-200 sm:text-base">
          <p>
            All items are sold as described in each listing. Condition notes and known defects are
            included whenever applicable.
          </p>
          <p>
            Region-code and format compatibility are listed in product metadata. Buyers are
            responsible for confirming playback compatibility with their hardware.
          </p>
          <p>
            We ship almost everything via Media Mail, especially with rising postage costs, and
            orders are always packaged with care. We also often reuse shipping materials so we can
            keep product and shipping prices as low as possible. If you are unhappy with the way
            your order was packaged, please reach out to us at thetombvideo@gmail.com.
          </p>
          <p>
            We are open to discussing refunds or returns when appropriate. However, we have a
            strict NO refunds or returns policy on items marked sold-as-is in the product
            description. Please read item descriptions carefully; many items on the site are
            pre-owned and range in quality from like-new to quite poor. We are very honest about
            condition, so it is your responsibility as the customer to have realistic expectations
            when buying any item marked below Excellent or Very Good.
          </p>
          <p>
            If an order arrives with a problem that does not match the listing, contact us and we
            will work toward a fair resolution.
          </p>
        </div>
      </section>
    </main>
  );
}
